import * as t from "@babel/types";
import { Options as RuntimeOptions } from "@popmenu/use-ssr-computation.runtime/src/utils"

type MacroOptions = {
  serverSideOnly?: boolean;
  webpackChunkName?: string;
};

export type Options = MacroOptions & RuntimeOptions;

// `ExtractObjectTypes` maps each property of the input object `T` to a string representing its type
type ExtractObjectTypes<T> = {
  [K in keyof Required<T>]: T[K] extends (boolean | undefined) ? 'boolean' :
                    T[K] extends (string | undefined) ? 'string' :
                    never;
};

const macroOptionsToTypes: ExtractObjectTypes<MacroOptions> = {
  serverSideOnly: 'boolean',
  webpackChunkName: 'string',
};

export function extractMacroOptions(optionsNode: t.ObjectExpression): MacroOptions {
  const macroOptions: MacroOptions = {};
  Object.entries(macroOptionsToTypes).forEach(([macroOptionName, macroOptionType]) => {
    for (const property of optionsNode.properties) {
      if (!t.isObjectProperty(property) || !(t.isIdentifier(property.key) || t.isStringLiteral(property.key))) continue;

      const propertyKey = t.isStringLiteral(property.key) ? property.key.value : property.key.name;
      if (propertyKey !== macroOptionName) continue;

      switch (macroOptionType) {
        case 'boolean':
          if (!t.isBooleanLiteral(property.value)) {
            throw new Error(`The ${macroOptionName} property must be a boolean literal.`);
          }
          break;
        case 'string':
          if (!t.isStringLiteral(property.value)) {
            throw new Error(`The ${macroOptionName} property must be a string literal.`);
          }
          break;
      }

      // add to macro options and remove from optionsNode
      macroOptions[macroOptionName] = property.value.value;
      optionsNode.properties.splice(optionsNode.properties.indexOf(property), 1);
    }
  });

  return macroOptions;
};
