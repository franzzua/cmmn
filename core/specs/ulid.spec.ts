import '../helpers/Array';
import {expect, suite, test, timeout} from '@cmmn/tools/test';
import { Fn } from '../helpers/Fn.js';
import {ulid} from '../helpers/ulid.js';

// import {monotonicFactory} from 'ulid';
// const ulid = monotonicFactory();

@suite
export class UlidSpec {

    @test()
    @timeout(20000)
    async monotonic() {
        const a = Array(1000);
        for (let i = 0; i < a.length; i++){
            a[i] = Fn.ulid();
            await Fn.asyncDelay(5);
        }
        for (let i = 1; i < a.length; i++) {
            // console.log(`i[${i}]`, a[i], b[i]); // на каком элементе не сошлось?
            expect(a[i] > a[i-1]).toBeTruthy();
        }
    }
}
