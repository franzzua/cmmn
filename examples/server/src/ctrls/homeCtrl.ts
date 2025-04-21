import {ctrl, get} from "@cmmn/server";
import {cell} from "@cmmn/core";
import {data} from "@cmmn/examples-common";

@ctrl()
export class HomeCtrl {
	@cell()
	accessor cell = data.value;

	@get()
	getValue() {
		return { value: this.cell++ };
	}
}