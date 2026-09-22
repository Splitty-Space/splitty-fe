const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

for (const name of ["addExpense", "putExpense", "deleteExpense", "addFriend", "deleteFriend"]) {
    test(`${name} propagates rejected HTTP requests to the UI`, async () => {
        const failure = new Error("HTTP 500");
        const reject = async () => { throw failure; };
        const service = load(`services/${name}.ts`, {
            "@/API/client": {apiClient: {post: reject, put: reject, delete: reject}},
            "@/API/APIConstants": {SERVER_URL: "http://test.invalid"},
            "@/utils/getCurrentUserId": () => 1,
            "@/app/store": {useStore: {getState: () => ({token: "test-token"})}},
        })[name];
        const params = name.includes("Expense") && !name.startsWith("delete")
            ? {expense_id: 1, payers: [], debtors: [], users: [], amount: 1, currency: "USD", payment: false, date: "2026-09-20"}
            : 1;
        await assert.rejects(service(params), error => error === failure);
    });
}
