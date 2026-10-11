const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

function editor(currency = "BTC", overrides = {}) {
    const slots = [];
    const writes = [];
    const puts = [];
    let cursor = 0;
    const effects = [];
    let dirty = false;
    const me = {id: 1, name: "Me", default_currency: currency};
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
    change(node => node.props?.id === "expenseName", {value: "Dinner"});
    const inSection = (id, predicate) => {
        const root = section(id);
        assert.ok(root, `${id} is not rendered`);
        return findAll(predicate, root);
    };
    return {
        state,
        writes,
        puts,
        render,
        isRendered: id => !!section(id),
        name: value => change(node => node.props?.id === "expenseName", {value}),
        // Section ids: "expense-add-paid-by" and "expense-add-split-equally".
        values: id => inSection(id, node => node.type === "Input").map(node => node.props.value),
        enterAllocation: (id, index, value) => {
            inSection(id, node => node.type === "Input")[index].props.onChange({target: {value}});
            render();
        },
        selectParticipant: (id, index, checked) => {
            inSection(id, node => node.type === "Switch")[index].props.onChange({target: {checked}});
            render();
        },
        showPercents: id => {
            inSection(id, node => node.props?.children === "%")[0].props.onClick();
            render();
        },
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

const {generateTestExpenseWithSplit} = load("utils/generateTestExpense.ts", {"@/const/testExpenseId": {TEST_EXPENSE_ID: -1}});
const tutorialExpense = () => generateTestExpenseWithSplit({id: 1, name: "Me"}, {id: 2, name: "Friend"}, key => key);

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

const PAID_BY = "expense-add-paid-by";
const SPLIT = "expense-add-split-equally";
const amountsOf = rows => rows.map(row => row.amount);

test("a new expense defaults to me paying in full and an equal split", async () => {
    const form = editor("USD");
    assert.equal(form.save().disabled, true);
    form.amount("10");
    assert.equal(form.isRendered(PAID_BY), false);
    assert.equal(form.isRendered(SPLIT), false);
    await form.save().onClick();
    const [write] = form.writes;
    assert.deepEqual(amountsOf(write.payers), [10, 0]);
    assert.deepEqual(amountsOf(write.debtors), [5, 5]);
    assert.deepEqual(write.users, [1, 2]);
    assert.deepEqual([write.amount, write.currency, write.description, write.payment], [10, "USD", "Dinner", false]);
});

test("the expense amount accepts a decimal comma and ignores input past 15 characters", async () => {
    const form = editor("USD");
    form.amount("10,5");
    form.amount("1234567890123456");
    await form.save().onClick();
    assert.equal(form.writes[0].amount, 10.5);
    assert.deepEqual(amountsOf(form.writes[0].debtors), [5.25, 5.25]);
});

test("a blank or overlong expense name cannot be saved or entered", () => {
    const form = editor("USD");
    form.amount("10");
    form.name("x".repeat(257));
    assert.equal(form.save().disabled, false);
    form.name("   ");
    assert.equal(form.save().disabled, true);
});

test("turning off fully paid by me splits who paid equally, turning it on restores my full payment", async () => {
    const form = editor("USD");
    form.amount("10");
    form.toggle("expenses.FullyPaidByYou", false);
    assert.deepEqual(form.values(PAID_BY), ["5", "5"]);
    form.toggle("expenses.FullyPaidByYou", true);
    assert.equal(form.isRendered(PAID_BY), false);
    await form.save().onClick();
    assert.deepEqual(amountsOf(form.writes[0].payers), [10, 0]);
});

test("an unequal split saves the entered amounts and stays blocked until it balances", async () => {
    const form = editor("USD");
    form.amount("10");
    form.toggle("expenses.SplitEquallyBetweenAll", false);
    assert.deepEqual(form.values(SPLIT), ["5", "5"]);
    form.enterAllocation(SPLIT, 1, "8");
    assert.equal(form.save().disabled, true);
    form.enterAllocation(SPLIT, 0, "2");
    await form.save().onClick();
    assert.deepEqual(amountsOf(form.writes[0].debtors), [2, 8]);
});

test("deselecting a participant zeroes their allocation", async () => {
    const form = editor("USD");
    form.amount("10");
    form.toggle("expenses.SplitEquallyBetweenAll", false);
    form.selectParticipant(SPLIT, 1, false);
    assert.deepEqual(form.values(SPLIT), ["5", "0"]);
    assert.equal(form.save().disabled, true);
    form.enterAllocation(SPLIT, 0, "10");
    form.selectParticipant(SPLIT, 1, true);
    await form.save().onClick();
    assert.deepEqual(amountsOf(form.writes[0].debtors), [10, 0]);
});

test("percent allocations are converted to amounts of the expense total", async () => {
    const form = editor("USD");
    form.amount("200");
    form.toggle("expenses.SplitEquallyBetweenAll", false);
    form.showPercents(SPLIT);
    assert.deepEqual(form.values(SPLIT), [50, 50]);
    form.enterAllocation(SPLIT, 0, "25");
    form.enterAllocation(SPLIT, 1, "75");
    assert.deepEqual(form.values(SPLIT), ["25", "75"]);
    await form.save().onClick();
    assert.deepEqual(amountsOf(form.writes[0].debtors), [50, 150]);
});

test("changing the amount keeps an unequal split as entered", () => {
    const form = editor("USD");
    form.amount("10");
    form.toggle("expenses.SplitEquallyBetweenAll", false);
    form.enterAllocation(SPLIT, 0, "3");
    form.enterAllocation(SPLIT, 1, "7");
    form.amount("20");
    assert.deepEqual(form.values(SPLIT), ["3", "7"]);
    assert.equal(form.save().disabled, true);
});

test("switching currency keeps an unequal split that was edited", () => {
    const form = editor("USD");
    form.amount("0.0001");
    form.toggle("expenses.SplitEquallyBetweenAll", false);
    form.enterAllocation(SPLIT, 0, "0.0001");
    form.enterAllocation(SPLIT, 1, "0");
    form.currency("BTC");
    assert.deepEqual(form.values(SPLIT), ["0.0001", "0"]);
    assert.equal(form.save().disabled, false);
});

test("editing an expense starts from its saved allocations and updates it", async () => {
    const me = {id: 1, name: "Me"};
    const friend = {id: 2, name: "Friend"};
    const form = editor("USD", {
        selectedFriends: [],
        selectedExpense: {
            id: 3, description: "Taxi", amount: "30.00", currency: "EUR", date: "2026-10-01",
            expense_users: [
                {user: me, lent_amount: 30, debt_amount: 10},
                {user: friend, lent_amount: 0, debt_amount: 20},
            ],
        },
    });
    assert.equal(form.isRendered(PAID_BY), false);
    assert.deepEqual(form.values(SPLIT), ["10", "20"]);
    assert.equal(form.save().disabled, false);
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
