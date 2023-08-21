"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var type_safe_checker_1 = require("../src/type-safe-checker");
describe('getReturnTypeOfTheDefaultExportFunction', function () {
    it('gets the type source of in file type', function () {
        expect((0, type_safe_checker_1.getReturnTypeOfTheDefaultExportFunction)('tests/examples/type-safe-checker-in-file-type.ts')).toEqual({
            "filePath": "tests/examples/type-safe-checker-in-file-type.ts",
            "typeName": "InFileType",
        });
    });
    it('gets the type source of imported type', function () {
        expect((0, type_safe_checker_1.getReturnTypeOfTheDefaultExportFunction)('tests/examples/type-safe-checker-imported-type.ts')).toEqual({
            "filePath": "tests/examples/type-safe-chcker-types.ts",
            "typeName": "ExternalType",
        });
    });
    it('gets the type source of imported aliased type', function () {
        expect((0, type_safe_checker_1.getReturnTypeOfTheDefaultExportFunction)('tests/examples/type-safe-checker-aliased-type.ts')).toEqual({
            "filePath": "tests/examples/type-safe-chcker-types.ts",
            "typeName": "ExternalType",
        });
    });
});
