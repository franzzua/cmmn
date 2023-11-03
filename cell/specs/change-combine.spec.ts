import {expect, sinon, suite, test} from "@cmmn/tools/test";
import {BaseCell} from '../src/baseCell.js';
import {Actualizator} from "../src/actualizator";

@suite
class ChangeCombineSpec {

    @test
    async combin1() {
        let a = new BaseCell(1);
        let b = new BaseCell(2);
        let getC = sinon.spy(() => a.get() + b.get());

        const c = new BaseCell(getC);
        c.on('change', console.log);
        getC.resetHistory();

        a.set(2);
        b.set(3);

        await Actualizator.wait;
        expect(getC.calledOnce).toBeTruthy();
    }

    @test
    async combine2() {
        let a = new BaseCell(1);
        let b = new BaseCell(2);
        let aa = new BaseCell<number>(() => a.get() + 1);
        let bb = new BaseCell<number>(() => b.get() + 1);
        let getC = sinon.spy(() => {
            return aa.get() + bb.get()
        });

        const c = new BaseCell(getC);
        c.on('change', () => {});
        getC.resetHistory();

        a.set(2);
        b.set(3);

        await Actualizator.wait;
        expect(getC.callCount).toBe(1);
    }
}

// describe('Cell', () => {
//
//         it('запись в неинициализированную ячейку отменяет pull', () => {
//             let a = new Cell<number>(() => 1);
//             let b = new Cell(1);
//
//             a.set(5);
//             b.set(5);
//
//             expect(b.get()).to.equal(5);
//         });
//
//         it('запись в неинициализированную ячейку отменяет pull (2)', () => {
//             let a = new Cell<number>(() => 1);
//             let b = new Cell(1);
//
//             a.set(5);
//             b.set(5);
//
//             a.on(Cell.EVENT_CHANGE, () => {});
//
//             expect(b.get()).to.equal(5);
//         });
//
//         it('запись в активную ячейку и последующее изменение её зависимости', done => {
//             let a = new Cell(1);
//             let b = new Cell(
//                 (_cell, next) => {
//                     if (a.get() == 2) {
//                         expect(next).to.equal(5);
//                     }
//
//                     return a.get();
//                 },
//                 {
//                     onChange(evt) {
//                         if (evt.data.value == 2) {
//                             expect(evt.data).to.eql({
//                                 prevValue: 5,
//                                 value: 2
//                             });
//
//                             done();
//                         } else {
//                             expect(evt.data).to.eql({
//                                 prevValue: 1,
//                                 value: 5
//                             });
//                         }
//                     }
//                 }
//             );
//
//             b.set(5);
//             a.set(2);
//         });
//
//         it("вычисляемая ячейка лишаясь зависимостей получает _state == 'actual'", () => {
//             let a = new Cell(1);
//
//             let t = 0;
//             let b = new Cell<number>(
//                 () => {
//                     if (t++) {
//                         throw 1;
//                     }
//
//                     return a.get() + 1;
//                 },
//                 { onChange: () => {} }
//             );
//
//             a.set(2);
//
//             try {
//                 Cell.release();
//             } catch {}
//
//             expect(t).to.equal(2);
//
//             expect(b._state).to.equal(CellState.ACTUAL);
//
//             expect(b.get.bind(b)).throw();
//         });
//
//         it('запись в родительскую ячейку в pull', () => {
//             let a = new Cell(1);
//             let b = new Cell<number>(() => a.get() + 1);
//             let c = new Cell(() => {
//                 if (b.get() == 3) {
//                     a.set(10);
//                 }
//
//                 return b.get() + 1;
//             });
//
//             a.set(2);
//
//             expect(c.get()).to.equal(12);
//         });
//
//         it('запись в родительскую ячейку в pull (2)', () => {
//             let a = new Cell(1);
//             let b = new Cell<number>(() => a.get() + 1);
//             let c = new Cell(
//                 () => {
//                     if (b.get() == 3) {
//                         a.set(10);
//                     }
//
//                     return b.get() + 1;
//                 },
//                 { onChange: () => {} }
//             );
//
//             a.set(2);
//
//             expect(c.get()).to.equal(12);
//         });
//
//         it('событие error без дублирования', () => {
//             let bOnError = sinon.spy();
//             let c1OnError = sinon.spy();
//             let c2OnError = sinon.spy();
//             let dOnError = sinon.spy();
//
//             let a = new Cell(1);
//
//             let t = 0;
//             let b = new Cell<number>(
//                 () => {
//                     if (t++) {
//                         throw 1;
//                     }
//
//                     return a.get() + 1;
//                 },
//                 { onError: bOnError }
//             );
//
//             let c1 = new Cell<number>(() => b.get() + 1, { onError: c1OnError });
//             let c2 = new Cell<number>(() => b.get() + 1, { onError: c2OnError });
//             new Cell(() => c1.get() + c2.get(), { onError: dOnError });
//
//             a.set(2);
//
//             Cell.release();
//
//             expect(bOnError.calledOnce).to.be.true;
//             expect(c1OnError.calledOnce).to.be.true;
//             expect(c2OnError.calledOnce).to.be.true;
//             expect(dOnError.calledOnce).to.be.true;
//         });
//     });
//
//     describe('other', () => {
//         it('.afterRelease()', () => {
//             let a = new Cell(1);
//             let b = new Cell(() => a.get() + 1, { onChange() {} });
//
//             a.set(2);
//
//             let afterReleaseCallback = sinon.spy();
//
//             Cell.afterRelease(afterReleaseCallback);
//
//             Cell.release();
//
//             expect(afterReleaseCallback.calledOnce).to.be.true;
//             expect(b.get()).to.equal(3);
//         });
//
//         it('[options.validate]', () => {
//             let a = new Cell(1, {
//                 validate(value) {
//                     if (typeof value != 'number') {
//                         throw 1;
//                     }
//                 }
//             });
//             let error = null;
//
//             try {
//                 a.set('1' as any);
//             } catch (err) {
//                 error = err;
//             }
//
//             expect(error).not.to.be.null;
//             expect(a.get()).to.equal(1);
//         });
//
//         it('[options.value]', () => {
//             let a = new Cell(1, { value: 2 });
//
//             expect(a.get()).to.equal(2);
//         });
//
//         it('[options.reap]', () => {
//             let reap = sinon.spy();
//             let a = new Cell<number>(() => Math.random(), { reap });
//             let b = new Cell(() => a.get() + 1);
//             let listener = () => {};
//
//             b.on(Cell.EVENT_CHANGE, listener);
//             b.off(Cell.EVENT_CHANGE, listener);
//
//             expect(reap.calledOnce).to.be.true;
//         });
//
//         it('#reap()', () => {
//             let a = new Cell(1);
//             let b = new Cell(() => a.get(), { onChange() {} });
//
//             b.reap();
//
//             expect(b._active).to.be.false;
//         });
//         it('EventEmitter в качестве значения', () => {
//             let emitter = new EventEmitter();
//             let onChange = sinon.spy();
//
//             new Cell(emitter, { onChange });
//
//             emitter.emit('change');
//
//             Cell.release();
//
//             expect(onChange.called).to.be.true;
//         });
//
//         it('EventEmitter в качестве значения (2)', () => {
//             let emitter = new EventEmitter();
//             let onChange = sinon.spy();
//             let a = new Cell(emitter);
//
//             new Cell(() => a.get(), { onChange });
//
//             emitter.emit('change');
//
//             Cell.release();
//
//             expect(onChange.called).to.be.true;
//         });
//
//         it('подписка через EventEmitter', () => {
//             let emitter = new EventEmitter();
//             let onChange = sinon.spy();
//
//             define(emitter, {
//                 foo: 1
//             });
//
//             emitter.on('change:foo', onChange);
//
//             (emitter as any).foo = 2;
//
//             expect(onChange.called).to.be.true;
//         });
//     });
//     });
// });