import {cell, scoped} from '@cmmn/core';
import {data} from "@cmmn/examples-common";

@scoped()
export class Store {

	@cell()
	public accessor value = data.value;

}


