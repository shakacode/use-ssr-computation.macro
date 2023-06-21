"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var babel_plugin_macros_1 = require("babel-plugin-macros");
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var t = __importStar(require("@babel/types"));
function addImportStatement(importName, importPath, isDefault, nodePath) {
    var existingImportDeclaration = nodePath.hub.file.path.node.body.find(function (p) { return t.isImportDeclaration(p) && p.source.value === importPath; });
    if (!existingImportDeclaration) {
        var importDeclarator = void 0;
        if (isDefault) {
            importDeclarator = t.importDefaultSpecifier(t.identifier(importName));
        }
        else {
            importDeclarator = t.importSpecifier(t.identifier(importName), t.identifier(importName));
        }
        var newImportDeclaration = t.importDeclaration([importDeclarator], t.stringLiteral(importPath));
        nodePath.hub.file.path.unshiftContainer('body', newImportDeclaration);
    }
}
var macro = function (_a) {
    var references = _a.references, state = _a.state;
    var currentFilename = state.file.opts.filename;
    var opts = state.opts.useSSRComputation;
    if (!opts || (opts.side !== 'client' && opts.side !== 'server')) {
        throw new Error("The \"side\" option must be specified in babel-plugin-macros config in babel.config.js:\n      plugins: [\n        [\n          \"macros\",\n          {\n            useSSRComputation: {\n              isSSRBundle ? \"server\" : \"client\",\n            },\n          },  \n\n      ]\n    ");
    }
    var side = opts === null || opts === void 0 ? void 0 : opts.side;
    // const contentsCache: { [filename: string]: string } = {
    //   "/": state.file.code,
    // };
    // const readFile = (filename: string): string => {
    //   let contents = contentsCache[filename];
    //   if (contents == null) {
    //     contents = fs.readFileSync(filename, "utf-8");
    //     contentsCache[filename] = contents;
    //   }
    //   return contents;
    // };
    (references.useSSRComputation || []).map(function (nodePath) {
        var parent = nodePath.parent;
        if (t.isCallExpression(parent)) {
            if (parent.arguments.length !== 1) {
                throw new Error("Can only call linesIn with a single string argument");
            }
            var filenameNode = parent.arguments[0];
            if (!t.isStringLiteral(filenameNode)) {
                throw new Error("The first argument must be a path to an existing ts file.");
            }
            var absolutePath = path.resolve(path.dirname(currentFilename), filenameNode.value);
            // throw an error if the file doesn't exist
            if (!fs.existsSync(absolutePath + '.ts') && !fs.existsSync(absolutePath + '.js')) {
                throw new Error("The file " + absolutePath + " does not exist.");
            }
            var useSSRComputationFunctionName = "useSSRComputation" + (side.charAt(0).toUpperCase() + side.slice(1));
            parent.callee = t.identifier(useSSRComputationFunctionName);
            addImportStatement(useSSRComputationFunctionName, "use-ssr-computation/lib/useSSRComputation", false, nodePath);
            if (side === 'server') {
                var importedFunctionName = filenameNode.value;
                var delimeter = '.ssr-computation';
                if (!importedFunctionName.endsWith('.ssr-computation')) {
                    throw new Error("The file " + importedFunctionName + " must have the extension " + delimeter + " to be used in useSSRComputation");
                }
                importedFunctionName = importedFunctionName.replace(delimeter, '');
                importedFunctionName = importedFunctionName.replace(/[^a-zA-Z0-9]/g, '_');
                addImportStatement(importedFunctionName, filenameNode.value, true, nodePath);
                var identifier = t.identifier(importedFunctionName);
                parent.arguments.unshift(identifier);
            }
        }
    });
};
exports.useSSRComputation = null;
exports.default = babel_plugin_macros_1.createMacro(macro, {
    configName: "useSSRComputation",
});
