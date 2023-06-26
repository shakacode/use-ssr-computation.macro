import * as t from "@babel/types";

export type Dependency = number | string | { uniqueId: string; }

export type Options = {
  webpackChunkName?: string;
}

function isDependency(element: any): element is Dependency {
  return typeof element === 'number' || typeof element === 'string' || (typeof element === 'object' && element.uniqueId !== undefined);
}

export function parseSSRComputationArgs(parent: t.CallExpression): { filename: string, dependencies: Dependency[] } {
  const filenameNode = parent.arguments[0];
  const dependenciesNode = parent.arguments[1];

  // Check and parse filename
  if (!t.isStringLiteral(filenameNode)) {
    throw new Error("The first argument must be a path to an existing ts file.");
  }
  const filename: string = filenameNode.value;

  // Check and parse dependencies
  let dependencies: Dependency[] = [];
  if (dependenciesNode) {
    if (!t.isArrayExpression(dependenciesNode)) {
      throw new Error("The second argument must be an array of dependencies.");
    }

    dependencies = dependenciesNode.elements.map((element, index) => {
      if (!isDependency(element)) {
        throw new Error(`Invalid dependency at index ${index}.`);
      }
      return element.value;
    });
  }

  return { filename, dependencies };
}
