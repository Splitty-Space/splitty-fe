# Generated files and editing boundaries

Read this before changing repository files. All paths below are relative to the repository root; a directory entry covers all descendants. `*.tsbuildinfo` applies at any depth.

## Editing rule

Do not manually edit, patch, or apply source refactors to generated output or installed dependencies. Read them when useful for diagnosis, but fix the owning source, configuration, or dependency declaration. Let the owning tool regenerate output only when needed for the task. Do not delete or regenerate unrelated artifacts as cleanup.

## Confirmed generated or installed artifacts

| Path | What it contains | Where changes belong |
| --- | --- | --- |
| `node_modules/` | Installed dependencies, including package-manager metadata and linked package content | `package.json` and the selected package manager; not installed package files |
| `.next/` | Next.js build output and caches, including generated `.next/types/` | Application source and Next.js/TypeScript configuration |
| `next-env.d.ts` | Next.js-generated TypeScript declarations; the file explicitly says not to edit it | Next.js tooling and TypeScript configuration |
| `*.tsbuildinfo` | TypeScript incremental compilation metadata, when present | TypeScript source/configuration and compiler invocation |

Evidence: [.gitignore](../../.gitignore) excludes these paths; [tsconfig.json](../../tsconfig.json) enables incremental compilation and includes `next-env.d.ts` and `.next/types/**/*.ts`; [package.json](../../package.json) declares Next.js build/development commands. The inspected checkout contained `node_modules/`, `.next/`, and the generated `next-env.d.ts` header.

## Reserved output paths

Keep `out/`, `build/`, and `coverage/` out of manual source edits. They are ignored output locations in [.gitignore](../../.gitignore), but their presence or an active producer is not established by the current configuration:

- `out/`: listed under Next.js output exclusions; no export command or export configuration was found.
- `build/`: listed under production output exclusions; no separate producer for this directory was found.
- `coverage/`: listed under testing exclusions; no test/coverage runner or script was found.

Do not assume these directories need to be created or regenerated. Their current producer is **unverified**; [next.config.mjs](../../next.config.mjs) is empty and the declared scripts are in [package.json](../../package.json).

## Tool-managed lockfiles

[package-lock.json](../../package-lock.json) and [pnpm-lock.yaml](../../pnpm-lock.yaml) are tracked dependency lockfiles, not disposable build output. Do not hand-edit them. Use the relevant package manager when an intentional dependency change requires an update; review the resulting diff and retain the lockfile in version control.

Both lockfiles exist and resolve some dependencies differently. Docker uses npm, but the canonical local manager remains **unknown**. Do not refresh, replace, or synchronize both lockfiles incidentally. See [commands.md](commands.md) for the verified workflow.

## Files outside these exclusions

- Application directories such as `app/`, `API/`, `services/`, `entities/`, `components/`, `Icons/`, and `public/` are not excluded by this guide. Types, icons, static assets, and tutorial fixtures are not generated merely because of their names or formats. No custom code-generation command was found in the manifest.
- Source configuration such as `next.config.mjs`, `tsconfig.json`, and `tailwind.config.ts` is the place to change tool behavior.
- A `.gitignore` entry alone does not prove that a file is generated or disposable. In particular, local environment files and IDE/Qodana settings are not classified as build output by this guide.

For newly introduced generators, record the output paths, producer, and editable source here before extending these exclusions. When a file's origin is unclear, mark it unverified rather than classifying it by guesswork.
