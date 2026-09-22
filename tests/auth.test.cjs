const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

test("protected profile requests wait for authentication and use the current token", () => {
    let token = "";
    const requests = [];
    const useMe = load("services/useMe.ts", {
        "axios-hooks": (config, options) => {
            requests.push({config, options});
            return [{loading: false}, () => {}];
        },
        "@/utils/getCurrentUserId": () => 1,
        "@/app/store": {useStore: selector => selector({token})},
    }).default;
    assert.equal(useMe().loading, true);
    assert.equal(requests[0].options.manual, true);
    token = "authenticated-token";
    useMe();
    assert.equal(requests[1].options.manual, false);
    assert.equal(requests[1].config.headers.Authorization, "Bearer authenticated-token");
});

test("late auth response cannot write a token after unmount", async () => {
    let effect;
    let resolve;
    let signal;
    let cleanedUp = false;
    const tokens = [];
    const errors = [];
    const useAuth = load("hooks/useAuth.ts", {
        react: {useEffect: callback => { effect = callback; }},
        "@telegram-apps/sdk": {init: () => () => { cleanedUp = true; }, retrieveRawInitData: () => "test-data"},
        "@/API/client": {apiClient: {post: (_url, _data, options) => {
            signal = options.signal;
            return new Promise(done => { resolve = done; });
        }}},
        "@/app/store": {useStore: selector => selector({token: "", setToken: token => tokens.push(token), setIsRequestErrorSnackbarShown: error => errors.push(error)})},
    }).default;
    useAuth();
    const cleanup = effect();
    cleanup();
    resolve({data: {token: "late-token"}});
    await new Promise(done => setImmediate(done));
    assert.equal(signal.aborted, true);
    assert.equal(cleanedUp, true);
    assert.deepEqual(tokens, []);
    assert.deepEqual(errors, []);
});
