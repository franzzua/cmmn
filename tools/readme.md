## Build helpers for cmmn packages

Packages are compiled by TypeScript 7 (`tsc -b` from the repository root) into `dist/esm` and `dist/typings`.
Relative imports use explicit `.ts` extensions, so `dist/esm` runs in plain Node.

### Vite

Vite (Oxc) can't lower standard decorators, so `tscOutput()` serves `tsc` output for TypeScript sources.

* library, bundles package.json `exports` into `dist/bundle`, dependencies stay external:
  ```typescript
  // vite.config.ts
  import { libConfig } from '@cmmn/tools/vite';
  export default libConfig(import.meta.dirname);
  ```
* application from an html entry:
  ```typescript
  import { appConfig } from '@cmmn/tools/vite';
  export default appConfig(import.meta.dirname, './src/index.html', { plugins: [] });
  ```
* `import url from "@scope/pkg?resolve"`: add `"@cmmn/tools/vite/client"` to tsconfig `types`.

### Tests

`some.spec.ts`, run from compiled output with `node --test "**/dist/esm/**/*.spec.js"`:
```typescript
import {suite, test, expect} from "@cmmn/tools/test";

@suite
export class SomeSpec {

    @test
    equalsTest() {
        expect(1).toEqual(2);
    }
}
```

### Dev server

* `cmmn dev` serves all packages of the monorepo
* `cmmn gen name directory [-n]` generates a component from template
