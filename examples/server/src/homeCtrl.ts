import {ctrl, get} from "@cmmn/server";
import {cell} from "@cmmn/core";

@ctrl()
export class HomeCtrl {
	@cell()
	cell = 3;

	@get()
	get() {
		return { value: this.cell++ };
	}
}