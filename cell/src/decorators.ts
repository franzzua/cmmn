import {Cell, ICellOptions} from "./cell";
import {BaseCell} from "./baseCell";

const KEY_VALUE_CELLS = Symbol('ObservableCells')
export type CellDecorator =
    ((options: ICellOptions<any>) => (PropertyDecorator & MethodDecorator))
    & PropertyDecorator
    & MethodDecorator

const getCell = (self: { [KEY_VALUE_CELLS]?: { [key: string]: BaseCell } }, prop, descr: PropertyDescriptor, options) => {
    self[KEY_VALUE_CELLS] ??= {};
    let pull = null; // if simple observable
    if (descr) {
        if (descr.get) pull = descr.get.bind(self); // if computed observable
        if (typeof descr.value === "function") // if function-computed observable
            pull = descr.value.bind(self);
    }
    return self[KEY_VALUE_CELLS][prop] ??= options ? new Cell(pull, options) : new BaseCell(pull);
}

export const cell: CellDecorator = ((options: ICellOptions<any>, prop?, descr?) => {
    if (prop !== undefined) {
        return cell(null)(options, prop, descr);
    }
    return function cellDecorator(target, prop, descr) {
        if (descr && typeof descr.value === "function"){
            return {
                value(){
                    const cell = getCell(this, prop, descr, options);
                    return cell.get();
                }
            }
        }
        const descriptor = {
            get() {
                const cell = getCell(this, prop, descr, options);
                return cell.get();
            },
            set(value) {
                const cell = getCell(this, prop, descr, options);
                cell.set(value);
            },
            configurable: true
        };
        return descriptor;
    }
}) as CellDecorator;