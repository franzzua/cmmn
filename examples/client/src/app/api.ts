import {FetchQuery} from "./fetchQuery";
import {di} from "@cmmn/core";

export class Api {
	public getData = new FetchQuery('/api');
}
export const ApiToken = Symbol("Api")
di.override(ApiToken, Api);
