import {FetchQuery} from "./fetchQuery";
import {di} from "@cmmn/core";
import api from '@cmmn/examples-server?resolve';

console.log(api);
export class Api {
	public getData = new FetchQuery(api);
}
export const ApiToken = Symbol("Api")
di.override(ApiToken, Api);
