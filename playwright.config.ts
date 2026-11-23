import {defineConfig, devices} from "@playwright/test";

const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
    testDir: "e2e",
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    reporter: process.env.CI ? [["list"], ["html", {open: "never"}]] : "list",
    use: {
        baseURL,
        locale: "en-US",
    },
    projects: [
        {
            name: "chromium",
            use: {...devices["Desktop Chrome"], viewport: {width: 390, height: 844}},
        },
    ],
    // `next dev`, not a production build: the app needs Telegram launch data, and only development
    // mocks it (utils/mockTelegramEnv.ts). The backend is faked per test in e2e/mockBackend.ts.
    webServer: {
        command: `npx next dev --port ${PORT}`,
        url: baseURL,
        // Next allows one `next dev` per folder, so locally the tests reuse a running one.
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
            // Never reached: every backend request is answered by the mock.
            NEXT_PUBLIC_SERVER_URL: "http://backend.e2e.test",
        },
    },
});
