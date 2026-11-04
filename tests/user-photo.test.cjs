const {test} = require("node:test");
const assert = require("node:assert/strict");
const load = require("./load-typescript.cjs");

const dataUrl = load("utils/toDataUrl.ts");
const {toDataUrl} = dataUrl;

const bytes = (...values) => new Uint8Array(values).buffer;
const headers = (contentType) => ({getContentType: () => contentType});

function userPhoto(options) {
    const {token = "token", state = {}} = options;
    // A default parameter would replace an explicit undefined, which is the "no user" case.
    const userId = "userId" in options ? options.userId : 2;
    const calls = [];
    const {useUserPhoto} = load("services/useUserPhoto.ts", {
        "axios-hooks": (config, options) => {
            calls.push({config, options});
            return [{data: undefined, loading: false, error: null, ...state}, () => {}];
        },
        "@/app/store": {useStore: selector => selector({token})},
        "@/utils/toDataUrl": dataUrl,
    });
    return {result: useUserPhoto(userId), request: calls[0]};
}

test("turns photo bytes into a data URL with the response content type", () => {
    assert.equal(toDataUrl(bytes(1, 2, 3), "image/png"), "data:image/png;base64,AQID");
});

test("falls back to JPEG when the response has no content type", () => {
    assert.equal(toDataUrl(bytes(1, 2, 3), undefined), "data:image/jpeg;base64,AQID");
});

test("gives no URL for an empty photo", () => {
    assert.equal(toDataUrl(new ArrayBuffer(0), "image/png"), "");
});

test("encodes a photo larger than one chunk without losing bytes", () => {
    const photo = Uint8Array.from({length: 100_000}, (_, index) => index % 256);
    const url = toDataUrl(photo.buffer, "image/png");
    const decoded = Buffer.from(url.slice("data:image/png;base64,".length), "base64");
    assert.deepEqual(new Uint8Array(decoded), photo);
});

test("requests the photo as bytes and caches it as a data URL", () => {
    const {request} = userPhoto({});
    assert.equal(request.config.responseType, "arraybuffer");
    const photo = request.config.transformResponse.call({params: {user_id: 2}}, bytes(1, 2, 3), headers("image/png"), 200);
    assert.deepEqual(photo, {url: "data:image/png;base64,AQID", userId: 2});
    assert.equal(request.options.manual, false);
});

test("leaves an error response as it came", () => {
    const {request} = userPhoto({});
    const body = bytes(1);
    assert.equal(request.config.transformResponse.call({params: {user_id: 2}}, body, headers("application/json"), 404), body);
});

const url = "data:image/png;base64,AQID";

test("shows the cached photo once it has loaded", () => {
    assert.equal(userPhoto({state: {data: {url, userId: 2}}}).result.photoUrl, url);
});

test("hides the previous user's photo when the avatar switches users", () => {
    assert.equal(userPhoto({userId: 3, state: {data: {url, userId: 2}}}).result.photoUrl, "");
});

test("hides the photo while it loads, after an error, or without a user or token", () => {
    const data = {url, userId: 2};
    for (const [name, options] of [
        ["loading", {state: {data, loading: true}}],
        ["error", {state: {data, error: new Error("failed")}}],
        ["no user", {userId: undefined, state: {data}}],
        ["no token", {token: "", state: {data}}],
    ]) {
        assert.equal(userPhoto(options).result.photoUrl, "", name);
    }
});

test("does not request a photo without a valid user id or a token", () => {
    assert.equal(userPhoto({userId: 0}).request.options.manual, true);
    assert.equal(userPhoto({token: ""}).request.options.manual, true);
});
