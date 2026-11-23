import {test as base, expect, type Route} from "@playwright/test";
import {MASTER_USER_ID} from "../API/APIConstants";

// The development Telegram mock (utils/mockTelegramEnv.ts) launches the app as this user.
export const ME = {
    id: MASTER_USER_ID,
    name: "Mikhail",
    language: "en",
    default_currency: "USD",
    username: "mikhail",
    referral_code: "e2e",
    // false would open the Tutorial on top of every page.
    isGuideShown: true,
};

// 1×1 transparent PNG, so avatars load like real photos.
const PHOTO = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
    "base64",
);

type Response = {status?: number, json: unknown} | {status?: number, body: Buffer, contentType: string};

interface Mock {
    method: string;
    path: string | RegExp;
    response: Response;
}

export class MockBackend {
    private readonly mocks: Mock[] = [];
    readonly unexpectedRequests: string[] = [];

    on(method: string, path: string | RegExp, response: Response) {
        // Later mocks win, so a test can override a default.
        this.mocks.unshift({method, path, response});
        return this;
    }

    async handle(route: Route) {
        const request = route.request();
        const {pathname, search} = new URL(request.url());
        const mock = this.mocks.find(({method, path}) =>
            method === request.method() &&
            (typeof path === "string" ? path === pathname : path.test(pathname)));

        if (!mock) {
            this.unexpectedRequests.push(`${request.method()} ${pathname}${search}`);
            await route.abort();
            return;
        }

        const {response} = mock;
        if ("json" in response) {
            await route.fulfill({status: response.status ?? 200, json: response.json});
        } else {
            await route.fulfill({status: response.status ?? 200, body: response.body, contentType: response.contentType});
        }
    }
}

/**
 * Every request that leaves the app's own origin goes to the backend and is answered here.
 * A request with no mock is aborted and fails the test after it ends, so a page never
 * passes on silently missing data. Mocks match on method and path, whatever the backend URL.
 */
export const test = base.extend<{backend: MockBackend}>({
    backend: [async ({page, baseURL}, provide) => {
        const backend = new MockBackend()
            .on("POST", "/auth", {json: {token: "e2e-token"}})
            .on("GET", "/me", {json: ME})
            .on("GET", /^\/user\/\d+\/photo$/, {body: PHOTO, contentType: "image/png"});

        const appOrigin = new URL(baseURL!).origin;
        await page.route((url) => url.origin !== appOrigin, (route) => backend.handle(route));

        await provide(backend);

        expect(backend.unexpectedRequests, "backend requests with no mock").toEqual([]);
    }, {auto: true}],
});

export {expect};
