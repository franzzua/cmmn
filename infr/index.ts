import {Api} from "./src/api.js";
import {Request, RequestFailedError, RequestAbortedError} from "./src/request.js";

export {Api, Request, RequestFailedError, RequestAbortedError};
export function useApi(fetch, baseUrl: string){
    Request.fetch = fetch;
    return {provide: Api, useValue: new Api().with({apiUrl: baseUrl})};
}