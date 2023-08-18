import { getReturnTypeOfTheDefaultExportFunction } from '../src/type-safe-checker';

describe('getReturnTypeOfTheDefaultExportFunction', () => {
  it('gets the type source of in file type', () => {
    expect(getReturnTypeOfTheDefaultExportFunction('tests/examples/type-safe-checker-in-file-type.ts')).toEqual({
      "filePath": "tests/examples/type-safe-checker-in-file-type.ts",
      "typeName": "InFileType",
    });
  })

  it('gets the type source of imported type', () => {
    expect(getReturnTypeOfTheDefaultExportFunction('tests/examples/type-safe-checker-imported-type.ts')).toEqual({
      "filePath": "tests/examples/type-safe-chcker-types.ts",
      "typeName": "ExternalType",
    });
  })

  it('gets the type source of imported aliased type', () => {
    expect(getReturnTypeOfTheDefaultExportFunction('tests/examples/type-safe-checker-aliased-type.ts')).toEqual({
      "filePath": "tests/examples/type-safe-chcker-types.ts",
      "typeName": "ExternalType",
    });
  })
});
