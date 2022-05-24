import {Cell, ICellOptions} from "./cell";
import {BaseCell, CellState} from "./baseCell";

export class AsyncCell<T, TKey> extends Cell<T, TKey> {
    private genCell: BaseCell<AsyncGenerator<T> | Promise<T>>;

    constructor(generator: () => AsyncGenerator<T> | Promise<T>, options: ICellOptions<T, TKey> = {}) {
        super(null, options);
        this.genCell = new BaseCell(generator);
    }

    private onChange = async gen => {
        if (Symbol.asyncIterator in gen.value)
            for await(let value of gen.value as AsyncGenerator<T>) {
                this.set(value);
            }
        else {
            this.set(null);
            this.set(await (gen.value as Promise<T>));
        }
    };

    active() {
        this.genCell.on('change', this.onChange)
        this.onChange({value: this.genCell.get()})
        super.active()
    }

    disactive() {
        this.genCell.dispose();
        super.disactive()
    }

    addReaction(cell: BaseCell) {
        // @ts-ignore
        if (!this.isActive)
            this.active();
        super.addReaction(cell);
    }
}
