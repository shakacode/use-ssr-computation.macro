import * as babel from "@babel/core";
import * as t from "@babel/types";
import fs from "fs";
import path from "path";

type CustomTypeSource = {
  typeName: string;
  filePath: string;
};

type TypeSource = t.TSBaseType | CustomTypeSource;

const isCustomTypeSource = (typeSource: TypeSource): typeSource is CustomTypeSource => {
  return (typeof typeSource === "object" && "typeName" in typeSource && "filePath" in typeSource);
}

export const isSameTypeSource = (a: TypeSource, b: TypeSource) => {
  if (isCustomTypeSource(a) && isCustomTypeSource(b)) {
    return a.typeName === b.typeName && a.filePath === b.filePath;
  }

  if (isCustomTypeSource(a) || isCustomTypeSource(b)) {
    return false;
  }

  return a.type === b.type;
}

export const getTypeSourceFromAst = (typeName: string, ast: t.Node, filepath: string): TypeSource => {
  let typeDeclaration: any = null;
  let importDeclaration: any = null;
  babel.traverse(ast, {
    TSTypeAliasDeclaration(path) {
      const node = path.node;
      if (node.id.name === typeName) {
        typeDeclaration = node;
      }
    },
    ImportDeclaration(path) {
      const node = path.node;
      const specificer = node.specifiers.find(
        (specifier) => specifier.local.name === typeName
      );

      if (specificer) {
        importDeclaration = node;
      }
    }
  });

  if (typeDeclaration) {
    return {
      typeName,
      filePath: filepath,
    };
  }

  if (!t.isImportDeclaration(importDeclaration)) {
    throw new Error(`Can't find the type "${typeName}" declaration in ${filepath}`)
  }

  const importSpecificer = importDeclaration.specifiers.find(
    (specifier) => specifier.local.name === typeName
  );

  if (importDeclaration) {
    const importPath = importDeclaration.source.value;
    const importFilepath = path.resolve(
      path.dirname(filepath),
      importPath
    ) + ".ts";
    const importFileRelativePath = path.relative(process.cwd(), importFilepath);

    const babelOptions = babel.loadOptions({ filename: importFileRelativePath }) as babel.TransformOptions;
    const importAst = babel.parseSync(
      fs.readFileSync(importFileRelativePath, "utf-8"),
      babelOptions
    );

    if (!importAst) {
      throw new Error("The return type is not defined");
    }

    const typeNameInTheOtherFile = t.isImportSpecifier(importSpecificer) ? t.isIdentifier(importSpecificer.imported) ? importSpecificer.imported.name : importSpecificer.imported.value : typeName;
    const importTypeSource = getTypeSourceFromAst(typeNameInTheOtherFile, importAst, importFileRelativePath);
    return importTypeSource;
  }

  throw new Error("The return type is not defined");
}

export const getReturnTypeOfTheDefaultExportFunction = (filePath: string) => {
  const code = fs.readFileSync(filePath, "utf-8");
  const babelOptions = babel.loadOptions({ filename: filePath }) as babel.TransformOptions;
  const ast = babel.parseSync(code, babelOptions);

  if (!ast) {
    throw new Error("The return type is not defined");
  }

  const defaultExport = ast.program.body.find(
    (node) => node.type === "ExportDefaultDeclaration"
  ) as t.ExportDefaultDeclaration;

  if (!defaultExport || !t.isFunctionDeclaration(defaultExport.declaration)) {
    throw new Error(`Can't find a default exported function in file ${filePath}`);
  }

  const defaultExportFunction = defaultExport.declaration;
  const returnTypeAnnotation = defaultExportFunction?.returnType;

  if (!t.isTSTypeAnnotation(returnTypeAnnotation)) {
    throw new Error("The return type is not defined");
  }

  const returnType = returnTypeAnnotation.typeAnnotation;
  if (t.isTSTypeReference(returnType) && t.isIdentifier(returnType.typeName)) {
    const typeName = returnType.typeName.name;
    return getTypeSourceFromAst(typeName, ast, filePath);
  }

  throw new Error("The return type is not defined");
};
