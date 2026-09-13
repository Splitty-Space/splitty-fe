# Repository architecture

This describes inspected repository code, not a verified running deployment. Runtime risks and unresolved requirements are separated in [legacy.md](legacy.md); setup and build details are in [commands.md](commands.md).

## Application and module map

[package.json](../../package.json) defines one private application, `splitty-fe`, using Next.js 15.1.7, React 18, TypeScript, and Zustand. No workspace declaration, additional application package, or backend implementation was found in the inspected source structure.

| Location | Responsibility |
| --- | --- |
| [app/](../../app) | App Router pages, root layout, shared state, and page-specific UI/business logic |
| [app/components/](../../app/components) | Shell and reusable UI: headers, footer, scrolling container, avatars, loaders, pull-to-refresh |
| [components/](../../components) | Shared currency selector and its CSS |
| [services/](../../services) | REST request hooks and imperative read/write helpers |
| [API/](../../API) | Backend URL and global axios-hooks configuration |
| [entities/](../../entities) | Handwritten expense, user, friend, group, activity, transaction, and response types |
| [hooks/](../../hooks), [utils/](../../utils) | Authentication, layout hooks, Telegram helpers, formatting, expense splitting, and tutorial data |
| [const/](../../const) | Routes, currencies, languages, theme/platform values, and tutorial constants |
| [i18n/index.ts](../../i18n/index.ts) | i18next initialization and inline translation resources |
| [Icons/](../../Icons), [public/](../../public) | React icons and static assets |

## Entry points and routes

[app/layout.tsx](../../app/layout.tsx) is a client component. It imports i18n, HTTP configuration, and global styles; supplies Telegram UI, MUI, date-picker, and appearance/platform providers; mounts Telegram capabilities; manages the back button, footer, tour, and snackbars; and reads profile/friend data.

[app/page.tsx](../../app/page.tsx) renders the friends list. It calls `useAuth()` and initializes the Telegram SDK and analytics. These startup responsibilities are split between the home page and root layout.

The route constants are centralized in [const/urls.ts](../../const/urls.ts):

| URL | Page | Role |
| --- | --- | --- |
| `/` | [app/page.tsx](../../app/page.tsx) | Friends and balances |
| `/friend` | [app/friend/page.tsx](../../app/friend/page.tsx) | Selected friend's expenses and settlement entry |
| `/friend/settings` | [app/friend/settings/page.tsx](../../app/friend/settings/page.tsx) | Friend settings/deletion |
| `/expense/participants` | [app/expense/participants/page.tsx](../../app/expense/participants/page.tsx) | Participant selection |
| `/expense/add` | [app/expense/add/page.tsx](../../app/expense/add/page.tsx) | Create or edit an expense |
| `/expense/details` | [app/expense/details/page.tsx](../../app/expense/details/page.tsx) | Details, history, edit/delete actions |
| `/settleUp` | [app/settleUp/page.tsx](../../app/settleUp/page.tsx) | Settlement currency selection |
| `/settleUpPayment` | [app/settleUpPayment/page.tsx](../../app/settleUpPayment/page.tsx) | Create or edit a settlement record |
| `/activity` | [app/activity/page.tsx](../../app/activity/page.tsx) | Activity feed |
| `/account` | [app/account/page.tsx](../../app/account/page.tsx) | Profile preferences and guide entry |
| `/groups` | [app/groups/page.tsx](../../app/groups/page.tsx) | Groups list |
| `/groups/add` | [app/groups/add/page.tsx](../../app/groups/add/page.tsx) | Group setup UI |

The footer's Groups action currently shows a coming-soon snackbar instead of navigating; the existence of group routes does not establish a complete feature. See [footer.tsx](../../app/components/footer/footer.tsx).

## State and request flow

The representative flow is `page/component -> local React state + Zustand -> service -> REST backend`. Forms and list pages contain business logic as well as rendering; the folders do not enforce a separate domain-service layer.

- [app/store.ts](../../app/store.ts) uses Zustand with devtools and no persistence middleware. It holds the bearer token, search text, selected friend/expense/participants, settlement context, and tour/snackbar flags.
- Navigation sets this state before changing a static route. For example, the home page sets `selectedUserId` before pushing `/friend`; the expense details page reads `selectedExpense`. Entity IDs are not encoded in these route paths.
- [hooks/useAuth.ts](../../hooks/useAuth.ts) posts Telegram raw initialization data as `init_data_raw` to `/auth`, then stores the returned `token`. [utils/getCurrentUserId.ts](../../utils/getCurrentUserId.ts) obtains identity from Telegram initialization data.
- [API/axiosConfig.ts](../../API/axiosConfig.ts) configures axios-hooks with `SERVER_URL`, JSON content type, a 20-second timeout, and an LRU cache of at most 100 entries. Hooks such as [useMe.ts](../../services/useMe.ts) provide bearer headers and user ID per request.
- Imperative helpers such as [getExpenses.ts](../../services/getExpenses.ts) use direct Axios calls and full URLs. They do not use the configured axios-hooks instance.
- [utils/useRefreshToken.tsx](../../utils/useRefreshToken.tsx) changes a random UUID to retrigger effects. Despite its name, it does not refresh the authentication token.

## Current data contracts

These are frontend representations; backend validation and guarantees remain unverified.

- [Expense](../../entities/Expense.ts) declares a string `amount`, a `payment` flag, participant records, and an `any` date. [ExpenseUser](../../entities/ExpenseUser.ts) declares numeric `lent_amount` and `debt_amount`.
- [addExpense.ts](../../services/addExpense.ts) sends numeric amounts, payer/debtor allocations, participant IDs, currency, date, description, and `payment`. [putExpense.ts](../../services/putExpense.ts) sends allocations, participants, amount, and description, but omits currency/date/payment.
- Settlements use the expense endpoint with `payment: true`; regular expense creation uses `payment: false`. See [settleUpPayment/page.tsx](../../app/settleUpPayment/page.tsx) and [expense/add/page.tsx](../../app/expense/add/page.tsx).
- The friend page consumes expense lists as `{ data, meta: { has_more } }` inside the Axios response body. [PaginationResponse.ts](../../entities/PaginationResponse.ts) declares a different shape, so it is not an authoritative description of that consumer's response.

## UI, localization, and integrations

- Telegram SDK/bridge provide initialization data, viewport and navigation behavior, sharing, and haptics. Analytics configuration is embedded in the home page; the referral bot URL is embedded in [friendsHeader.tsx](../../app/components/friendsHeader/friendsHeader.tsx).
- Telegram UI components coexist with MUI/Emotion and Tailwind/global CSS. [globals.css](../../app/globals.css), [main.tsx](../../app/components/main/main.tsx), and [useContentHeight.ts](../../hooks/useContentHeight.ts) coordinate scrolling and measured list height. Several lists use React Virtualized.
- The root layout explicitly sets dark appearance and iOS platform styling and uses Reactour for onboarding. Tour actions can add a tutorial friend and trigger expense saving; they are not purely visual.
- [i18n/index.ts](../../i18n/index.ts) configures browser language detection, English fallback, debug logging, and `en`/`ru`/`ua` resources. The layout applies the profile language and maps `ua` to Day.js `uk` for the date-picker adapter.
- REST access covers profile/settings, friends, expenses, groups, activities, and photo blobs; representative implementations are in [services/](../../services). Backend source, token lifetime, and financial validation rules were not found here.

## Debugging entry points

Start with the affected route and its state in `app/store.ts`, then inspect its service call, Telegram user ID/token, and response shape. For expense calculations read the editor and [splitNumberIntoParts.ts](../../utils/splitNumberIntoParts.ts). For blank startup read the home page, root layout, and auth hook. For scrolling/keyboard issues start with `Main`, `useContentHeight`, the footer, and global CSS.
