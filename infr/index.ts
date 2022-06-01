import {Api} from "./src/api";
import {Request, RequestFailedError, RequestAbortedError} from "./src/request";

export {Api, Request, RequestFailedError, RequestAbortedError};
export function useApi(fetch, baseUrl: string){
    Request.fetch = fetch;
    return {provide: Api, useValue: new Api().with({apiUrl: baseUrl})};
}