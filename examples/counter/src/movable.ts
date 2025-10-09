import {component, Component, documentEvents, html} from "@cmmn/uhtml";
import {bind, Cell, cell} from "@cmmn/core";
import {css} from "@acab/ecsstatic";

@component({name: 'movable-div'})
export class MovableDiv extends Component {

	@cell()
	get div(): HTMLDivElement | undefined {
		return (this.events.render?.target as HTMLElement).firstElementChild as HTMLDivElement;
	}

	@cell()
	get divEvents() {
		return Cell.events(this.div);
	}

	@cell()
	private accessor position = {x: 0, y: 0};

	@cell()
	get isDragging() {
		if (!this.divEvents) return false;
		if (!this.divEvents.pointerdown) return false;
		if (!this.divEvents.pointerup) return true;
		return this.divEvents.pointerdown.timeStamp > this.divEvents.pointerup.timeStamp
			&& this.divEvents.pointermove;
	}

	@cell()
	get transform() {
		if (!this.isDragging) return `translate(${this.position.x}px,${this.position.y}px)`;
		const {x, y} = sum(
			this.position,
			diff(this.divEvents.pointermove, this.divEvents.pointerdown)
		);
		return `translate(${x}px, ${y}px)`;
	}

	@bind()
	onDown(e: PointerEvent) {
		this.div.setPointerCapture(e.pointerId);
	}
	@bind()
	onUp(e: PointerEvent) {
		this.div.releasePointerCapture(e.pointerId);
		this.position = sum(this.position, diff(e, this.divEvents.pointerdown));
	}

	get hoveredElements(){
		if (!documentEvents.pointermove) return [];
		return document.elementsFromPoint(documentEvents.pointermove.clientX, documentEvents.pointermove.clientY);
	}

	get styles(){
		return {
			movable: css`
				position: absolute;
				left: 50%;
				top: 50%;
				opacity: .3;
				background: red;
				width: 5em;
				height: 5em;
				will-change: transform;
			`,
			move: css`
				cursor: move;
			`
		}
	}

	render() {
		return html`
            <div class=${[this.styles.movable, this.isDragging ? this.styles.move : null]}
                 onpointerdown=${this.onDown}
                 onpointerup=${this.onUp} 
				 style=${{ transform: this.transform }}/>
            ${this.hoveredElements.map(x => html`<li>${x.tagName}</li>`)}
		`;
	}
}


function diff(x: PointerEvent, y: PointerEvent) {
	return {x: x.pageX - y.pageX, y: x.pageY - y.pageY};
}

function sum<T extends Pick<PointerEvent, 'x' | 'y'>>(x: T, y: T) {
	return {x: x.x + y.x, y: x.y + y.y};
}