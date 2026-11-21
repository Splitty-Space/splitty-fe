# Debugging React in the browser

An agent can open the running app in Chrome and inspect its React tree: components, props, hooks, owners, and render timing. Two pieces make this work:

- [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) is the MCP server. It is configured in [.mcp.json](../../.mcp.json) and installed as a pinned devDependency.
- [react-devtools-cdt-mcp](https://react.dev/reference/dev-tools/react-devtools-cdt-mcp) is a browser library, not an MCP server. [instrumentation-client.ts](../../instrumentation-client.ts) registers it in `next dev` only. Chrome DevTools MCP discovers its React tools from the page.

Both packages are experimental. Their tools and output can change between versions, so they are pinned to exact versions.

This setup targets a local Claude Code session. Cloud sessions have no backend, so pages there render without data.

## Before you start

1. Run the backend locally (`splitty-backend`, FastAPI on `http://127.0.0.1:8000`).
2. Run `npm run dev`. In development the Telegram environment is mocked, so the app opens in a plain browser.
3. Claude Code asks once to approve the `chrome-devtools` server from `.mcp.json`. Run `npm ci` first, because the server starts from `node_modules`.

`.mcp.json` is shared through the repository. Keep machine-specific servers, such as an IDE's MCP server on a local port, out of it: add them with `claude mcp add --scope local …`, which stores them in your own `~/.claude.json`.

The server opens its own Chrome with a temporary profile (`--isolated`). Each session starts with empty storage and cannot see your own tabs or logins. Usage statistics and CrUX lookups are turned off.

## Calling the React tools

Open the app with `navigate_page` (for example `http://localhost:3000/`). Then call `list_3p_developer_tools` to see the `react` tool group, and `execute_3p_developer_tool` to run one. That tool takes `pageId`, `toolName`, and `params` as a JSON string:

```json
{"pageId": 1, "toolName": "react_find_components", "params": "{\"name\": \"ClientLayout\"}"}
```

The tools:

| Tool | Returns |
| --- | --- |
| `react_get_component_tree` | Snapshot of the component tree (`depth`, `rootUid`) |
| `react_find_components` | Components whose name matches |
| `react_get_component_by_uid` | A component's props, and hooks with `includeHooks: true` |
| `react_get_component_by_dom_element` | The React host component for a DOM element |
| `react_get_parent_stack` | Where a component is mounted |
| `react_get_owner_stack`, `react_get_owner_stack_trace` | The components that rendered it in their JSX |
| `react_get_component_source` | Where the component is defined |
| `react_start_profiling`, `react_stop_profiling` | Start and stop recording render timing |
| `react_get_trace_overview` | One row per commit of a recording (`traceName`) |
| `react_get_commit_report` | Which components rendered in a commit and how long each took (`traceName`, `commitIndex`) |

## Things that look wrong but are expected

- **`Forget(Name)` names.** React Compiler wraps compiled components, so `ClientLayout` appears in the tree as `Forget(ClientLayout)`. `react_find_components` still finds it by the plain name.
- **Source in chunks.** `react_get_component_source` points to the bundled chunk (`http://localhost:3000/_next/static/chunks/….js:line`), not to a file under `app/`. Use the component name to find the file in the repository.
- **Short minified names.** Next.js framework components show up as short names such as `Forget(m)`. Search for your own components by name instead of walking the tree from the root.
- **uids reset on reload.** A uid such as `r5` is stable across re-renders but not across page reloads or navigations that reload the page. Look components up again after a reload.
- **Empty owner stack for top-level components.** Components rendered by server components have no client owner.

## Production builds

`instrumentation-client.ts` registers the library only when `NODE_ENV` is `development`, so `next build` leaves it out. To check, run `next build` and search `.next/static` for `devtoolstooldiscovery`. The search should find nothing.
