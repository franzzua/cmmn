import {describe, test} from "node:test";
import {expect} from "@cmmn/tools/test";
import {BaseCell, Cell} from "../../cell";

describe('cell-select', () => {
    test('object', () => {
        const cell = new Cell<{
            a: { b: number }
        }>({
            a: { b: 1}
        });
        expect(cell.$.a.b.get()).toEqual(cell.get().a.b);
        expect(cell.$.a[BaseCell.Symbol].get()).toEqual(cell.get().a);
        cell.$.a.b.set(2);
        expect(cell.$.a.b.get()).toEqual(cell.get().a.b);
        expect(cell.get().a.b).toEqual(2);
    });

    test('array', () => {
        const cell = new Cell<Array<{
            a: number
        }>>([{
            a: 1
        }]);
        expect(cell.$.length).toEqual(cell.get().length);
        expect(cell.$[0].a.get()).toEqual(cell.get()[0].a);
        expect(cell.$[1].a?.get()).toEqual(cell.get()[1]?.a);
        cell.$.push({a: 2});
        expect(cell.$[1].a.get()).toEqual(cell.get()[1]?.a);

    });
});
