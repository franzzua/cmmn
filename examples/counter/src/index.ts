import {component, Component, html} from "@cmmn/uhtml";
import {cell} from "@cmmn/core";

@component()
export class CmmnCounter extends Component{
	@cell()
	accessor counter = 0;
	inc = () => this.counter++;
	dec = () => this.counter--;

	render() {
		return html`
            <button @click=${this.inc}>+</button>
            <span>${this.counter}</span>
			<button @click=${this.dec}>-</button>
		`;
	}

}