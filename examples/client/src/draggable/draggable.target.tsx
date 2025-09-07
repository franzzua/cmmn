import {component, Component} from "@cmmn/react";
import {bind, resolve} from "@cmmn/core";
import {DraggableContext} from "./draggable.context";
import {ReactNode} from "react";

@component()
export class DraggableTarget extends Component<{ children: ReactNode, data: any }> {
	private context = resolve(DraggableContext);

	@bind()
	setTarget(root: HTMLDivElement | null): () => void {
		this.context.targets.set(root, this.props.data);
		return () => this.context.targets.delete(root);
	}

	protected render() {
		return <div ref={this.setTarget}
		            className={this.context.hovered.includes(this.props.data) ? 'hover' : undefined}>
			{this.props.children}
		</div>;
	}
}