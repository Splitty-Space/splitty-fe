const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

const {parseId} = load("utils/parseId.ts");

test("reads a whole number id, including the tutorial's negative ids", () => {
    assert.equal(parseId("2"), 2);
    assert.equal(parseId("-1"), -1);
});

test("rejects an id that is not written as plain digits", () => {
    for (const value of [null, "", " ", "abc", "2.5", "0x2", "1e0", " 2 ", "+2", "2abc"]) {
        assert.equal(parseId(value), null, JSON.stringify(value));
    }
});
