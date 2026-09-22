const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

module.exports = function loadTypeScript(file, mocks = {}) {
    const filename = path.resolve(__dirname, "..", file);
    const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
        compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true},
        fileName: filename,
    }).outputText;
    const module = {exports: {}};
    const execute = vm.runInThisContext(`(function(require, module, exports) {${compiled}\n})`, {filename});
    execute((name) => {
        if (Object.hasOwn(mocks, name)) return mocks[name];
        throw new Error(`Missing test dependency: ${name}`);
    }, module, module.exports);
    return module.exports;
};
