const {test} = require("node:test");
const assert = require("node:assert/strict");
const React = require("react");
const {renderToString} = require("react-dom/server");
const axiosHooks = require("axios-hooks");
const lruCache = require("lru-cache");
const load = require("./load-typescript.cjs");

const useAxios = axiosHooks.default;
const ME_REQUEST = {url: "/me", params: {user_id: 1}, headers: {Authorization: "Bearer token"}};

/** Configures axios-hooks the way the app does, with a fake backend that answers every request with `name`. */
function configureApp(names) {
    const requests = [];
    const apiClient = async (config) => {
        requests.push(config);
        return {data: {name: names[requests.length - 1]}, status: 200, headers: {}, config};
    };
    load("API/axiosConfig.ts", {
        "axios-hooks": axiosHooks,
        "./client": {apiClient},
        "./axiosHooksCache": load("API/axiosHooksCache.ts", {"lru-cache": lruCache}),
    });
    return requests;
}

/**
 * The first render of a mounted page (effects do not run on the server renderer).
 * Returns what it shows and its `refetch`, which sends a request the way axios-hooks does on mount:
 * with an AbortSignal added to the config.
 */
function mount(request = ME_REQUEST) {
    let refetch;
    const Page = () => {
        const [{data, loading}, r] = useAxios(request);
        refetch = r;
        return loading ? "LOADER" : data.name;
    };
    return {firstRender: renderToString(React.createElement(Page)), refetch};
}

test("a page mounted after its response is cached shows the data on its first render", async () => {
    configureApp(["Mikhail"]);
    const first = mount();
    assert.equal(first.firstRender, "LOADER");
    await first.refetch();

    assert.equal(mount().firstRender, "Mikhail");
});

test("refetch still goes to the backend, and the next mount shows its result", async () => {
    const requests = configureApp(["Mikhail", "Misha"]);
    await mount().refetch();
    await mount().refetch();

    assert.equal(requests.length, 2);
    assert.equal(mount().firstRender, "Misha");
});

test("a request with other params is not served from the cache", async () => {
    configureApp(["Mikhail"]);
    await mount().refetch();

    assert.equal(mount({...ME_REQUEST, params: {user_id: 2}}).firstRender, "LOADER");
});
