# Every request carries Telegram's launch data instead of a session token

Splitty used to trade Telegram's signed launch data (initData) for a token at `POST /auth` and send that token afterwards. That cost a network round-trip before any data could load, on every Launch and every reload. The token never expired, and the backend took the user from a `user_id` the client sent, so any token could act as any user. We decided that every request sends `Authorization: tma <initData>`, and the backend checks its signature and takes the user from it. The `/auth` endpoint and the token go away. This is what the Telegram Mini Apps SDK docs recommend, and Telegram's own Serverless client does the same.

## Considered Options

- Keep the token but cache it on the device: rejected because it still needs `/auth` on the first Launch, and the token would need an expiry, refresh and per-user checks that initData already gives us.
- A cookie session so pages can render on the server: postponed, not rejected. Telegram puts initData in the URL fragment, so the server can't see it on the first request of a Launch anyway; we will revisit this with the data-layer ADR once we have measurements from real Telegram clients.
- A web version that signs in through `LoginUrl` or Telegram Login, which would allow server rendering from the first request: rejected because such a page has no Mini App APIs (back button, popups, haptics) and Splitty stays a Mini App only.

## Consequences

- initData is accepted for 24 hours after its `auth_date`. A Launch kept open longer gets 401 and shows the Session expired screen, which asks the user to open Splitty again.
- Each request carries about 700 bytes of initData, including the user's name and photo URL, so the backend must not log the `Authorization` header.
- Only parameters that meant "who is asking" leave the API. Parameters that name another person (`friend_id`, `/user/{user_id}/photo`) stay.
- The backend accepts unsigned initData only when `DEBUG=true` is set explicitly. End-to-end tests keep using the mock backend.
- The switch goes in three steps: first the backend accepts both `tma` and `Bearer`, then the frontend switches to `tma`, then the backend removes `/auth`, `Bearer` and the caller `user_id` parameters.
