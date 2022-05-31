import {expect, suite, test} from '@cmmn/tools/test';
import {Actualizator} from '../src/actualizator';
import {Cell} from '../src/cell';

const noop = () => {
};

@suite
class isActiveSpec {
    @test
    byGetInactive1() {
        const a = new Cell(7);
        a.get();
        expect(a.isActive).toBe(false);

        const b = new Cell(() => 7);
        b.get();
        expect(b.isActive).toBe(false);
    }

    @test
    byGetInactive2() {
        const a = new Cell(7);
        const b = new Cell(() => a.get());
        b.get();
        expect(a.isActive).toBe(false);
        expect(b.isActive).toBe(false);
    }

    @test
    byGetInactive3() {
        const a = new Cell(() => 7);
        const b = new Cell(() => a.get());
        b.get();
        expect(a.isActive).toBe(false);
        expect(b.isActive).toBe(false);
    }


    @test
    onChangeSubscribe1() {
        const a = new Cell(() => 7);
        expect(a.isActive).toBe(false);
        a.on('change', noop);
        expect(a.isActive).toBe(true);
        a.off('change', noop);
        expect(a.isActive).toBe(false);
    }

    @test
    onChangeSubscribe2() {
        const a = new Cell(() => 7);
        const b = new Cell(() => a.get());
        expect(a.isActive).toBe(false);
        expect(b.isActive).toBe(false);
        b.on('change', noop);
        expect(a.isActive).toBe(true);
        expect(b.isActive).toBe(true);
        b.off('change', noop);
        expect(a.isActive).toBe(false);
        expect(b.isActive).toBe(false);
    }

    @test
    onChangeSubscribe3() {
        const a = new Cell(7);
        const b = new Cell(() => a.get());
        expect(a.isActive).toBe(false);
        expect(b.isActive).toBe(false);
        b.on('change', noop);
        expect(a.isActive).toBe(true);
        expect(b.isActive).toBe(true);
        b.off('change', noop);
        expect(a.isActive).toBe(false);
        expect(b.isActive).toBe(false);
    }

    @test
    onChangeDispose1() {
        const a = new Cell(() => 7);
        expect(a.isActive).toBe(false);
        a.on('change', noop);
        expect(a.isActive).toBe(true);
        a.dispose();
        expect(a.isActive).toBe(false);
    }

    @test
    onChangeDispose2() {
        const a = new Cell(() => 7);
        const b = new Cell(() => a.get());
        expect(a.isActive).toBe(false);
        expect(b.isActive).toBe(false);
        b.on('change', noop);
        expect(a.isActive).toBe(true);
        expect(b.isActive).toBe(true);
        b.dispose();
        expect(a.isActive).toBe(false);
        expect(b.isActive).toBe(false);
    }

    @test
    onChangeDispose3() {
        const a = new Cell(7);
        const b = new Cell(() => a.get());
        expect(a.isActive).toBe(false);
        expect(b.isActive).toBe(false);
        b.on('change', noop);
        expect(a.isActive).toBe(true);
        expect(b.isActive).toBe(true);
        b.dispose();
        expect(a.isActive).toBe(false);
        expect(b.isActive).toBe(false);
    }


    @test
    onErrorSubscribe1() {
        const a = new Cell(() => 7);
        expect(a.isActive).toBe(false);
        a.on('error', noop);
        expect(a.isActive).toBe(false);
    }

    @test
    onErrorSubscribe2() {
        const a = new Cell(() => 7);
        const b = new Cell(() => a.get());
        expect(a.isActive).toBe(false);
        expect(b.isActive).toBe(false);
        b.on('error', noop);
        expect(a.isActive).toBe(false);
        expect(b.isActive).toBe(false);
    }


    @test
    async removeReaction() {
        const a = new Cell(true);
        const b = new Cell(1);
        const c = new Cell(() => a.get() ? b.get() : null);
        expect(a.isActive).toBe(false);
        expect(b.isActive).toBe(false);
        expect(c.isActive).toBe(false);
        c.on('change', noop);
        expect(a.isActive).toBe(true);
        expect(b.isActive).toBe(true);
        expect(c.isActive).toBe(true);
        a.set(false);
        await Actualizator.wait;
        expect(a.isActive).toBe(true);
        expect(b.isActive).toBe(false);
        expect(c.isActive).toBe(true);
        c.off('change', noop);
        expect(a.isActive).toBe(false);
        expect(b.isActive).toBe(false);
        expect(c.isActive).toBe(false);
    }

}
