## Builder and bundler for your projects

### Use cases:
* `cmmn compile [target] [-b] [--watch]`
  > Runs typescript compiler
  
* `cmmn bundle [target] [-b] [--watch] [--run] [--prod]`
  > Runs rollup bundler
  
* `cmmn gen name directory [-n]`
  > Generates component with template at directory

* default `jest.config.js`:
    ```typescript
    import config from "@cmmn/tools/test/config";
    export default config;
    ```
  
* tests: `some.spec.ts`
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
* `cmmn serve [-b]`
  serves bundled website (-b serves all websites in monorepo)