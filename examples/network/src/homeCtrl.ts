import {ctrl, get} from "@cmmn/server";
import {cell} from "@cmmn/core";
import {data} from "@cmmn/examples-common";

@ctrl()
export class HomeCtrl {
	@cell()
	cell = data.value;

	@get()
	get() {
		return { value: this.cell++ };
	}
}