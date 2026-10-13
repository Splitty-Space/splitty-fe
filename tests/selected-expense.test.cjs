const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

const searchParams = load("const/searchParams.ts");

// Renders the hook like React would: state persists between renders and effects rerun when their deps change.
function selectedExpense({query, required, token = "token", fetch, tutorialExpense = null}) {
    const slots = [];
    let cursor = 0;
    const cleanups = [];
    const calls = {replaced: [], deleted: [], errors: [], fetched: []};
    const state = {
        token,
        tutorialExpense,
        setIsRequestErrorSnackbarShown: value => calls.errors.push(value),
        setIsCantShowDeletedExpenseSnackbarShown: value => calls.deleted.push(value),
    };
    const router = {replace: url => calls.replaced.push(url)};
    let rerender = () => {};
    const useSelectedExpense = load("hooks/useSelectedExpense.ts", {
        react: {
            useState: initial => {
                const index = cursor++;
                if (!(index in slots)) slots[index] = initial;
                return [slots[index], value => {
                    const next = typeof value === "function" ? value(slots[index]) : value;
                    if (Object.is(next, slots[index])) return;
                    slots[index] = next;
                    rerender();
                }];
            },
            useEffect: (effect, deps) => {
                const index = cursor++;
                const previous = slots[index];
                if (previous && !deps.some((dep, i) => !Object.is(dep, previous.deps[i]))) return;
                pending.push(() => {
                    previous?.cleanup?.();
                    const cleanup = effect();
                    slots[index] = {deps, cleanup};
                    if (cleanup) cleanups.push(cleanup);
                });
                slots[index] = {deps, cleanup: previous?.cleanup};
            },
        },
        "next/navigation": {useRouter: () => router, useSearchParams: () => new URLSearchParams(query)},
        "@/services/getExpense": request => {
            calls.fetched.push(request.expense_id);
            return fetch(request);
        },
        "@/app/store": {useStore: selector => selector(state)},
        "@/const/urls": load("const/urls.ts"),
        "@/const/searchParams": searchParams,
        "@/const/testExpenseId": load("const/testExpenseId.ts"),
        "@/utils/parseId": load("utils/parseId.ts"),
    }).default;
    let pending = [];
    let result;
    const render = () => {
        cursor = 0;
        pending = [];
        result = useSelectedExpense({required});
        pending.splice(0).forEach(run => run());
        return result;
    };
    rerender = () => queueMicrotask(render);
    render();
    return {calls, state, render, result: () => result};
}

const flush = () => new Promise(resolve => setTimeout(resolve, 0));
const expense = {id: 5, description: "Dinner", isDeleted: false};
const notFound = () => Promise.reject({response: {status: 404}});

test("the expense comes from the expense id in the URL", async () => {
    const page = selectedExpense({query: "expenseId=5", fetch: () => Promise.resolve({data: expense})});
    assert.equal(page.result().isLoading, true);
    await flush();
    assert.deepEqual(page.calls.fetched, [5]);
    assert.equal(page.result().expense, expense);
    assert.equal(page.result().isLoading, false);
    assert.deepEqual(page.calls.replaced, []);
});

test("waits for authentication before loading the expense", async () => {
    const page = selectedExpense({query: "expenseId=5", token: "", fetch: () => Promise.resolve({data: expense})});
    await flush();
    assert.deepEqual(page.calls.fetched, []);
    assert.equal(page.result().isLoading, true);
    assert.deepEqual(page.calls.replaced, []);
});

test("a missing or malformed expense id sends the user to the friends list", () => {
    for (const query of ["", "expenseId=abc"]) {
        const page = selectedExpense({query, fetch: () => assert.fail("must not fetch")});
        assert.equal(page.result().expense, null);
        assert.deepEqual(page.calls.replaced, ["/"], query);
    }
});

test("without a required expense, no expense id means a new expense", () => {
    const page = selectedExpense({query: "", required: false, fetch: () => assert.fail("must not fetch")});
    assert.equal(page.result().expenseId, null);
    assert.equal(page.result().expense, null);
    assert.equal(page.result().isLoading, false);
    assert.deepEqual(page.calls.replaced, []);
});

test("a malformed expense id is rejected even when the expense is optional", () => {
    const page = selectedExpense({query: "expenseId=abc", required: false, fetch: () => assert.fail("must not fetch")});
    assert.deepEqual(page.calls.replaced, ["/"]);
});

test("a deleted expense shows the deleted-expense snackbar and sends the user to the friends list", async () => {
    for (const fetch of [notFound, () => Promise.resolve({data: {...expense, isDeleted: true}})]) {
        const page = selectedExpense({query: "expenseId=5", fetch});
        await flush();
        assert.deepEqual(page.calls.deleted, [true]);
        assert.deepEqual(page.calls.replaced, ["/"]);
        assert.deepEqual(page.calls.errors, []);
        assert.equal(page.result().expense, null);
    }
});

test("a network error keeps the user on the page with the error snackbar and is logged", async (t) => {
    const warn = t.mock.method(console, "warn", () => {});
    const error = new Error("Network Error");
    const page = selectedExpense({query: "expenseId=5", fetch: () => Promise.reject(error)});
    await flush();
    assert.deepEqual(warn.mock.calls.map(({arguments: args}) => args), [["Expense request failed:", error]]);
    assert.deepEqual(page.calls.errors, [true]);
    assert.deepEqual(page.calls.replaced, []);
    assert.equal(page.result().isLoading, false);
    assert.equal(page.result().expense, null);
});

test("the tutorial expense is read from the store without a request", () => {
    const tutorialExpense = {id: -1, description: "Tutorial"};
    const page = selectedExpense({query: "expenseId=-1", tutorialExpense, fetch: () => assert.fail("must not fetch")});
    assert.equal(page.result().expense, tutorialExpense);
    assert.equal(page.result().isLoading, false);
    assert.deepEqual(page.calls.replaced, []);
});

test("the tutorial expense id without a tutorial expense sends the user to the friends list", () => {
    const page = selectedExpense({query: "expenseId=-1", fetch: () => assert.fail("must not fetch")});
    assert.deepEqual(page.calls.replaced, ["/"]);
});
