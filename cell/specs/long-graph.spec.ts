import {expect, suite, test} from "@cmmn/tools/test";
import {cell} from "../src/decorators.js";
import {Actualizator} from "../src/actualizator.js";
import {Cell} from "../src/cell.js";

class Evalutator {
    constructor(a: number, b: number, c: number) {
        this.a = a;
        this.b = b;
        this.c = c;
    }

    @cell({filter: x => x != null})
    public a: number;
    @cell({filter: x => x != null})
    public b: number;
    @cell({filter: x => x != null})
    public c: number;

    @cell
    public get X(): number[] {
        if (this.a == 0) {
            if (this.b == 0)
                throw new Error("unresolvable");
            return [-this.c / this.b];
        }
        const det = this.b ** 2 - 4 * this.a * this.c;
        if (det < 0)
            throw new Error('imaginate roots');
        if (det == 0)
            return [-this.b / 2 / this.a];
        return [
            (-this.b - Math.sqrt(det)) / 2 / this.a,
            (-this.b + Math.sqrt(det)) / 2 / this.a,
        ];
    }
}

@suite
export class LongGraphSpec {

    @test
    testSimple() {
        const e = new Evalutator(1, 0, -1);
        expect(e.X).toEqual([-1, 1]);
    }


    @test
    async testChange() {
        const e = new Evalutator(0, 1, -1);
        expect(e.X).toEqual([1]);
        e.a = 1;
        e.b = 0;
        await Actualizator.wait;
        expect(e.X).toEqual([-1, 1]);
    }

    @test
    async testThrow() {
        const e = new Evalutator(0, 1, -1);
        expect(e.X).toEqual([1]);
        e.a = 1;
        e.b = 0;
        e.c = 1;
        await Actualizator.wait;
        expect(() => e.X).toThrow();
    }

    @test
    async testTwo() {
        const e1 = new Evalutator(1, 0, -1);
        const e2 = new Evalutator(1, 2, -1);
        const x = new Cell(() => [...e1.X, ...e2.X]);
        expect(x.get()).toHaveLength(4);
        e2.c = 1;
        await Actualizator.wait;
        expect(x.get()).toEqual([-1, 1, -1]);
        e2.c = 5;
        await Actualizator.wait;
        expect(() => x.get()).toThrow();
    }
}