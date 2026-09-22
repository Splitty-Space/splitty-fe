# Legacy risks and investigation guide

> Historical snapshot: implementation and verification changed during the 2026-09-20 audit. See [the current audit](../technical-audit.md) for fixes, dependency versions, checks, and remaining risks.

This is a selective source audit, not a runtime verification. Observed behavior is
separated below from consequences that still need reproduction or backend context.
Dependency drift, missing test infrastructure, and deployment limitations are
documented in [commands.md](commands.md).

## Verified behavior and risks to investigate

- **Authentication timing.** [Home](../../app/page.tsx) calls
  [useAuth](../../hooks/useAuth.ts), which asynchronously exchanges Telegram init
  data for a bearer token. Home and [layout](../../app/layout.tsx) also call
  [useMe](../../services/useMe.ts) without waiting for authentication. Service hooks
  read `useStore.getState().token`, which does not subscribe them to token changes.
  **Risk to verify:** requests before authentication, missing retries after the
  token changes, and direct entry to routes that never mount home.

- **Navigation depends on memory.** [Zustand state](../../app/store.ts) holds the
  selected friend, expense, participants and settlement data without persistence.
  [Expense details](../../app/expense/details/page.tsx) immediately fetches using
  `selectedExpense?.id`; [getExpense](../../services/getExpense.ts) interpolates
  that value into the URL without a guard.
  **Risk to verify:** reloads/direct links can lose context and request
  `/expenses/undefined`. Do not assume routes are independently loadable.

- **Mutation failures are suppressed.** [Add](../../services/addExpense.ts),
  [update](../../services/putExpense.ts) and [delete](../../services/deleteExpense.ts)
  expense helpers catch errors and only log them. Their callers chain success
  notifications, refetches and navigation in [expense editing](../../app/expense/add/page.tsx)
  and [details](../../app/expense/details/page.tsx).
  **Consequence inferred from control flow:** update/delete can report success
  after failure; create can pass `undefined` to a response-destructuring callback.
  The resulting UI symptoms and recovery behavior have not been runtime-tested.

- **Money validation and precision are inconsistent.** The save-enabling effect
  in [expense editing](../../app/expense/add/page.tsx) checks payer-total equality
  but does not require debtor-total equality; debtor mismatch has visual feedback.
  [Equal splitting](../../utils/splitNumberIntoParts.ts) rounds to two decimals,
  while [supported currencies](../../const/currencies.ts) include crypto assets.
  **Unknown:** authoritative balancing, precision and rounding rules. Preserve
  backend compatibility until those contracts are established.

- **Layout controls feature workflows.** [Layout](../../app/layout.tsx) combines
  Telegram lifecycle/back-button behavior, profile loading, tour steps, navigation
  and global snackbars. Tour actions write selected entities and enable
  `isForceExpenseSaveEnabled`; [expense editing](../../app/expense/add/page.tsx)
  watches that flag and calls save. [Footer](../../app/components/footer/footer.tsx)
  also clears or changes selection state during navigation.
  **Risk to verify:** isolated page changes can break tour or back-navigation
  behavior; inspect these shared controllers before changing workflow state.

- **Some UI is incomplete.** The [footer](../../app/components/footer/footer.tsx)
  shows a coming-soon snackbar for Groups. The [add-group page](../../app/groups/add/page.tsx)
  advances a two-step counter without a submission call. Home supplies a no-op
  `loadMoreRows` to its list in [app/page.tsx](../../app/page.tsx).
  **Unknown:** intended group scope and whether friends are fully returned by the
  backend. A no-op loader alone does not establish that records are missing.

- **HTTP behavior has two paths.** [Axios configuration](../../API/axiosConfig.ts)
  supplies a 20-second timeout and LRU cache to axios-hooks. Imperative services
  such as [getExpenses](../../services/getExpenses.ts) use direct Axios calls and
  do not inherit that configured instance.
  **Risk to verify:** inconsistent timeout, caching and invalidation behavior.

## Local audit context

At the 2026-09-11 audit, `app/page.tsx` had an existing working-tree change enabling the
`@/utils/mockTelegramEnv` import; the import was commented in `HEAD`. This is a
local difference, not established committed behavior. Check the current diff
before interpreting Telegram identity or authentication results. Preserve unrelated
working-tree changes and do not copy embedded mock authentication values into docs.

## Debugging entrypoints and unresolved contracts

- Trace a feature from its route through [store](../../app/store.ts), its service,
  [server URL configuration](../../API/APIConstants.ts) and
  [Telegram user ID](../../utils/getCurrentUserId.ts). Check request identity and
  response shape before assuming a rendering issue.
- For expense problems, inspect [editing](../../app/expense/add/page.tsx),
  [details](../../app/expense/details/page.tsx), mutation helpers and
  [splitting](../../utils/splitNumberIntoParts.ts). Settlements reuse expense writes
  with `payment: true` in [settlement payment](../../app/settleUpPayment/page.tsx).
- For list refresh/pagination, start with [friend expenses](../../app/friend/page.tsx)
  or [activity](../../app/activity/page.tsx). Despite its name,
  [useRefreshToken](../../utils/useRefreshToken.tsx) only changes a local UUID to
  retrigger effects; it does not refresh authentication.
- Establish backend ownership/schema, token lifetime and renewal, monetary rules,
  and supported reload/deep-link behavior. List consumers expect `data` plus
  `meta.has_more`, while [PaginationResponse](../../entities/PaginationResponse.ts)
  defines a different shape. [Expense](../../entities/Expense.ts) uses a string
  amount and `any` date, whereas creation accepts a numeric amount. These are
  handwritten types, not proof of the backend contract.
