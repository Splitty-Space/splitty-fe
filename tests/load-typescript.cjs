const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
/** @type {typeof import("typescript")} */
const ts = require("typescript");

/**
 * Execute a transpiled module with explicit dependency mocks.
 * @param {string} file
 * @param {Record<string, any>} [mocks]
 * @returns {Record<string, any>}
 */
module.exports = function loadTypeScript(file, mocks = {}) {
    const filename = path.resolve(__dirname, "..", file);
    const source = fs.readFileSync(filename).toString("utf8");
    const compiled = ts.transpileModule(source, {
        compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true},
        fileName: filename,
    }).outputText;
    const loadedModule = {exports: {}};
    const execute = vm.runInThisContext(`(function(require, module, exports) {${compiled}\n})`, {filename});
    execute((name) => {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        throw new Error(`Missing test dependency: ${name}`);
    }, loadedModule, loadedModule.exports);
    return loadedModule.exports;
};
