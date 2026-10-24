# The URL says which Friend or Expense a page shows

Pages for one Friend or one Expense used to read the selected entity from the in-memory store, so a reload, the Back button or a footer tap that cleared the store sent the user to the friends list. We decided to put the entity id in the URL as a query parameter (`?friendId=`, `?expenseId=`) and have the page load the entity from that id, so the store stops holding the selected Friend or Expense. Only data that is not an entity yet stays in memory: the participants of a new Expense, and the tutorial's sample Expense, which has no backend id.

## Considered Options

- Path segments (`/friends/2`) instead of query parameters: rejected because it means renaming every route folder, and the Telegram mini app never shows the URL.
- Keeping the store as a cache next to the URL: rejected because the details page refetches the Expense anyway and the Friend comes from the already loaded friends list.

## Consequences

- A page that cannot find its entity (missing or malformed id, Friend not in the friends list, Expense answering 404 or marked deleted) replaces itself with the friends list. Only a deleted Expense shows the deleted-expense snackbar; the other cases leave without one, since a malformed id only comes from a hand-edited link. A network error keeps the user on the page.
- Pages that read search parameters render inside a `<Suspense>` boundary, which Next.js requires for `useSearchParams` in statically built routes.
