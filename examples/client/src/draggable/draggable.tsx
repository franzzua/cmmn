import {component, Component} from "@cmmn/react";
import {ReactNode} from "react";
import {bind, resolve} from "@cmmn/core";
import {DraggableTarget} from "./draggable.target.tsx";
import {DraggableContext} from "./draggable.context.tsx";
import {DraggableClone} from "./draggable.clone.tsx";

@component()
export class Draggable extends Component<{ children: ReactNode }> {
	private context = resolve(DraggableContext);
	@bind()
	setContainer(root: HTMLDivElement | null){
		this.context.setDraggable(root);
	}


	protected render() {
		return <div ref={this.setContainer}>
			{this.props.children}
		</div>;
	}

	static Target = DraggableTarget;
	static Clone = DraggableClone;
}
