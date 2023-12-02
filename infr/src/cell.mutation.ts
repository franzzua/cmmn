import {AsyncCell, BaseCell, Cell, IAsyncCellOptions, ICellOptions} from "@cmmn/cell";
import {CellQuery, QueryResult} from "./cell.query";

export class CellMutation<TVars, TResult, TError = Error> extends CellQuery<TResult, TError>{
    private varsCell = new Cell<TVars | typeof Null>(Null);
    constructor(private request: (vars: TVars) => Promise<TResult>,
                options: IAsyncCellOptions<QueryResult<TResult, TError>> = {}) {
        super(() => {
            const vars = this.varsCell.get();
            if (vars == Null) return new Promise<TResult>(() => {});
            return request(vars);
        }, options);
    }

    fetch(vars: TVars){
        this.varsCell.set(vars);
    }
    cancel(vars: TVars){
        this.varsCell.set(Null);
    }

}

const Null = Symbol('Null');