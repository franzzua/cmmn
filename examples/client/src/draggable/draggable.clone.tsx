import {component, Component} from "@cmmn/react";
import {resolve} from "@cmmn/core";
import {DraggableContext} from "./draggable.context";
import {memo, useCallback} from "react";

@component()
export class DraggableClone extends Component {
	private context = resolve(DraggableContext);

	protected render() {
		if (!this.context.draggable) return null;
		return <dialog open={true} style={{
			transform: this.context.transform,
			left: 0,
			top: 0,
			margin: 0,
			background: "none",
			border: "unset",
			padding: "unset",
			pointerEvents: 'none',
			userSelect: 'none',
			boxShadow: '#0003 0 0 8px 0'
		}}>
			<HtmlNode children={this.context.draggable}/>
		</dialog>;
	}
}

export const HtmlNode = memo(function HtmlNode(props: {children: Node | undefined}){
	const setRef = useCallback((div: HTMLDivElement) => {
		div?.replaceChildren(props.children);
	}, [props.children]);
	return <div ref={setRef}></div>
})