const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");
const {splitNumberIntoParts} = load("utils/splitNumberIntoParts.ts");
const {isAllocationBalanced} = load("utils/expenseValidation.ts");
const allocations = (...amounts) => amounts.map(amount => ({amount, isSelected: true}));
const {EXPENSE_CURRENCY_PRECISION} = load("const/currencies.ts");

test("crypto equal splits preserve small amounts and distribute the smallest units", () => {
    for (const [currency, amount, count, expected] of [
        ["BTC", 0.0001, 2, [0.00005, 0.00005]],
        ["BTC", 0.12345678, 2, [0.06172839, 0.06172839]],
        ["BTC", 0.00000003, 5, [0.00000001, 0.00000001, 0.00000001, 0, 0]],
        ["TON", 0.000000003, 2, [0.000000002, 0.000000001]],
        ["ETH", 0.000000000000000003, 2, [0.000000000000000002, 0.000000000000000001]],
        ["ETH", 1, 2, [0.5, 0.5]],
        ["USDT", 0.000003, 2, [0.000002, 0.000001]],
        ["USDC", 0.000003, 2, [0.000002, 0.000001]],
    ]) {
        const parts = splitNumberIntoParts(amount, count, EXPENSE_CURRENCY_PRECISION[currency]);
        assert.deepEqual(parts, expected, currency);
        assert.equal(isAllocationBalanced(amount, allocations(...parts)), true, currency);
    }
});

test("splitting remains balanced across currencies and participant counts", () => {
    for (const precision of [2, ...Object.values(EXPENSE_CURRENCY_PRECISION)]) {
        for (const amount of [1, 10.01, 123456789.12]) {
            for (let count = 1; count <= 30; count++) {
                const parts = splitNumberIntoParts(amount, count, precision);
                assert.ok(parts.every(part => Number.isFinite(part) && part >= 0));
                assert.equal(isAllocationBalanced(amount, allocations(...parts)), true);
            }
        }
    }
});

test("equal splitting never creates negative shares and conserves cents", () => {
    for (let cents = 0; cents <= 200; cents++) {
        for (let count = 1; count <= 30; count++) {
            const parts = splitNumberIntoParts(cents / 100, count);
            const result = parts.map(part => Math.round(part * 100));
            assert.equal(result.length, count);
            assert.equal(result.reduce((sum, part) => sum + part, 0), cents);
            assert.ok(result.every(part => part >= 0));
            assert.ok(Math.max(...result) - Math.min(...result) <= 1);
        }
    }
});

test("splitting handles invalid input and zero participants", () => {
    assert.deepEqual(splitNumberIntoParts(1, 0), []);
    assert.deepEqual(splitNumberIntoParts(1, -1), []);
    assert.deepEqual(splitNumberIntoParts(NaN, 3), [0, 0, 0]);
    assert.deepEqual(splitNumberIntoParts(Infinity, 3), [0, 0, 0]);
    assert.deepEqual(splitNumberIntoParts(10, 3), [3.34, 3.33, 3.33]);
});

test("allocation validation tolerates floating-point noise but rejects a missing cent", () => {
    assert.equal(isAllocationBalanced(0.3, allocations(0.1, 0.2)), true);
    assert.equal(isAllocationBalanced(10, allocations(5, 4.99)), false);
    assert.equal(isAllocationBalanced(0.00000003, allocations(0.00000001, 0.00000002)), true);
    assert.equal(isAllocationBalanced(0.00000003, allocations(0.00000001)), false);
    assert.equal(isAllocationBalanced(3e-18, allocations(1e-18, 2e-18)), true);
    assert.equal(isAllocationBalanced(3e-18, allocations(1e-18, 1e-18)), false);
    assert.equal(isAllocationBalanced(1e-18, allocations(0, 0)), false);
});

test("invalid, negative, absent and unselected allocations cannot balance a write", () => {
    for (const amount of [NaN, Infinity, -1, 0]) assert.equal(isAllocationBalanced(amount, allocations(amount)), false);
    for (const values of [[NaN, 10], [Infinity], [-1, 11], [undefined, 10], []]) {
        assert.equal(isAllocationBalanced(10, allocations(...values)), false);
    }
    assert.equal(isAllocationBalanced(10, [{amount: 10, isSelected: false}]), false);
    assert.equal(isAllocationBalanced(10, [...allocations(10), {amount: NaN, isSelected: false}]), true);
});
