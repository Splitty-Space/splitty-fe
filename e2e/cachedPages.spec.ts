import {test, expect, ME} from "./mockBackend";
import {account, friendsList} from "../const/urls";
import type {Page} from "@playwright/test";

const ALICE = {id: 2, name: "Alice", username: "alice", total: [], amount: 0, default_currency: "USD", expenses: []};

declare global {
    interface Window {
        loaderShownOn: string[];
    }
}

/**
 * Records every page where the page loader (a `.loader` right inside `<main>`) was shown.
 * A MutationObserver callback runs before the browser paints, so it also catches a loader that is
 * replaced on the next render. Deeper loaders are left out: pull-to-refresh keeps its own hidden one.
 */
const recordLoaders = (page: Page) => page.addInitScript(() => {
    window.loaderShownOn = [];
    new MutationObserver(() => {
        if (document.querySelector("main > .loader")) {
            window.loaderShownOn.push(location.pathname);
        }
    }).observe(document, {childList: true, subtree: true});
});

const loaderShownOn = (page: Page) => page.evaluate(() => window.loaderShownOn);
const forgetLoaders = (page: Page) => page.evaluate(() => {
    window.loaderShownOn = [];
});
// The Next.js dev tools button covers the Friends tab in `next dev`, so a real click would hit it.
const openTab = (page: Page, name: string) =>
    page.locator("footer").getByRole("button", {name, exact: true}).dispatchEvent("click");

test("pages whose data is already loaded open without a loader", async ({backend, page}) => {
    backend.on("GET", "/friends", {json: {data: [ALICE], meta: {}}});
    await recordLoaders(page);
    await page.goto(friendsList);
    await expect(page.getByText("Alice", {exact: true})).toBeVisible();
    // The first load of a Launch really waits for the backend.
    expect(await loaderShownOn(page)).toContain(friendsList);
    await forgetLoaders(page);

    await openTab(page, "Account");
    await expect(page).toHaveURL(account);
    await expect(page.locator("main").getByText(ME.name, {exact: true})).toBeVisible();

    await openTab(page, "Friends");
    await expect(page).toHaveURL(friendsList);
    await expect(page.getByText("Alice", {exact: true})).toBeVisible();

    expect(await loaderShownOn(page)).toEqual([]);
});

test("a changed currency is shown when Account is opened again", async ({backend, page}) => {
    backend
        .on("GET", "/friends", {json: {data: [ALICE], meta: {}}})
        .on("PUT", "/settings", {json: {}});
    await recordLoaders(page);
    await page.goto(account);
    const currency = page.locator("main").getByRole("combobox").first();
    await expect(currency).toHaveValue("USD");

    backend.on("GET", "/me", {json: {...ME, default_currency: "EUR"}});
    await currency.selectOption("EUR");
    await expect(currency).toHaveValue("EUR");

    await openTab(page, "Friends");
    await expect(page.getByText("Alice", {exact: true})).toBeVisible();
    await forgetLoaders(page);
    await openTab(page, "Account");
    await expect(currency).toHaveValue("EUR");
    expect(await loaderShownOn(page)).toEqual([]);
});
