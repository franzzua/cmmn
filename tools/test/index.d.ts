export {suite, test, timeout,} from "@testdeck/jest";
export {expect} from "earl";
import * as sinonModule from "sinon";

export type AssertionExt = Assertion & {
    toEqual: Assertion["eql"]
}
export const sinon = sinonModule;

declare module 'earl' {
    interface Validators<T> {
        // Note that `this: Validators<number>` ensures that
        // the validator is only callable for numbers.
        toBeInstanceOf<V>(this: Validators<T>, type: V): T extends V ? true : false;
        toBe: Validators<T>["toEqual"];
        toHaveProperty<TProp, TValue>(this: Validators<T>, prop: TProp, value: TValue): T extends Record<TProp, TValue> ? true: false;
    }
}