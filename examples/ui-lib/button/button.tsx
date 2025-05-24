import {MouseEvent, ReactNode, JSX} from "react";
import {cn, component, Component} from "@cmmn/react";
import {bind, Cell, cell} from "@cmmn/core";
import {css} from '@acab/ecsstatic';

@component()
export class Button extends Component<{
	icon?: ReactNode
} & JSX.IntrinsicElements["button"]> {
	private styles = {
		button: css`
			--x: 0;
			--y: 0;
            display: flex;
            gap: 1em;
            width: auto;
            background: lightblue;
            border: none;
            border-radius: 16px;
            padding: 4px 8px;
            cursor: pointer;
            align-items: center;
            justify-content: space-around;
			box-shadow: inset gray calc(var(--x) * 1px) calc(var(--y) * 1px) 30px 15px;
            &:hover {
                filter: brightness(1.2);
            }

            &:active {
                filter: brightness(0.8);
            }
		`,
		icon: css`
            padding: 1em;
		`,
		loading: css`
			background: rebeccapurple;
		`
	}
	@cell()
	accessor isLoading = false;
	@cell()
	accessor element: HTMLButtonElement | undefined;

	@bind()
	async onClickInternal(e: MouseEvent<HTMLButtonElement>) {
		this.isLoading = true;
		try {
			await this.props.onClick?.(e)
		} finally {
			this.isLoading = false;
		}
	}
	@bind()
	async onMouseEnter(){
		if (!this.element) return;
		const abort = new AbortController();
		this.element.addEventListener('pointermove', e => {
			const rect = this.element.getBoundingClientRect();
			const x = e.x - rect.x - rect.width / 2;
			const y = e.y - rect.y - rect.height / 2;
			this.element.style.setProperty('--x', x.toString());
			this.element.style.setProperty('--y', y.toString());
		}, { signal: abort.signal });
		this.element.addEventListener('pointerleave', e => {
			abort.abort();
			// this.element.style.setProperty('--x', '0');
			// this.element.style.setProperty('--y', '0');
		}, { signal: abort.signal });

	}

	@cell()
	get className() {
		return cn(
			this.styles.button,
			this.props.className,
			this.isLoading && this.styles.loading,
		);
	}


	@cell()
	get icon() {
		if (!this.props.icon) return null;
		return <div className={this.styles.icon}>
			{this.props.icon}
		</div>
	}

	render() {
		return <button {...this.props}
		               ref={element => {this.element = element}}
		               className={this.className}
		               onPointerEnter={this.onMouseEnter}
		               disabled={this.props.disabled || this.isLoading}
		               onClick={this.props.onClick && this.onClickInternal}>
			{this.icon}
			{this.props.children}
		</button>
	}

}
