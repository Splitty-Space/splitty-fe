const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

function editor(currency = "BTC") {
    const slots = [];
    const writes = [];
    let cursor = 0;
    let effects = [];
    let dirty = false;
    const me = {id: 1, name: "Me", default_currency: currency};
    const state = {
        selectedFriends: [{id: 2, name: "Friend"}],
        selectedExpense: null,
        searchValue: "",
        isForceExpenseSaveEnabled: false,
        setIsForceExpenseSaveEnabled: () => {},
        setIsCreateExpenseSnackbarShown: () => {},
        setIsUpdateExpenseSnackbarShown: () => {},
        setSelectedExpense: () => {},
        setIsRequestErrorSnackbarShown: () => {},
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
        "@/services/putExpense": {putExpense: async () => {}},
        "@/app/store": {useStore: selector => selector(state)},
        "next/navigation": {useRouter: () => ({replace: () => {}, push: () => {}})},
        "@/const/urls": {expenseDetails: "/expense/details"},
        "@/const/testExpenseId": {TEST_EXPENSE_ID: -1},
        "@/const/currencies": load("const/currencies.ts"),
        "@/utils/splitNumberIntoParts": load("utils/splitNumberIntoParts.ts"),
        "@/utils/expenseValidation": load("utils/expenseValidation.ts"),
        "@/utils/handleInputFocus": () => {},
        "@/utils/vibration": {vibration: () => {}},
        "@/app/expense/add/focusOnExpenseNameInput": {ExpenseNameInputId: "expenseName"},
        "@/components/CurrencySelect": {CurrencySelect: "CurrencySelect"},
        "@mui/x-date-pickers/DateTimePicker": {DateTimePicker: "DateTimePicker"},
        "@/Icons": {Icon28Warning: "Icon28Warning"},
        "@telegram-apps/telegram-ui": new Proxy({}, {get: (_, name) => name}),
        "./addExpense.css": {},
    };
    for (const name of ["header/header", "main/main", "avatar/Avatar"]) mocks[`@/app/components/${name}`] = name;
    const Page = load("app/expense/add/page.tsx", mocks).default;
    let tree;
    const render = () => {
        do {
            cursor = 0;
            effects = [];
            dirty = false;
            tree = Page();
            const pending = effects;
            pending.forEach(effect => effect());
        } while (dirty);
    };
    const find = (predicate, node = tree) => {
        if (!node || typeof node !== "object") return;
        if (predicate(node)) return node;
        for (const child of Array.isArray(node) ? node : Object.values(node.props ?? {})) {
            const result = find(predicate, child);
            if (result) return result;
        }
    };
    const change = (predicate, target) => {find(predicate).props.onChange({target}); render();};
    render();
    change(node => node.props?.id === "expenseName", {value: "Dinner"});
    return {
        writes,
        amount: value => change(node => node.props?.id === "moneySpentInput", {value}),
        currency: value => change(node => node.type === "CurrencySelect", {value}),
        toggle: (label, checked) => {
            find(node => node.props?.children === label).props.after.props.onChange({target: {checked}});
            render();
        },
        save: () => find(node => node.type === "header/header").props.RightComponent().props,
    };
}

test("expense editor saves an equal BTC split with either payer mode", async () => {
    for (const fullyPaidByMe of [true, false]) {
        const form = editor();
        form.amount("0.0001");
        if (!fullyPaidByMe) form.toggle("expenses.FullyPaidByYou", false);
        form.toggle("expenses.SplitEquallyBetweenAll", false);
        form.toggle("expenses.SplitEquallyBetweenAll", true);
        assert.equal(form.save().disabled, false);
        await form.save().onClick();
        assert.deepEqual(form.writes[0].debtors.map(x => x.amount), [0.00005, 0.00005]);
        assert.deepEqual(form.writes[0].payers.map(x => x.amount), fullyPaidByMe ? [0.0001, 0] : [0.00005, 0.00005]);
    }
});

test("switching currency recalculates automatic allocations before saving", async () => {
    const form = editor("USD");
    form.amount("0.0001");
    form.toggle("expenses.FullyPaidByYou", false);
    assert.equal(form.save().disabled, true);
    form.currency("BTC");
    assert.equal(form.save().disabled, false);
    form.currency("USD");
    assert.equal(form.save().disabled, true);
    form.currency("BTC");
    await form.save().onClick();
    assert.equal(form.writes[0].currency, "BTC");
    assert.deepEqual(form.writes[0].payers.map(x => x.amount), [0.00005, 0.00005]);
    assert.deepEqual(form.writes[0].debtors.map(x => x.amount), [0.00005, 0.00005]);
});
