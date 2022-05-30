import {Cell, ICellOptions} from "./cell";
import {BaseCell} from "./baseCell";
import {throttle} from "@cmmn/core";

export type IAsyncCellOptions<T, TKey = T> = ICellOptions<T, TKey> & {
    throttle?: { time: number, leading: boolean, trailing: boolean }
};

export class AsyncCell<T, TKey = T> extends Cell<T, TKey> {
    private genCell: BaseCell<AsyncGenerator<T> | Promise<T>>;

    constructor(generator: () => AsyncGenerator<T> | Promise<T>,
                protected options: IAsyncCellOptions<T, TKey> = {}) {
        super(null, options);
        this.genCell = new BaseCell(generator);
    }

    private onChange = async gen => {
        if (!gen.value)
            return this.set(null)
        if (Symbol.asyncIterator in gen.value)
            for await(let value of gen.value as AsyncGenerator<T>) {
                this.set(value);
            }
        else {
            this.set(await (gen.value as Promise<T>));
        }
    };

    active() {
        const onChange = this.options.throttle
            ? throttle(this.onChange, this.options.throttle.time, this.options.throttle)
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
