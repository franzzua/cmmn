import {Api} from "./src/api";
import {Request} from "./src/request";

export {Api, Request};
export function useApi(fetch, baseUrl: string){
    Request.fetch = fetch;
    return {provide: Api, useValue: new Api().with({apiUrl: baseUrl})};
}