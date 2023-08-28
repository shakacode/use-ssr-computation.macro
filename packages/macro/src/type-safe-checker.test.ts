import { getReturnTypeOfTheDefaultExportFunction } from './type-safe-checker';

describe('getReturnTypeOfTheDefaultExportFunction', () => {
  it('gets the type source of in file type', () => {
    expect(getReturnTypeOfTheDefaultExportFunction('src/examples/type-safe-checker-in-file-type.ts')).toEqual({
      "filePath": "src/examples/type-safe-checker-in-file-type.ts",
      "typeName": "InFileType",
    });
  })

  it('gets the type source of imported type', () => {
    expect(getReturnTypeOfTheDefaultExportFunction('src/examples/type-safe-checker-imported-type.ts')).toEqual({
      "filePath": "src/examples/type-safe-chcker-types.ts",
      "typeName": "ExternalType",
    });
  })

  it('gets the type source of imported aliased type', () => {
    expect(getReturnTypeOfTheDefaultExportFunction('src/examples/type-safe-checker-aliased-type.ts')).toEqual({
      "filePath": "src/examples/type-safe-chcker-types.ts",
      "typeName": "ExternalType",
    });
  })
});
