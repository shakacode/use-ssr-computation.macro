// const mockFs = require('mock-fs');
import { getReturnTypeOfTheDefaultExportFunction } from './type-safe-checker';

// const file1Content = `
// export type A = {
//   a: string;
//   b: number;
// }
// `

// const file2Content = `
// import { A } from './file1';

// export default function() : A {
//   return {
//     a: 'a',
//     b: 1
//   }
// }
// `

describe('getTypeSource', () => {
  beforeEach(() => {
    // mockFs({
    //   '/dir/file1.ts': file1Content,
    //   '/dir/file2.ts': file2Content,
    // });
  });

  afterEach(() => {
    // mockFs.restore();
  });

  it('gets the type source', () => {
    const typeSource = getReturnTypeOfTheDefaultExportFunction('src/test2.ts');
    console.log(typeSource);
  })
});
