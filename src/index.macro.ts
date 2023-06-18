import { createMacro, MacroHandler } from "babel-plugin-macros";
import { NodePath } from "@babel/core";
import * as path from "path";
import * as fs from "fs";

const macro: MacroHandler = ({ references, state, babel }) => {
  const t = babel.types;
  
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

  const contentsCache: { [filename: string]: string } = {
    "/": state.file.code,
  };

  const readFile = (filename: string): string => {
    let contents = contentsCache[filename];
    if (contents == null) {
      contents = fs.readFileSync(filename, "utf-8");
      contentsCache[filename] = contents;
    }

    return contents;
  };


  (references.useSSRComputation || []).map((nodePath: NodePath) => {
    const parent = nodePath.parent;
    if (t.isCallExpression(parent)) {
      if (parent.arguments.length !== 1) {
        throw new Error("Can only call linesIn with a single string argument");
      }

      const filenameNode = parent.arguments[0];
      if (!t.isStringLiteral(filenameNode)) {
        throw new Error("Argument to linesIn must be a string literal");
      }

      const absolutePath = path.resolve(
        path.dirname(currentFilename),
        filenameNode.value,
      );

      console.log( true || readFile(absolutePath));

      nodePath.parentPath.replaceWith(t.stringLiteral(`Hello ${side} ${absolutePath}`));
    }
  });

};


export const useSSRComputation: (filename: string, ) => number = null as any;

export default createMacro(macro, {
  configName: "useSSRComputation",
});
