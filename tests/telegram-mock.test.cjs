const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

// Loads utils/mockTelegramEnv.ts in a browser-like global with the given env and
// returns whether it mocked the Telegram environment.
function loadMock(t, env) {
    for (const [name, value] of Object.entries(env)) {
        const previous = process.env[name];
        if (value === undefined) delete process.env[name]; else process.env[name] = value;
        t.after(() => {
            if (previous === undefined) delete process.env[name]; else process.env[name] = previous;
        });
    }
    globalThis.window = {innerHeight: 800, innerWidth: 400};
    t.after(() => { delete globalThis.window; });
    t.mock.method(console, "warn", () => {});
    const calls = [];
    const {isTelegramEnvMocked} = load("utils/mockTelegramEnv.ts", {
        "@telegram-apps/bridge": {mockTelegramEnv: options => calls.push(options), emitEvent: () => {}},
        "@/API/APIConstants": {MASTER_USER_ID: 1},
    });
    return {isTelegramEnvMocked, mocked: calls.length === 1};
}

test("a production build mocks Telegram when built with the local flag", (t) => {
    const result = loadMock(t, {NODE_ENV: "production", NEXT_PUBLIC_MOCK_TELEGRAM_ENV: "true"});
    assert.deepEqual(result, {isTelegramEnvMocked: true, mocked: true});
});

test("a production build without the flag does not mock Telegram", (t) => {
    const result = loadMock(t, {NODE_ENV: "production", NEXT_PUBLIC_MOCK_TELEGRAM_ENV: "false"});
    assert.deepEqual(result, {isTelegramEnvMocked: false, mocked: false});
});

test("next dev always mocks Telegram", (t) => {
    const result = loadMock(t, {NODE_ENV: "development", NEXT_PUBLIC_MOCK_TELEGRAM_ENV: undefined});
    assert.deepEqual(result, {isTelegramEnvMocked: true, mocked: true});
});
