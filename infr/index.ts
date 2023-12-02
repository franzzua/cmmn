import {Api} from "./src/api";
import { CellQuery } from "./src/cell.query";
import {Request, RequestFailedError, RequestAbortedError} from "./src/request";

export {Api, Request, RequestFailedError, RequestAbortedError, CellQuery};
export function useApi(fetch, baseUrl: string){
    Request.fetch = fetch;
    return {provide: Api, useValue: new Api().with({apiUrl: baseUrl})};
}

