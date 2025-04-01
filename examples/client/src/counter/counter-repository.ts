import {P2PRepository} from "@cmmn/sync";
import {singleton} from "@cmmn/core";

@singleton()
export class CounterRepository extends P2PRepository{
	constructor() {
		super('counter')
		console.log('repository')
	}
}