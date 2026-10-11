const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

const {
    createExpenseDraft,
    applyToExpenseDraft,
    canSaveExpenseDraft,
    expenseDraftPayload,
    allocatedTotal,
} = load("app/expense/expenseDraft.ts", {
    dayjs: require("dayjs"),
    "@/const/currencies": load("const/currencies.ts"),
    "@/utils/splitNumberIntoParts": load("utils/splitNumberIntoParts.ts"),
    "@/utils/expenseValidation": load("utils/expenseValidation.ts"),
});

const me = {id: 1, name: "Me"};
const friend = {id: 2, name: "Friend"};

const named = draft => applyToExpenseDraft(draft, {type: "nameChanged", value: "Dinner"});
const newDraft = (currency = "USD") =>
    named(createExpenseDraft({me: {...me, default_currency: currency}, expense: null, friends: [friend]}));
const apply = (draft, ...actions) => actions.reduce(applyToExpenseDraft, draft);

const amount = value => ({type: "amountChanged", value});
const currency = value => ({type: "currencyChanged", value});
const fullyPaidByMe = checked => ({type: "fullyPaidByMeChanged", checked});
const splitEqually = checked => ({type: "splitEquallyChanged", checked});
const select = (side, id, checked) => ({type: "participantSelected", side, id, checked});
const enter = (side, id, value) => ({type: "allocationAmountChanged", side, id, value});
const enterPercent = (side, id, value) => ({type: "allocationPercentChanged", side, id, value});

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
        enter("split", 1, "0.0001"), enter("split", 2, "0"), currency("BTC"));
    assert.deepEqual(rawAmountsOf(draft.split), ["0.0001", "0"]);
    assert.equal(canSaveExpenseDraft(draft), true);
});

test("the expense amount accepts a decimal comma and ignores input past 15 characters", () => {
    const draft = apply(newDraft(), amount("10,5"), amount("1234567890123456"));
    assert.equal(draft.amountRaw, "10,5");
    assert.deepEqual(amountsOf(expenseDraftPayload(draft).debtors), [5.25, 5.25]);
});

test("a blank or overlong expense name cannot be saved or entered", () => {
    let draft = apply(newDraft(), amount("10"), {type: "nameChanged", value: "x".repeat(257)});
    assert.equal(draft.name, "Dinner");
    draft = apply(draft, {type: "nameChanged", value: "   "});
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
    draft = apply(draft, enter("split", 2, "8"));
    assert.equal(canSaveExpenseDraft(draft), false);
    draft = apply(draft, enter("split", 1, "2"));
    assert.equal(canSaveExpenseDraft(draft), true);
    assert.deepEqual(amountsOf(expenseDraftPayload(draft).debtors), [2, 8]);
});

test("deselecting a participant zeroes their allocation", () => {
    let draft = apply(newDraft(), amount("10"), splitEqually(false), select("split", 2, false));
    assert.deepEqual(rawAmountsOf(draft.split), ["5", "0"]);
    assert.equal(allocatedTotal(draft, "split"), 5);
    assert.equal(canSaveExpenseDraft(draft), false);
    draft = apply(draft, enter("split", 1, "10"), select("split", 2, true));
    assert.deepEqual(amountsOf(expenseDraftPayload(draft).debtors), [10, 0]);
});

test("percent allocations are converted to amounts of the expense total", () => {
    const draft = apply(newDraft(), amount("200"), splitEqually(false),
        enterPercent("split", 1, "25"), enterPercent("split", 2, "75"));
    assert.deepEqual(draft.split.map(allocation => allocation.percentRaw), ["25", "75"]);
    assert.deepEqual(amountsOf(expenseDraftPayload(draft).debtors), [50, 150]);
});

test("changing the amount keeps an unequal split as entered", () => {
    const draft = apply(newDraft(), amount("10"), splitEqually(false),
        enter("split", 1, "3"), enter("split", 2, "7"), amount("20"));
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
