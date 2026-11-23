import {test, expect, ME} from "./mockBackend";
import {addExpense, expenseParticipants} from "../const/urls";
import type {Page} from "@playwright/test";

const friend = (id: number, name: string, username: string) => ({
    id, name, username, total: [], amount: 0, default_currency: "USD", expenses: [],
});

const ALICE = friend(2, "Alice", "alice");
const BOB = friend(3, "Bob", "bobby");
const CAROL = friend(4, "Carol", "zebra42");

test.beforeEach(async ({backend, page}) => {
    backend.on("GET", "/friends", {json: {data: [ALICE, BOB, CAROL], meta: {}}});
    await page.goto(expenseParticipants);
});

const rows = (page: Page) => page.locator("#expense-participants-main").getByRole("listitem");
const row = (page: Page, name: string) => rows(page).filter({has: page.getByText(name, {exact: true})});
const nextButton = (page: Page) => page.getByRole("button", {name: "Next", exact: true});

const search = async (page: Page, value: string) => {
    const input = page.getByPlaceholder("Search");
    if (!await input.isVisible()) {
        await page.getByRole("button", {name: "Search", exact: true}).click();
    }
    await input.fill(value);
};

test("lists every friend", async ({page}) => {
    await expect(rows(page)).toHaveCount(3);
    for (const {name, username} of [ALICE, BOB, CAROL]) {
        await expect(row(page, name)).toContainText(`@${username}`);
    }
});

test("search filters by name and by username", async ({page}) => {
    await search(page, "ali");
    await expect(rows(page)).toHaveText([/Alice/]);

    await search(page, "zebra");
    await expect(rows(page)).toHaveText([/Carol/]);

    await search(page, "nobody");
    await expect(rows(page)).toHaveCount(0);
    await expect(page.getByText("Friend not found")).toBeVisible();

    await search(page, "");
    await expect(rows(page)).toHaveCount(3);
});

test("Next is enabled only while a friend is selected", async ({page}) => {
    await expect(nextButton(page)).toBeDisabled();

    await row(page, "Bob").getByRole("checkbox").check({force: true});
    await expect(nextButton(page)).toBeEnabled();

    await row(page, "Bob").getByRole("checkbox").uncheck({force: true});
    await expect(nextButton(page)).toBeDisabled();
});

test("selection survives a search", async ({page}) => {
    await row(page, "Alice").getByRole("checkbox").check({force: true});

    await search(page, "zebra");
    await row(page, "Carol").getByRole("checkbox").check({force: true});

    await search(page, "");
    await expect(row(page, "Alice").getByRole("checkbox")).toBeChecked();
    await expect(row(page, "Bob").getByRole("checkbox")).not.toBeChecked();
    await expect(row(page, "Carol").getByRole("checkbox")).toBeChecked();
});

test("Next opens the expense editor with me and the chosen friends", async ({page}) => {
    await row(page, "Alice").getByRole("checkbox").check({force: true});
    await row(page, "Carol").getByRole("checkbox").check({force: true});
    await nextButton(page).click();

    await expect(page).toHaveURL(addExpense);

    // The editor opens with one avatar per Participant, labelled by user id.
    const participantPhotos = page.locator("#expense-add-main").getByRole("img", {name: /^User photo - \d+$/});
    await expect(participantPhotos).toHaveCount(3);
    for (const {id} of [ME, ALICE, CAROL]) {
        await expect(participantPhotos.and(page.getByRole("img", {name: `User photo - ${id}`, exact: true}))).toBeVisible();
    }
});
