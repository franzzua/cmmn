import {AsyncCell, IAsyncCellOptions} from "@cmmn/cell";

export class CellQuery<TResult, TError = Error> extends AsyncCell<QueryResult<TResult, TError>>{
    constructor(request: () => Promise<TResult>, options: IAsyncCellOptions<QueryResult<TResult, TError>> = {}) {
        super(() => (async function *generator(promise){
            yield {isFetching: true} as QueryResult<TResult, TError>;
            try {
                yield {result: await promise} as QueryResult<TResult, TError>;
            } catch (e){
                yield {error: e} as QueryResult<TResult, TError>;
            }
        })(request()), options);
        this.set({isFetching: false} as QueryResult<TResult, TError>)
    }
}

export type QueryResult<TResult, TError = Error> = {
    result: TResult;
    error: never;
    isFetching: false;
} | {
    result: never;
    error: TError;
    isFetching: false;
} | {
    result: never;
    error: never;
    isFetching: boolean;
}