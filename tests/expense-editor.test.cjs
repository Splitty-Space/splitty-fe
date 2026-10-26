const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

const loadExpenseDraft = () => load("app/expense/expenseDraft.ts", {
    dayjs: require("dayjs"),
    "@/const/currencies": load("const/currencies.ts"),
    "@/utils/splitNumberIntoParts": load("utils/splitNumberIntoParts.ts"),
    "@/utils/expenseValidation": load("utils/expenseValidation.ts"),
    "@/const/expenseDraftActions": load("const/expenseDraftActions.ts"),
    "@/const/allocationSides": load("const/allocationSides.ts"),
});

function editor(currency = "BTC", overrides = {}, {isProfileLoaded = true} = {}) {
    const slots = [];
    const writes = [];
    const puts = [];
    const routes = [];
    const refreshKeys = [];
    const refreshes = [];
    let cursor = 0;
    const effects = [];
    let dirty = false;
    const profile = {id: 1, name: "Me", default_currency: currency};
    let me = isProfileLoaded ? profile : undefined;
    const state = {
        selectedFriends: [{id: 2, name: "Friend"}],
        selectedExpense: null,
        searchValue: "",
        isForceExpenseSaveEnabled: false,
        setIsForceExpenseSaveEnabled: value => {
            if (state.isForceExpenseSaveEnabled !== value) dirty = true;
            state.isForceExpenseSaveEnabled = value;
        },
        setIsCreateExpenseSnackbarShown: () => {},
        setIsUpdateExpenseSnackbarShown: () => {},
        setSelectedExpense: () => {},
        setIsRequestErrorSnackbarShown: () => {},
        ...overrides,
    };
    const jsx = (type, props) => ({type, props});
    const mocks = {
        react: {
            useState: initial => {
                const index = cursor++;
                if (!(index in slots)) slots[index] = initial;
                return [slots[index], value => {
                    const next = typeof value === "function" ? value(slots[index]) : value;
                    if (!Object.is(next, slots[index])) dirty = true;
                    slots[index] = next;
                }];
            },
            useRef: initial => {
                const index = cursor++;
                return slots[index] ?? (slots[index] = {current: initial});
            },
            useReducer: (reducer, initial) => {
                const index = cursor++;
                if (!(index in slots)) slots[index] = initial;
                return [slots[index], action => {
                    const next = reducer(slots[index], action);
                    if (!Object.is(next, slots[index])) dirty = true;
                    slots[index] = next;
                }];
            },
            useCallback: callback => callback,
            useEffect: (callback, deps) => {
                const index = cursor++;
                if (!slots[index] || deps.some((value, i) => !Object.is(value, slots[index][i]))) effects.push(callback);
                slots[index] = deps;
            },
        },
        "react/jsx-runtime": {jsx, jsxs: jsx, Fragment: "Fragment"},
        "react-i18next": {useTranslation: () => ({t: key => key})},
        classnames: () => "",
        dayjs: () => ({isValid: () => true}),
        "@/services/useMe": () => ({data: me}),
        "@/services/useFriends": () => ({refetchFriends: async () => {}}),
        "@/services/addExpense": {addExpense: async payload => {writes.push(payload); return {data: {id: 3}};}},
        "@/services/putExpense": {putExpense: async payload => {puts.push(payload);}},
        "@/app/store": {useStore: selector => selector(state)},
        "next/navigation": {useRouter: () => ({
            replace: url => routes.push(["replace", url]),
            push: url => routes.push(["push", url]),
            back: () => routes.push(["back"]),
        })},
        "@/const/urls": {expenseDetails: "/expense/details"},
        "@/const/searchParams": load("const/searchParams.ts"),
        "@/utils/withSearchParams": load("utils/withSearchParams.ts", {"@/const/searchParams": load("const/searchParams.ts")}),
        // The URL's expense id, as the page reads it: `expenseId` alone means the expense is still loading,
        // unless `isExpenseRequestFailed` says its request failed.
        "@/hooks/useSelectedExpense": ({refreshKey}) => {
            refreshKeys.push(refreshKey);
            const expenseId = state.expenseId ?? state.selectedExpense?.id ?? null;
            return {
                expenseId,
                expense: state.selectedExpense,
                isLoading: expenseId !== null && !state.selectedExpense && !state.isExpenseRequestFailed,
            };
        },
        "@/utils/useRefreshToken": () => [`refresh-${refreshes.length}`, () => refreshes.push(true)],
        "@/const/testExpenseId": {TEST_EXPENSE_ID: -1},
        "@/const/expenseDraftActions": load("const/expenseDraftActions.ts"),
        "@/const/allocationSides": load("const/allocationSides.ts"),
        "@/app/expense/expenseDraft": loadExpenseDraft(),
        "@/utils/handleInputFocus": () => {},
        "@/utils/vibration": {vibration: () => {}},
        "@/app/expense/add/focusOnExpenseNameInput": {ExpenseNameInputId: "expenseName"},
        "@/components/CurrencySelect": {CurrencySelect: "CurrencySelect"},
        "@mui/x-date-pickers/DateTimePicker": {DateTimePicker: "DateTimePicker"},
        "@/Icons": {Icon28Warning: "Icon28Warning"},
        "@telegram-apps/telegram-ui": new Proxy({}, {get: (_, name) => name}),
        "./addExpense.css": {},
    };
    for (const name of ["header/header", "main/main", "avatar/Avatar", "loader/loader", "pullToRefresh/pullToRefresh"]) mocks[`@/app/components/${name}`] = name;
    // The route wraps the page in <Suspense>; render the page itself.
    const Page = load("app/expense/add/page.tsx", mocks).default().props.children.type;
    let tree;
    const render = () => {
        do {
            cursor = 0;
            effects.length = 0;
            dirty = false;
            tree = Page();
            const pending = effects.splice(0);
            pending.forEach(effect => effect());
        } while (dirty);
    };
    const findAll = (predicate, root = tree) => {
        const found = [];
        const visit = node => {
            if (!node || typeof node !== "object") return;
            if (predicate(node)) found.push(node);
            for (const child of Array.isArray(node) ? node : Object.values(node.props ?? {})) visit(child);
        };
        visit(root);
        return found;
    };
    const find = (predicate, root = tree) => findAll(predicate, root)[0];
    const section = id => find(node => node.props?.id === id);
    const change = (predicate, target) => {find(predicate).props.onChange({target}); render();};
    render();
    const nameInput = node => node.props?.id === "expenseName";
    if (me && find(nameInput)) change(nameInput, {value: "Dinner"});
    const inSection = (id, predicate) => {
        const root = section(id);
        assert.ok(root, `${id} is not rendered`);
        return findAll(predicate, root);
    };
    return {
        state,
        writes,
        puts,
        routes,
        refreshKeys,
        render,
        tree: () => tree,
        find,
        loadProfile: () => {
            me = profile;
            render();
        },
        isRendered: id => !!section(id),
        // Section ids: "expense-add-paid-by" and "expense-add-split-equally".
        values: id => inSection(id, node => node.type === "Input").map(node => node.props.value),
        showPercents: id => {
            inSection(id, node => node.props?.children === "%")[0].props.onClick();
            render();
        },
        amount: value => change(node => node.props?.id === "moneySpentInput", {value}),
        toggle: (label, checked) => {
            find(node => node.props?.children === label).props.after.props.onChange({target: {checked}});
            render();
        },
        save: () => find(node => node.type === "header/header").props.RightComponent().props,
    };
}

const PAID_BY = "expense-add-paid-by";
const SPLIT = "expense-add-split-equally";

const {generateTestExpense, generateTestExpenseWithSplit} =
    load("utils/generateTestExpense.ts", {"@/const/testExpenseId": {TEST_EXPENSE_ID: -1}});
const tutorialMe = {id: 1, name: "Me"};
const tutorialFriend = {id: 2, name: "Friend"};
const tutorialExpense = () => generateTestExpenseWithSplit(tutorialMe, tutorialFriend, key => key);

test("saving a new expense sends the draft to addExpense", async () => {
    const form = editor("USD");
    form.amount("10");
    await form.save().onClick();
    assert.deepEqual(form.writes, [{
        payers: [{user_id: 1, amount: 10}, {user_id: 2, amount: 0}],
        debtors: [{user_id: 1, amount: 5}, {user_id: 2, amount: 5}],
        users: [1, 2],
        amount: 10,
        payment: false,
        currency: "USD",
        date: form.writes[0].date,
        description: "Dinner",
    }]);
    assert.ok(form.writes[0].date instanceof Date);
});

test("saving an edited expense sends the draft to putExpense", async () => {
    const form = editor("USD", {
        selectedFriends: [],
        selectedExpense: {
            id: 3, description: "Taxi", amount: "30.00", currency: "EUR", date: "2026-10-01",
            expense_users: [
                {user: tutorialMe, lent_amount: 30, debt_amount: 10},
                {user: tutorialFriend, lent_amount: 0, debt_amount: 20},
            ],
        },
    });
    assert.equal(form.isRendered(PAID_BY), false);
    assert.deepEqual(form.values(SPLIT), ["10", "20"]);
    await form.save().onClick();
    assert.equal(form.writes.length, 0);
    assert.deepEqual(form.puts, [{
        expense_id: 3,
        payers: [{user_id: 1, amount: 30}, {user_id: 2, amount: 0}],
        debtors: [{user_id: 1, amount: 10}, {user_id: 2, amount: 20}],
        users: [1, 2],
        amount: 30,
        description: "Dinner",
    }]);
});

test("percent mode shows each allocation as a share of the total", () => {
    const form = editor("USD");
    form.amount("200");
    form.toggle("expenses.SplitEquallyBetweenAll", false);
    form.showPercents(SPLIT);
    assert.deepEqual(form.values(SPLIT), [50, 50]);
});

test("the editor waits for the profile before starting the draft", () => {
    const form = editor("USD", {}, {isProfileLoaded: false});
    assert.equal(form.tree().type, "loader/loader");
    form.loadProfile();
    form.amount("10");
    form.toggle("expenses.SplitEquallyBetweenAll", false);
    assert.deepEqual(form.values(SPLIT), ["5", "5"]);
});

test("a newly selected expense replaces the draft", () => {
    const form = editor("USD", {selectedExpense: generateTestExpense(tutorialMe, tutorialFriend, key => key)});
    assert.equal(form.isRendered(PAID_BY), false);
    form.state.selectedExpense = tutorialExpense();
    form.render();
    assert.deepEqual(form.values(PAID_BY), ["20", "50"]);
    assert.deepEqual(form.values(SPLIT), ["40", "30"]);
});

test("a save request left over from the tour does not save a real expense", () => {
    const form = editor("USD", {isForceExpenseSaveEnabled: true});
    assert.equal(form.state.isForceExpenseSaveEnabled, false);
    form.amount("1");
    assert.equal(form.save().disabled, false);
    assert.equal(form.writes.length, 0);
});

test("the tour saves the tutorial expense once per request", () => {
    const form = editor("USD", {selectedExpense: tutorialExpense()});
    assert.equal(form.writes.length, 0);
    form.state.isForceExpenseSaveEnabled = true;
    form.render();
    form.render();
    assert.equal(form.writes.length, 1);
    assert.equal(form.writes[0].amount, 70);
    assert.equal(form.state.isForceExpenseSaveEnabled, false);
});

test("a saved new expense replaces the editor with its details page", async () => {
    const form = editor("USD");
    form.amount("10");
    await form.save().onClick();
    assert.deepEqual(form.routes, [["replace", "/expense/details?expenseId=3"]]);
});

// The editor is opened from the expense's details page, so going back keeps the history at details,
// and Back from there leaves the expense instead of returning to the editor.
test("a saved edit goes back to the edited expense's details page", async () => {
    const form = editor("USD", {
        selectedFriends: [],
        selectedExpense: {
            id: 7, description: "Taxi", amount: "30.00", currency: "EUR", date: "2026-10-01",
            expense_users: [
                {user: tutorialMe, lent_amount: 30, debt_amount: 10},
                {user: tutorialFriend, lent_amount: 0, debt_amount: 20},
            ],
        },
    });
    await form.save().onClick();
    assert.deepEqual(form.routes, [["back"]]);
});

test("editing waits for the expense from the URL before starting the draft", () => {
    const form = editor("USD", {selectedFriends: [], expenseId: 7});
    assert.equal(form.tree().type, "loader/loader");
});

test("a failed request for the edited expense can be retried by pulling down", async () => {
    const form = editor("USD", {selectedFriends: [], expenseId: 7, isExpenseRequestFailed: true});
    const pull = form.find(node => node.type === "pullToRefresh/pullToRefresh");
    assert.ok(pull, "pull-to-refresh is not rendered");
    await pull.props.onRefresh();
    form.render();
    assert.deepEqual([...new Set(form.refreshKeys)], ["refresh-0", "refresh-1"]);
});
