const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

function renderPayment({editing = false, paidByMe = false, amount = 10, mutation, refresh} = {}) {
    const calls = {writes: [], routes: [], errors: [], successes: []};
    const me = {id: 1, name: "Me"};
    const friend = {id: 2, name: "Friend", total: [{currency: "USD", amount: paidByMe ? -amount : amount}]};
    const state = {
        selectedExpense: editing ? {id: 3, amount, currency: "USD", date: "2026-09-20", expense_users: [
            {user: me, lent_amount: paidByMe ? amount : 0},
            {user: friend, lent_amount: paidByMe ? 0 : amount},
        ]} : null,
        settleUpPaymentInfo: {friend, currency: "USD"},
        searchValue: "",
        setSelectedUserId: () => {},
        setIsRequestErrorSnackbarShown: value => calls.errors.push(value),
        setIsCreateExpenseSnackbarShown: value => calls.successes.push(value),
        setIsUpdateExpenseSnackbarShown: value => calls.successes.push(value),
    };
    const write = async payload => {
        calls.writes.push(payload);
        if (mutation) await mutation();
    };
    const jsx = (type, props) => ({type, props});
    const mocks = {
        react: {useState: value => [value, () => {}], useRef: value => ({current: value})},
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
        "@/services/useFriends": () => ({refetchFriends: refresh ?? (() => Promise.resolve())}),
        "@/Icons": {Arrow: "Arrow"},
        "@/app/store": {useStore: selector => selector(state)},
        "next/navigation": {useRouter: () => ({push: route => calls.routes.push(route)})},
        "@/const/urls": {friend: "/friend"},
    };
    for (const name of ["header/header", "avatar/Avatar", "main/main", "loader/loader"]) mocks[`@/app/components/${name}`] = name;
    const Page = load("app/settleUpPayment/page.tsx", mocks).default;
    const page = Page();
    const header = page.props.children[0];
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
    assert.deepEqual(calls.routes, ["/friend"]);
});

test("invalid settlement amounts are not sent", async () => {
    for (const amount of [NaN, Infinity, 0]) {
        const {calls, save} = renderPayment({amount});
        await save();
        assert.equal(calls.writes.length, 0);
    }
});
