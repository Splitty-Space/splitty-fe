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

const {generateTestExpenseWithSplit} =
    load("utils/generateTestExpense.ts", {"@/const/testExpenseId": {TEST_EXPENSE_ID: -1}});
const me = {id: 1, name: "Me", default_currency: "EUR"};
const tutorialFriend = {id: 2, name: "Friend"};
const tutorialExpense = () => generateTestExpenseWithSplit(me, tutorialFriend, key => key);

// The hook as the layout uses it: rendered once, its callbacks kept and called from tutorial steps.
// Each `addExpense` call stays pending until the test settles it; `refreshResult` answers the friends refresh.
function tutorialSave({refreshResult = () => Promise.resolve()} = {}) {
    const writes = [];
    const routes = [];
    const errors = [];
    const refetches = [];
    const pending = [];
    const slots = [];
    let cursor = 0;
    const state = {
        tutorialExpense: tutorialExpense(),
        setIsRequestErrorSnackbarShown: shown => errors.push(shown),
        setIsCreateExpenseSnackbarShown: shown => assert.fail(`created snackbar shown: ${shown}`),
    };
    const mocks = {
        react: {
            useRef: initial => {
                const index = cursor++;
                return slots[index] ?? (slots[index] = {current: initial});
            },
            useCallback: callback => callback,
        },
        "@/app/store": {useStore: Object.assign(selector => selector(state), {getState: () => state})},
        "@/services/addExpense": {addExpense: payload => {
            writes.push(payload);
            return new Promise((resolve, reject) => pending.push({
                succeed: () => resolve({data: {id: 3}}),
                fail: () => reject(new Error("network")),
            }));
        }},
        "@/app/expense/expenseDraft": loadExpenseDraft(),
        axios: {isCancel: err => err?.name === "CanceledError"},
        "next/navigation": {useRouter: () => ({
            push: url => routes.push(["push", url]),
            replace: url => routes.push(["replace", url]),
            back: () => routes.push(["back"]),
        })},
    };
    const useTutorialExpenseSave = load("app/components/tour/useTutorialExpenseSave.ts", mocks).default;
    const refetchFriends = () => {
        refetches.push(true);
        return refreshResult();
    };
    const hook = useTutorialExpenseSave(refetchFriends);
    const settle = async outcome => {
        pending.shift()[outcome]();
        // Let the save's promise chain run to the end.
        for (let i = 0; i < 5; i++) await Promise.resolve();
    };
    return {hook, state, writes, routes, errors, refetches, settle};
}

test("the tutorial saves the tutorial expense as the expense editor would", async () => {
    const save = tutorialSave();
    save.hook.saveTutorialExpense(me);
    assert.deepEqual(save.writes, [{
        payers: [{user_id: 1, amount: 20}, {user_id: 2, amount: 50}],
        debtors: [{user_id: 1, amount: 40}, {user_id: 2, amount: 30}],
        users: [1, 2],
        amount: 70,
        payment: false,
        currency: "USD",
        date: save.writes[0].date,
        description: "tour.TestExpense",
    }]);
    await save.settle("succeed");
    assert.equal(save.refetches.length, 1);
    assert.deepEqual(save.errors, []);
});

test("re-entering the save step does not create a second tutorial expense", async () => {
    const save = tutorialSave();
    save.hook.saveTutorialExpense(me);
    save.hook.saveTutorialExpense(me);
    assert.equal(save.writes.length, 1);
    await save.settle("succeed");
    save.hook.saveTutorialExpense(me);
    assert.equal(save.writes.length, 1);
});

test("a failed tutorial save shows the request error and is retried on the next entry", async () => {
    const save = tutorialSave();
    save.hook.saveTutorialExpense(me);
    await save.settle("fail");
    assert.deepEqual(save.errors, [true]);
    assert.equal(save.refetches.length, 0);
    save.hook.saveTutorialExpense(me);
    assert.equal(save.writes.length, 2);
});

test("closing the tutorial lets the next tutorial save again", async () => {
    const save = tutorialSave();
    save.hook.saveTutorialExpense(me);
    await save.settle("succeed");
    save.hook.resetTutorialExpenseSave();
    save.hook.saveTutorialExpense(me);
    assert.equal(save.writes.length, 2);
});

// Only the tutorial's steps navigate, so a slow answer cannot move the user off a later step.
test("the tutorial save does not navigate", async () => {
    const save = tutorialSave();
    save.hook.saveTutorialExpense(me);
    await save.settle("succeed");
    save.hook.saveTutorialExpense(me);
    save.hook.resetTutorialExpenseSave();
    save.hook.saveTutorialExpense(me);
    await save.settle("fail");
    assert.deepEqual(save.routes, []);
});

test("a late answer from a closed tutorial does not affect the reopened one", async () => {
    const save = tutorialSave();
    save.hook.saveTutorialExpense(me);
    save.hook.resetTutorialExpenseSave();
    save.hook.saveTutorialExpense(me);
    assert.equal(save.writes.length, 2);
    await save.settle("fail");
    assert.deepEqual(save.errors, []);
    save.hook.saveTutorialExpense(me);
    assert.equal(save.writes.length, 2);
});

test("without a stored Tutorial expense nothing is saved", () => {
    const save = tutorialSave();
    save.state.tutorialExpense = null;
    save.hook.saveTutorialExpense(me);
    assert.deepEqual(save.writes, []);
});

test("a cancelled friends refresh after the save is not reported", async () => {
    const cancelled = Object.assign(new Error("canceled"), {name: "CanceledError"});
    const save = tutorialSave({refreshResult: () => Promise.reject(cancelled)});
    save.hook.saveTutorialExpense(me);
    await save.settle("succeed");
    assert.deepEqual(save.errors, []);
});

test("a failed friends refresh after the save shows the request error but keeps the save", async () => {
    const save = tutorialSave({refreshResult: () => Promise.reject(new Error("network"))});
    save.hook.saveTutorialExpense(me);
    await save.settle("succeed");
    assert.deepEqual(save.errors, [true]);
    save.hook.saveTutorialExpense(me);
    assert.equal(save.writes.length, 1);
});
