# Agent guide

Splitty is a single Next.js App Router frontend for a Telegram expense-sharing mini app.

- [Architecture](docs/agent/architecture.md): repository map, entry points, data flow, and current contracts.
- [Commands](docs/agent/commands.md): scripts, configuration, dependencies, checks, and deployment.
- [Legacy notes](docs/agent/legacy.md): verified implementation issues, inferred risks, and open questions.
- Read [Generated files](docs/agent/generated.md) before editing: excluded paths, tool-managed lockfiles, and source/configuration boundaries.

For a feature, trace its `app/` route through `app/store.ts` and the relevant `services/` calls. Friend, expense, and settlement routes depend on selections held in memory, outside the URL.

npm is the package manager (`package-lock.json`, installed with `npm ci`); Node 24 is pinned in `.nvmrc` and the Dockerfile. Pull requests run `npm run lint`, `npm run typecheck`, `npm test` and a Docker build in `.github/workflows/checks.yml`. Do not report unrun or blocked checks as passing.

Do not manually edit generated artifacts or installed dependencies. Fix their source/configuration instead; use the owning tool for required regeneration or lockfile updates, as described in the generated-files guide.

## Agent skills

### Issue tracker

Issues live in GitHub Issues for `Splitty-Space/splitty-fe`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
