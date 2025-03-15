import {cell, Cell, scoped} from '@cmmn/core';

@scoped()
export class Store {

	constructor() {
		console.log('store')
	}
	@cell()
	public accessor value = 1;

}
