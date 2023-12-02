import {expect, suite, test} from '@cmmn/tools/test';
import {Actualizator} from '../src/actualizator.js';
import {Cell} from '../src/cell.js';

const noop = () => {
};

@suite
class isActiveSpec {
    @test
    byGetInactive1() {
        const a = new Cell(7);
        a.get();
        expect(a.isActive).toEqual(false);

        const b = new Cell(() => 7);
        b.get();
        expect(b.isActive).toEqual(false);
    }

    @test
    byGetInactive2() {
        const a = new Cell(7);
        const b = new Cell(() => a.get());
        b.get();
        expect(a.isActive).toEqual(false);
        expect(b.isActive).toEqual(false);
    }

    @test
    byGetInactive3() {
        const a = new Cell(() => 7);
        const b = new Cell(() => a.get());
        b.get();
        expect(a.isActive).toEqual(false);
        expect(b.isActive).toEqual(false);
    }


    @test
    onChangeSubscribe1() {
        const a = new Cell(() => 7);
        expect(a.isActive).toEqual(false);
        a.on('change', noop);
        expect(a.isActive).toEqual(true);
        a.off('change', noop);
        expect(a.isActive).toEqual(false);
    }

    @test
    onChangeSubscribe2() {
        const a = new Cell(() => 7);
        const b = new Cell(() => a.get());
        expect(a.isActive).toEqual(false);
        expect(b.isActive).toEqual(false);
        b.on('change', noop);
        expect(a.isActive).toEqual(true);
        expect(b.isActive).toEqual(true);
        b.off('change', noop);
        expect(a.isActive).toEqual(false);
        expect(b.isActive).toEqual(false);
    }

    @test
    onChangeSubscribe3() {
        const a = new Cell(7);
        const b = new Cell(() => a.get());
        expect(a.isActive).toEqual(false);
        expect(b.isActive).toEqual(false);
        b.on('change', noop);
        expect(a.isActive).toEqual(true);
        expect(b.isActive).toEqual(true);
        b.off('change', noop);
        expect(a.isActive).toEqual(false);
        expect(b.isActive).toEqual(false);
    }

    @test
    onChangeDispose1() {
        const a = new Cell(() => 7);
        expect(a.isActive).toEqual(false);
        a.on('change', noop);
        expect(a.isActive).toEqual(true);
        a.dispose();
        expect(a.isActive).toEqual(false);
    }

    @test
    onChangeDispose2() {
        const a = new Cell(() => 7);
        const b = new Cell(() => a.get());
        expect(a.isActive).toEqual(false);
        expect(b.isActive).toEqual(false);
        b.on('change', noop);
        expect(a.isActive).toEqual(true);
        expect(b.isActive).toEqual(true);
        b.dispose();
        expect(a.isActive).toEqual(false);
        expect(b.isActive).toEqual(false);
    }

    @test
    onChangeDispose3() {
        const a = new Cell(7);
        const b = new Cell(() => a.get());
        expect(a.isActive).toEqual(false);
        expect(b.isActive).toEqual(false);
        b.on('change', noop);
        expect(a.isActive).toEqual(true);
        expect(b.isActive).toEqual(true);
        b.dispose();
        expect(a.isActive).toEqual(false);
        expect(b.isActive).toEqual(false);
    }


    @test
    onErrorSubscribe1() {
        const a = new Cell(() => 7);
        expect(a.isActive).toEqual(false);
        a.on('error', noop);
        expect(a.isActive).toEqual(false);
    }

    @test
    onErrorSubscribe2() {
        const a = new Cell(() => 7);
        const b = new Cell(() => a.get());
        expect(a.isActive).toEqual(false);
        expect(b.isActive).toEqual(false);
        b.on('error', noop);
        expect(a.isActive).toEqual(false);
        expect(b.isActive).toEqual(false);
    }


    @test
    async removeReaction() {
        const a = new Cell(true);
        const b = new Cell(1);
        const c = new Cell(() => a.get() ? b.get() : null);
        expect(a.isActive).toEqual(false);
        expect(b.isActive).toEqual(false);
        expect(c.isActive).toEqual(false);
        c.on('change', noop);
        expect(a.isActive).toEqual(true);
        expect(b.isActive).toEqual(true);
        expect(c.isActive).toEqual(true);
        a.set(false);
        await Actualizator.wait;
        expect(a.isActive).toEqual(true);
        expect(b.isActive).toEqual(false);
        expect(c.isActive).toEqual(true);
        c.off('change', noop);
        expect(a.isActive).toEqual(false);
        expect(b.isActive).toEqual(false);
        expect(c.isActive).toEqual(false);
    }

}
