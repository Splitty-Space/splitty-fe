const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

const expenseDraftActions = load("const/expenseDraftActions.ts");
const {EXPENSE_DRAFT_ACTIONS} = expenseDraftActions;
const allocationSides = load("const/allocationSides.ts");
const {SPLIT, PAID_BY} = allocationSides.ALLOCATION_SIDES;

const {
    createExpenseDraft,
    applyToExpenseDraft,
    canSaveExpenseDraft,
    expenseDraftPayload,
    allocationProgress,
} = load("app/expense/expenseDraft.ts", {
    dayjs: require("dayjs"),
    "@/const/currencies": load("const/currencies.ts"),
    "@/utils/splitNumberIntoParts": load("utils/splitNumberIntoParts.ts"),
    "@/utils/expenseValidation": load("utils/expenseValidation.ts"),
    "@/const/expenseDraftActions": expenseDraftActions,
    "@/const/allocationSides": allocationSides,
});

const me = {id: 1, name: "Me"};
const friend = {id: 2, name: "Friend"};

const named = draft => applyToExpenseDraft(draft, {type: EXPENSE_DRAFT_ACTIONS.NAME_CHANGED, value: "Dinner"});
const newDraft = (currency = "USD") =>
    named(createExpenseDraft({me: {...me, default_currency: currency}, expense: null, friends: [friend]}));
const apply = (draft, ...actions) => actions.reduce(applyToExpenseDraft, draft);

const amount = value => ({type: EXPENSE_DRAFT_ACTIONS.AMOUNT_CHANGED, value});
const currency = value => ({type: EXPENSE_DRAFT_ACTIONS.CURRENCY_CHANGED, value});
const fullyPaidByMe = checked => ({type: EXPENSE_DRAFT_ACTIONS.FULLY_PAID_BY_ME_CHANGED, checked});
const splitEqually = checked => ({type: EXPENSE_DRAFT_ACTIONS.SPLIT_EQUALLY_CHANGED, checked});
const select = (side, id, checked) => ({type: EXPENSE_DRAFT_ACTIONS.PARTICIPANT_SELECTED, side, id, checked});
const enter = (side, id, value) => ({type: EXPENSE_DRAFT_ACTIONS.ALLOCATION_AMOUNT_CHANGED, side, id, value});
const enterPercent = (side, id, value) => ({type: EXPENSE_DRAFT_ACTIONS.ALLOCATION_PERCENT_CHANGED, side, id, value});

const amountsOf = rows => rows.map(row => row.amount);
const rawAmountsOf = allocations => allocations.map(allocation => allocation.amountRaw);

test("a new expense defaults to me paying in full and an equal split", () => {
    const draft = newDraft();
    assert.equal(canSaveExpenseDraft(draft), false);
    const payload = expenseDraftPayload(apply(draft, amount("10")));
    assert.deepEqual(amountsOf(payload.payers), [10, 0]);
    assert.deepEqual(amountsOf(payload.debtors), [5, 5]);
    assert.deepEqual(payload.users, [1, 2]);
    assert.deepEqual([payload.amount, payload.currency, payload.description], [10, "USD", "Dinner"]);
});

test("an equal BTC split balances with either payer mode", () => {
    for (const isPaidByMe of [true, false]) {
        let draft = apply(newDraft("BTC"), amount("0.0001"));
        if (!isPaidByMe) draft = apply(draft, fullyPaidByMe(false));
        draft = apply(draft, splitEqually(false), splitEqually(true));
        assert.equal(canSaveExpenseDraft(draft), true);
        const payload = expenseDraftPayload(draft);
        assert.deepEqual(amountsOf(payload.debtors), [0.00005, 0.00005]);
        assert.deepEqual(amountsOf(payload.payers), isPaidByMe ? [0.0001, 0] : [0.00005, 0.00005]);
    }
});

test("switching currency recalculates automatic allocations", () => {
    let draft = apply(newDraft(), amount("0.0001"), fullyPaidByMe(false));
    assert.equal(canSaveExpenseDraft(draft), false);
    draft = apply(draft, currency("BTC"));
    assert.equal(canSaveExpenseDraft(draft), true);
    draft = apply(draft, currency("USD"));
    assert.equal(canSaveExpenseDraft(draft), false);
    const payload = expenseDraftPayload(apply(draft, currency("BTC")));
    assert.equal(payload.currency, "BTC");
    assert.deepEqual(amountsOf(payload.payers), [0.00005, 0.00005]);
    assert.deepEqual(amountsOf(payload.debtors), [0.00005, 0.00005]);
});

test("switching currency keeps an unequal split that was edited", () => {
    const draft = apply(newDraft(), amount("0.0001"), splitEqually(false),
        enter(SPLIT, 1, "0.0001"), enter(SPLIT, 2, "0"), currency("BTC"));
    assert.deepEqual(rawAmountsOf(draft.split), ["0.0001", "0"]);
    assert.equal(canSaveExpenseDraft(draft), true);
});

test("the expense amount accepts a decimal comma and ignores input past 15 characters", () => {
    const draft = apply(newDraft(), amount("10,5"), amount("1234567890123456"));
    assert.equal(draft.amountRaw, "10,5");
    assert.deepEqual(amountsOf(expenseDraftPayload(draft).debtors), [5.25, 5.25]);
});

test("a blank or overlong expense name cannot be saved or entered", () => {
    let draft = apply(newDraft(), amount("10"), {type: EXPENSE_DRAFT_ACTIONS.NAME_CHANGED, value: "x".repeat(257)});
    assert.equal(draft.name, "Dinner");
    draft = apply(draft, {type: EXPENSE_DRAFT_ACTIONS.NAME_CHANGED, value: "   "});
    assert.equal(canSaveExpenseDraft(draft), false);
});

test("turning off fully paid by me splits who paid equally, turning it on restores my full payment", () => {
    let draft = apply(newDraft(), amount("10"), fullyPaidByMe(false));
    assert.deepEqual(rawAmountsOf(draft.paidBy), ["5", "5"]);
    draft = apply(draft, fullyPaidByMe(true));
    assert.deepEqual(amountsOf(expenseDraftPayload(draft).payers), [10, 0]);
});

test("an unequal split saves the entered amounts and stays blocked until it balances", () => {
    let draft = apply(newDraft(), amount("10"), splitEqually(false));
    assert.deepEqual(rawAmountsOf(draft.split), ["5", "5"]);
    draft = apply(draft, enter(SPLIT, 2, "8"));
    assert.equal(canSaveExpenseDraft(draft), false);
    draft = apply(draft, enter(SPLIT, 1, "2"));
    assert.equal(canSaveExpenseDraft(draft), true);
    assert.deepEqual(amountsOf(expenseDraftPayload(draft).debtors), [2, 8]);
});

test("0.10 + 0.20 of 0.30 is balanced on both sides, with nothing left", () => {
    const draft = apply(newDraft(), amount("0.30"), fullyPaidByMe(false), splitEqually(false),
        enter(PAID_BY, 1, "0.10"), enter(PAID_BY, 2, "0.20"),
        enter(SPLIT, 1, "0.10"), enter(SPLIT, 2, "0.20"));
    assert.equal(canSaveExpenseDraft(draft), true);
    for (const side of [PAID_BY, SPLIT]) {
        assert.deepEqual(allocationProgress(draft, side), {filled: 0.3, left: 0, over: 0, isBalanced: true}, side);
    }
});

test("filled, left and over amounts are rounded to the currency precision", () => {
    const usd = apply(newDraft(), amount("1"), splitEqually(false), enter(SPLIT, 1, "0.1"), enter(SPLIT, 2, "0.2"));
    assert.deepEqual(allocationProgress(usd, SPLIT), {filled: 0.3, left: 0.7, over: 0, isBalanced: false});
    const btc = apply(newDraft("BTC"), amount("0.3"), splitEqually(false),
        enter(SPLIT, 1, "0.1"), enter(SPLIT, 2, "0.00000001"));
    assert.deepEqual(allocationProgress(btc, SPLIT), {filled: 0.10000001, left: 0.19999999, over: 0, isBalanced: false});
    const usdOver = apply(newDraft(), amount("1"), splitEqually(false), enter(SPLIT, 1, "0.6"), enter(SPLIT, 2, "0.7"));
    assert.deepEqual(allocationProgress(usdOver, SPLIT), {filled: 1.3, left: 0, over: 0.3, isBalanced: false});
});

test("an unbalanced side never shows 0 left: extra entered decimals are kept", () => {
    const draft = apply(newDraft(), amount("10"), splitEqually(false), enter(SPLIT, 1, "3.333"), enter(SPLIT, 2, "6.666"));
    assert.equal(canSaveExpenseDraft(draft), false);
    assert.deepEqual(allocationProgress(draft, SPLIT), {filled: 9.999, left: 0.001, over: 0, isBalanced: false});
});

test("an over-allocated side shows how much is over, not a negative amount left", () => {
    const draft = apply(newDraft(), amount("10"), fullyPaidByMe(false), splitEqually(false),
        enter(PAID_BY, 1, "6"), enter(PAID_BY, 2, "4.5"),
        enter(SPLIT, 1, "6"), enter(SPLIT, 2, "4.5"));
    assert.equal(canSaveExpenseDraft(draft), false);
    for (const side of [PAID_BY, SPLIT]) {
        assert.deepEqual(allocationProgress(draft, side), {filled: 10.5, left: 0, over: 0.5, isBalanced: false}, side);
    }
});

test("an over-allocated side never shows 0 over: extra entered decimals are kept", () => {
    const draft = apply(newDraft(), amount("10"), splitEqually(false), enter(SPLIT, 1, "3.334"), enter(SPLIT, 2, "6.667"));
    assert.equal(canSaveExpenseDraft(draft), false);
    assert.deepEqual(allocationProgress(draft, SPLIT), {filled: 10.001, left: 0, over: 0.001, isBalanced: false});
});

test("deselecting a participant zeroes their allocation", () => {
    let draft = apply(newDraft(), amount("10"), splitEqually(false), select(SPLIT, 2, false));
    assert.deepEqual(rawAmountsOf(draft.split), ["5", "0"]);
    assert.deepEqual(allocationProgress(draft, SPLIT), {filled: 5, left: 5, over: 0, isBalanced: false});
    assert.equal(canSaveExpenseDraft(draft), false);
    draft = apply(draft, enter(SPLIT, 1, "10"), select(SPLIT, 2, true));
    assert.deepEqual(amountsOf(expenseDraftPayload(draft).debtors), [10, 0]);
});

test("percent allocations are converted to amounts of the expense total", () => {
    const draft = apply(newDraft(), amount("200"), splitEqually(false),
        enterPercent(SPLIT, 1, "25"), enterPercent(SPLIT, 2, "75"));
    assert.deepEqual(draft.split.map(allocation => allocation.percentRaw), ["25", "75"]);
    assert.deepEqual(amountsOf(expenseDraftPayload(draft).debtors), [50, 150]);
});

test("changing the amount keeps an unequal split as entered", () => {
    const draft = apply(newDraft(), amount("10"), splitEqually(false),
        enter(SPLIT, 1, "3"), enter(SPLIT, 2, "7"), amount("20"));
    assert.deepEqual(rawAmountsOf(draft.split), ["3", "7"]);
    assert.deepEqual(rawAmountsOf(draft.paidBy), ["20", "0"]);
    assert.equal(canSaveExpenseDraft(draft), false);
});

test("editing an expense starts from its saved allocations", () => {
    const draft = createExpenseDraft({
        me: {...me, default_currency: "USD"},
        friends: [],
        expense: {
            id: 3, description: "Taxi", amount: "30.00", currency: "EUR", date: "2026-10-01",
            expense_users: [
                {user: me, lent_amount: 30, debt_amount: 10},
                {user: friend, lent_amount: 0, debt_amount: 20},
            ],
        },
    });
    assert.deepEqual([draft.isFullyPaidByMe, draft.isSplitEqually, draft.currency], [true, false, "EUR"]);
    assert.equal(canSaveExpenseDraft(draft), true);
    assert.deepEqual(expenseDraftPayload(draft), {
        payers: [{user_id: 1, amount: 30}, {user_id: 2, amount: 0}],
        debtors: [{user_id: 1, amount: 10}, {user_id: 2, amount: 20}],
        users: [1, 2],
        amount: 30,
        description: "Taxi",
        currency: "EUR",
        date: "2026-10-01",
    });
});
