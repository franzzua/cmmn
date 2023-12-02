import {Cell, ICellOptions} from "./cell";
import {BaseCell} from "./baseCell";
import {throttle} from "@cmmn/core";

export type IAsyncCellOptions<T, TKey = T> = ICellOptions<T, TKey> & {
    throttle?: { time: number, leading: boolean, trailing: boolean }
};

export class AsyncCell<T, TKey = T> extends Cell<T, TKey> {
    protected genCell: BaseCell<AsyncGenerator<T> | Promise<T>>;

    constructor(generator: () => AsyncGenerator<T> | Promise<T>,
                protected options: IAsyncCellOptions<T, TKey> = {}) {
        super(null, options);
        this.genCell = new BaseCell(generator);
    }

    private onChange = async (gen: {value: AsyncGenerator<T> | Promise<T>}) => {
        if (!gen.value)
            return this.set(null)
        if (Symbol.asyncIterator in gen.value)
            for await(let value of gen.value as AsyncGenerator<T>) {
                // prevent race
                if (this.genCell.get() !== gen.value) {
                    // console.log('Race! ignore:', value)
                    return;
                }
                this.set(value);
            }
        else {
            const value =await (gen.value as Promise<T>);
            if (this.genCell.get() !== gen.value) {
                // prevent race
                // console.log('Race! ignore:', value)
                return;
            }
            this.set(value);
        }
    };

    active() {
        const onChange = this.options.throttle
            ? throttle(
                this.onChange,
                this.options.throttle.time, // TODO throttle некорректно работает с wait равным undefined
                this.options.throttle)
            : this.onChange;
        this.genCell.on('change', onChange)
        this.onChange({value: this.genCell.get()})
        super.active()
    }

    disactive() {
        this.genCell.dispose();
        super.disactive()
    }

}
