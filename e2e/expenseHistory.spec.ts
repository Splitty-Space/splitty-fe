import {test, expect, ME} from "./mockBackend";
import {expenseDetails} from "../const/urls";
import {SEARCH_PARAMS} from "../const/searchParams";
import {ACTIVITY_TYPE} from "../entities/Activity";

const ALICE = {id: 2, name: "Alice", username: "alice"};
const EXPENSE = {
    id: 7, amount: "10", description: "Pizza", currency: "USD", payment: false, isDeleted: false, settled: false,
    date: "2026-11-20T10:00:00Z", created_at: "2026-11-20T10:00:00Z", transactions: [],
    expense_users: [
        {id: 1, user: ME, lent_amount: 10, debt_amount: 5},
        {id: 2, user: ALICE, lent_amount: 0, debt_amount: 5},
    ],
};
const EDIT = {
    id: 11, activity_type: ACTIVITY_TYPE.EXPENSE_EDITED, user: ME, expense: EXPENSE,
    created_at: "2026-11-21T10:00:00Z", data: {amount: {old: 8, new: 10}},
};

test("an edit in the expense history opens a dialog named after the edit", async ({backend, page}) => {
    const consoleErrors: string[] = [];
    page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
    });
    backend
        .on("GET", `/expenses/${EXPENSE.id}`, {json: EXPENSE})
        .on("GET", "/activity", {json: {data: [EDIT], meta: {}}})
        .on("GET", "/friends", {json: {data: [], meta: {}}});

    await page.goto(`${expenseDetails}?${SEARCH_PARAMS.EXPENSE_ID}=${EXPENSE.id}`);
    await page.getByText("Expense was edited by Mikhail").click();

    await expect(page.getByRole("dialog", {name: "Expense was edited by Mikhail"})).toBeVisible();
    // Radix logs this when a dialog has no DialogTitle.
    expect(consoleErrors.filter((text) => text.includes("DialogTitle"))).toEqual([]);
});
