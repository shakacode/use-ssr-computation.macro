import { createMacro, MacroHandler } from "babel-plugin-macros";
import { NodePath } from "@babel/core";
import * as path from "path";
import * as fs from "fs";
import * as t from "@babel/types";

function addImportStatement(importName: string, importPath: string, isDefault: boolean, nodePath: NodePath) {
  const existingImportDeclaration = nodePath.hub.file.path.node.body.find(
    p => t.isImportDeclaration(p) && p.source.value === importPath
  );

  if (!existingImportDeclaration) {
    let importDeclarator;

    if(isDefault) {
      importDeclarator = t.importDefaultSpecifier(t.identifier(importName));
    } else {
      importDeclarator = t.importSpecifier(t.identifier(importName), t.identifier(importName));
    }

    const newImportDeclaration = t.importDeclaration(
      [importDeclarator],
      t.stringLiteral(importPath),
    );      
    nodePath.hub.file.path.unshiftContainer('body', newImportDeclaration);
  }
}

const macro: MacroHandler = ({ references, state }) => {
  const currentFilename = state.file.opts.filename;

  const opts = state.opts.useSSRComputation;
  if (!opts || (opts.side !== 'client' && opts.side !== 'server')) {
    throw new Error(`The "side" option must be specified in babel-plugin-macros config in babel.config.js:
      plugins: [
        [
          "macros",
          {
            useSSRComputation: {
              isSSRBundle ? "server" : "client",
            },
          },  

      ]
    `);

  }
  const side : 'client' | 'server' = opts?.side;

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

  (references.useSSRComputation || []).map((nodePath: NodePath) => {
    const parent = nodePath.parent;
    if (t.isCallExpression(parent)) {
      if (parent.arguments.length !== 1) {
        throw new Error("Can only call linesIn with a single string argument");
      }

      const filenameNode = parent.arguments[0];
      if (!t.isStringLiteral(filenameNode)) {
        throw new Error("The first argument must be a path to an existing ts file.");
      }

      const absolutePath = path.resolve(
        path.dirname(currentFilename),
        filenameNode.value,
      );

      // throw an error if the file doesn't exist
      if (!fs.existsSync(absolutePath + '.ts') && !fs.existsSync(absolutePath + '.js')) {
        throw new Error(`The file ${absolutePath} does not exist.`);
      }

      const useSSRComputationFunctionName = `useSSRComputation${side.charAt(0).toUpperCase() + side.slice(1)}`; 
      parent.callee = t.identifier(useSSRComputationFunctionName);
      addImportStatement(useSSRComputationFunctionName, `use-ssr-computation/lib/useSSRComputation`, false, nodePath);
      
      if (side === 'server')
      {
        let importedFunctionName = filenameNode.value;
        const delimeter = '.ssr-computation';
        if (!importedFunctionName.endsWith('.ssr-computation')) {
          throw new Error(`The file ${importedFunctionName} must have the extension ${delimeter} to be used in useSSRComputation`);
        }

        importedFunctionName = importedFunctionName.replace(delimeter, '');
        importedFunctionName = importedFunctionName.replace(/[^a-zA-Z0-9]/g, '_');

        addImportStatement(importedFunctionName, filenameNode.value, true, nodePath);

        const identifier = t.identifier(importedFunctionName);
        parent.arguments.unshift(identifier);
      }
    }
  });

};

export const useSSRComputation: (filename: string, ) => number = null as any;

export default createMacro(macro, {
  configName: "useSSRComputation",
});
