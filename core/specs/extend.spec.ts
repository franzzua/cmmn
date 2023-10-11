import {suite, test, expect} from "@cmmn/tools/test";
import {Fn} from "../helpers/Fn.js";

@suite
export class ExtendSpec {

    @test
    clone() {
        const T = Fn.cloneClass(A);
        expect(Object.getPrototypeOf(T)).toEqual(Function.prototype)
        expect(T.J).toEqual(A.J);
        const t = new T();
        expect(t.isA()).toBeTruthy();
        expect(t instanceof A).toBeTruthy();
    }
    @test
    extend() {
        const T = Fn.deepExtend(A, B);
        const t = new T();
        expect(t instanceof B).toBeTruthy();
        expect(t.isB()).toBeTruthy();
        expect(t instanceof A).toBeTruthy();
        expect(t.isA()).toBeTruthy();
    }
    @test
    extendDeep() {
        const T = Fn.deepExtend(A2, B2);
        const t = new T();
        expect(t instanceof B).toBeTruthy();
        expect(t instanceof B1).toBeTruthy();
        expect(t instanceof B2).toBeTruthy();
        expect(t instanceof A).toBeTruthy();
        expect(t instanceof A1).toBeTruthy();
        expect(t instanceof A2).toBeTruthy();
        expect(t.isA()).toBeTruthy();
        expect(t.isB()).toBeTruthy();
        // expect(t.a1).toEqual(3);
        expect(t.a1).toEqual(t.a);
        expect(t.a2).toEqual(t.a);

        expect(t.b).toEqual(1);
        expect(t.b1).toEqual(t.b);
        expect(t.b2).toEqual(t.b);
    }
}

class A {
    static J = 2;
    isA(){return true;}
    a = 3;
}
class A1 extends A{
    static J = 2;
    isA(){return super.isA();}
    a1 = 3;
}
class A2 extends A1{
    static J = 2;
    isA(){return super.isA();}
    a2 = 3;
}
class B {
    isB(){return true;}
    b = 1;
}
class B1 extends B{
    isC(){return true;}
    b1 = 1;
}
class B2 extends B1{
    isC(){return true;}
    b2 = 1;
}

