# Commands and environment

## Declared commands

Run these from the repository root. They come from [package.json](../../package.json); their presence does not establish that they currently pass.

| Command | Script | Purpose |
| --- | --- | --- |
| `npm run dev` | `next dev` | Start the development server. |
| `npm run build` | `next build` | Create the production build. |
| `npm start` | `next start` | Serve an existing production build. |
| `npm run lint` | `next lint` | Run the configured Next.js lint command. |

There is no declared test or standalone typecheck script. To invoke the installed TypeScript compiler without emitting files or incremental metadata:

```sh
node node_modules/typescript/bin/tsc --noEmit --incremental false
```

[tsconfig.json](../../tsconfig.json) enables strict checking, `noEmit`, and bundler module resolution; it maps `@/*` to the repository root and includes generated `.next/types`. [ESLint configuration](../../.eslintrc.json) extends Next.js presets. Next is pinned to `15.1.7`, while `eslint-config-next` is pinned to `14.2.5`.

[postcss.config.mjs](../../postcss.config.mjs) loads Tailwind. [tailwind.config.ts](../../tailwind.config.ts) scans `pages/`, `components/`, and `app/` for utility classes; other root-level source directories are not listed in its content paths.

## Runtime and dependency installation

The [Dockerfile](../../Dockerfile) is the concrete deployment evidence: `node:20`, followed by `npm install`, `npm run build`, and `npm run start`, exposing port 3000. The manifest declares neither `engines` nor `packageManager`; a canonical local Node version and package manager are not documented.

Both [package-lock.json](../../package-lock.json) and [pnpm-lock.yaml](../../pnpm-lock.yaml) are tracked. The npm lockfile's root dependency specifications match the manifest, but resolved versions differ between lockfiles:

| Dependency | npm lock | pnpm lock |
| --- | --- | --- |
| TypeScript | 5.7.3 | 5.5.3 |
| Axios | 1.7.9 | 1.7.2 |
| Telegram SDK | 3.9.2 | 3.10.0 |
| Telegram SDK React | 3.2.4 | 3.3.0 |
| Zustand | 5.0.3 | 5.0.5 |

The canonical local package manager remains unknown. The Docker workflow demonstrates npm usage but does not resolve the disagreement between lockfiles.

## Environment configuration

- [API/APIConstants.ts](../../API/APIConstants.ts) reads `NEXT_PUBLIC_SERVER_URL`, falling back to `http://127.0.0.1:8000`.
- Docker accepts that variable as a build argument and sets it before `npm run build`. Supply the intended public backend URL when building the frontend image.
- No environment example or validation mechanism was found during targeted inspection. [.gitignore](../../.gitignore) ignores `.env*.local`; it does not ignore every `.env` filename.
- [next.config.mjs](../../next.config.mjs) is empty apart from its exported configuration object. Local backend and Telegram launch setup still need investigation.

## Stage deployment

[deploy-to-stage.yml](../../.github/workflows/deploy-to-stage.yml) runs on pushes to `main`. It builds and pushes `splittyapp/stage-splitty-fe:latest`, passing `NEXT_PUBLIC_SERVER_URL=https://backend-stage.splitty.digital` to Docker.

Deployment then connects over SSH and runs `/root/app/deploy-frontend.sh` on the stage host. That script is outside this repository, so host configuration, rollout behavior, and rollback procedures cannot be established here. The workflow references secrets named `DOCKERHUB_USERNAME`, `DOCKERHUB_PASSWORD`, `STAGE_PRIVATE_KEY`, and `HOST_STAGE`.

No separate test job or pull-request validation workflow was found. The Dockerfile copies the full build context and uses `npm install`; no `.dockerignore` was found. Account for local dependency, build, and environment files before constructing a local Docker image.

## Validation status and limits

No automated test runner or test suite was found during targeted inspection. `const/testExpenseId.ts` belongs to application fixture behavior, not a test suite.

No passing lint, typecheck, or build baseline is established by these notes. Declared scripts and compiler settings are verified; successful execution and runtime behavior remain unverified.

Normal Next.js commands can produce `.next/`, `next-env.d.ts`, and TypeScript metadata. Keep generated output and installed dependencies out of manual source edits; use the source configuration and package manager instead.
