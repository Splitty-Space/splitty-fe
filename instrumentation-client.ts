// Next.js runs this file in the browser before React hydrates the app.
// React DevTools for agents (react-devtools-cdt-mcp) must install its hook
// before react-dom loads, so it is registered here and not in client-layout.tsx.
// The NODE_ENV check keeps the package out of production builds.
// See docs/agent/browser-debugging.md.
if (process.env.NODE_ENV === "development") {
    require("react-devtools-cdt-mcp/register");
}
