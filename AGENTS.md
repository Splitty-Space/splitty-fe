# Agent guide

Splitty is a single Next.js App Router frontend for a Telegram expense-sharing mini app.

- [Architecture](docs/agent/architecture.md): repository map, entry points, data flow, and current contracts.
- [Commands](docs/agent/commands.md): scripts, configuration, dependencies, checks, and deployment.
- [Legacy notes](docs/agent/legacy.md): verified implementation issues, inferred risks, and open questions.
- Read [Generated files](docs/agent/generated.md) before editing: excluded paths, tool-managed lockfiles, and source/configuration boundaries.

For a feature, trace its `app/` route through `app/store.ts` and the relevant `services/` calls. Friend, expense, and settlement routes depend on selections held in memory, outside the URL.

Both npm and pnpm lockfiles exist; Docker uses npm. The canonical local package manager is unconfirmed. No automated test suite was found; do not report unrun or blocked checks as passing.

Do not manually edit generated artifacts or installed dependencies. Fix their source/configuration instead; use the owning tool for required regeneration or lockfile updates, as described in the generated-files guide.
