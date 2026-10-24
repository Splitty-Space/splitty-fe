const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

const searchParams = load("const/searchParams.ts");

function renderPayment({editing = false, paidByMe = false, amount = 10, mutation, refresh, isExpenseRequestFailed = false} = {}) {
    const calls = {writes: [], routes: [], errors: [], successes: [], refreshKeys: [], refreshes: 0};
    const me = {id: 1, name: "Me"};
    const friend = {id: 2, name: "Friend", total: [{currency: "USD", amount: paidByMe ? -amount : amount}]};
    const state = {
        searchValue: "",
        setIsRequestErrorSnackbarShown: value => calls.errors.push(value),
        setIsCreateExpenseSnackbarShown: value => calls.successes.push(value),
        setIsUpdateExpenseSnackbarShown: value => calls.successes.push(value),
    };
    const expense = editing && !isExpenseRequestFailed ? {id: 3, amount, currency: "USD", date: "2026-09-20", expense_users: [
        {user: me, lent_amount: paidByMe ? amount : 0},
        {user: friend, lent_amount: paidByMe ? 0 : amount},
    ]} : null;
    const query = editing ? "expenseId=3" : "friendId=2&currency=USD";
    const write = async payload => {
        calls.writes.push(payload);
        if (mutation) await mutation();
    };
    const jsx = (type, props) => ({type, props});
    const mocks = {
        react: {useState: value => [value, () => {}], useRef: value => ({current: value}), useEffect: () => {}},
        "react/jsx-runtime": {jsx, jsxs: jsx, Fragment: "Fragment"},
        "react-i18next": {useTranslation: () => ({t: key => key})},
        classnames: () => "",
        dayjs: () => ({isValid: () => true}),
        "@mui/x-date-pickers/DateTimePicker": {DateTimePicker: "DateTimePicker"},
        "@telegram-apps/telegram-ui": Object.fromEntries(["Button", "Input", "Section", "Text", "Title"].map(x => [x, x])),
        "@/components/CurrencySelect": {CurrencySelect: "CurrencySelect"},
        "@/services/addExpense": {addExpense: write},
        "@/services/putExpense": {putExpense: write},
        "@/services/useMe": () => ({data: me, loading: false}),
        "@/hooks/useSelectedFriend": {useFriend: id => ({
            friend: id === friend.id ? friend : undefined,
            refetchFriends: refresh ?? (() => Promise.resolve()),
        })},
        "@/hooks/useSelectedExpense": ({refreshKey}) => {
            calls.refreshKeys.push(refreshKey);
            return {expense, isLoading: false};
        },
        "@/utils/useRefreshToken": () => [`refresh-${calls.refreshes}`, () => { calls.refreshes++; }],
        "@/utils/parseId": load("utils/parseId.ts"),
        "@/Icons": {Arrow: "Arrow"},
        "@/app/store": {useStore: selector => selector(state)},
        "next/navigation": {
            useRouter: () => ({push: route => calls.routes.push(route)}),
            useSearchParams: () => new URLSearchParams(query),
        },
        "@/const/urls": {friend: "/friend"},
        "@/const/searchParams": searchParams,
        "@/utils/withSearchParams": load("utils/withSearchParams.ts", {"@/const/searchParams": searchParams}),
    };
    for (const name of ["header/header", "avatar/Avatar", "main/main", "loader/loader", "pullToRefresh/pullToRefresh"]) mocks[`@/app/components/${name}`] = name;
    // The route wraps the page in <Suspense>; the page resolves the friend and renders the form.
    const page = load("app/settleUpPayment/page.tsx", mocks).default().props.children;
    const form = page.type(page.props);
    if (isExpenseRequestFailed) return {calls, view: form, render: () => page.type(page.props)};
    assert.equal(form.props.friend, friend);
    const view = form.type(form.props);
    const header = view.props.children[0];
    return {calls, save: header.props.RightComponent().props.onClick};
}

for (const editing of [false, true]) {
    for (const paidByMe of [false, true]) {
        test(`${editing ? "editing" : "creating"} preserves ${paidByMe ? "my" : "friend's"} payment direction`, async () => {
            const {calls, save} = renderPayment({editing, paidByMe});
            await save();
            assert.equal(calls.writes.length, 1);
            assert.equal(calls.writes[0].payers.find(x => x.amount > 0).user_id, paidByMe ? 1 : 2);
            assert.equal(calls.writes[0].debtors.find(x => x.amount > 0).user_id, paidByMe ? 2 : 1);
        });
    }
}

test("a failed settlement stays on the page and can be retried", async () => {
    let fail = true;
    const {calls, save} = renderPayment({mutation: async () => { if (fail) throw new Error("HTTP 500"); }});
    await save();
    assert.equal(calls.successes.length, 0);
    assert.equal(calls.routes.length, 0);
    assert.deepEqual(calls.errors, [true]);
    fail = false;
    await save();
    assert.equal(calls.successes.length, 1);
});

test("rapid repeated clicks cannot create duplicate settlements", async () => {
    let resolve;
    const {calls, save} = renderPayment({mutation: () => new Promise(done => { resolve = done; })});
    const first = save();
    await save();
    assert.equal(calls.writes.length, 1);
    resolve();
    await first;
});

test("failed refresh after a confirmed settlement does not enable another write", async () => {
    const {calls, save} = renderPayment({refresh: () => Promise.reject(new Error("HTTP 500"))});
    await save();
    await save();
    assert.equal(calls.writes.length, 1);
    assert.deepEqual(calls.successes, [true]);
    assert.deepEqual(calls.routes, ["/friend?friendId=2"]);
});

test("invalid settlement amounts are not sent", async () => {
    for (const amount of [NaN, Infinity, 0]) {
        const {calls, save} = renderPayment({amount});
        await save();
        assert.equal(calls.writes.length, 0);
    }
});

test("a failed request for the edited settlement can be retried by pulling down", async () => {
    const {calls, view, render} = renderPayment({editing: true, isExpenseRequestFailed: true});
    const pull = view.props.children;
    assert.equal(pull.type, "pullToRefresh/pullToRefresh");
    await pull.props.onRefresh();
    render();
    assert.deepEqual(calls.refreshKeys, ["refresh-0", "refresh-1"]);
});
