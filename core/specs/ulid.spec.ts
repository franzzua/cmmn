import {expect, suite, test} from '@cmmn/tools/test';
import {ulid} from '../helpers/ulid';

// import {monotonicFactory} from 'ulid';
// const ulid = monotonicFactory();

@suite
export class UlidSpec {

    @test
    monotonic() {
        const a = Array.from(Array(1_000).keys()).map(() => ulid());
        const b = [...a].sort((y, z) => y.localeCompare(z));
        for (let i = 0; i < a.length; i++) {
            // console.log(`i[${i}]`, a[i], b[i]); // на каком элементе не сошлось?
            expect(a[i]).toBe(b[i]);
        }
    }
}
