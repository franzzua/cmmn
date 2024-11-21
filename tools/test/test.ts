import * as t from "node:test";
import * as assert from "node:assert";
import { expect } from "expect";

export function suite<TClass extends new (ctx: t.SuiteContext) => (BaseTest | unknown)>(
    target: TClass,
    context: ClassDecoratorContext<TClass>
){
    t.suite(context.name, (ctx) => {
        const result = new target(ctx) as BaseTest;
        if (result.after) t.after(result.after.bind(result));
        if (result.before) t.before(result.before.bind(result));
        if (result.afterEach) t.afterEach(result.afterEach.bind(result));
        if (result.beforeEach) t.beforeEach(result.beforeEach.bind(result));
    });
}

export function test<TClass, TValue extends (this: TClass) => unknown>(
    method: TValue,
    context: ClassMethodDecoratorContext<TClass, TValue>
){
    context.addInitializer(function (this: TClass) {
        t.test(context.name.toString(), method.bind(this))
    });
}

export { assert, expect };
export { mock, type SuiteContext, type TestContext } from "node:test";

export type BaseTest = {
    after?(ctx: t.SuiteContext): unknown;
    before?(ctx: t.SuiteContext): unknown;
    afterEach?(ctx: t.TestContext): unknown;
    beforeEach?(ctx: t.TestContext): unknown;
}