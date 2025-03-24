import {HTMLProps, MouseEvent, ReactNode} from "react";
import {cn, component, Component} from "@cmmn/react";
import {bind, cell} from "@cmmn/core";
import {css} from '@acab/ecsstatic';

@component()
export class Button extends Component<{
	icon?: ReactNode
} & HTMLProps<HTMLButtonElement>> {

	private styles = {
		button: css`
            display: flex;
            gap: 1em;
            width: auto;
            background: gray;
            border: none;
            border-radius: 3px;
            padding: 4px 8px;
            cursor: pointer;
            align-items: center;
            justify-content: space-around;

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

	@bind()
	async onClickInternal(e: MouseEvent<HTMLButtonElement>) {
		this.isLoading = true;
		try {
			await this.props.onClick?.(e)
		} finally {
			this.isLoading = false;
		}
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
		               className={this.className}
		               disabled={this.props.disabled || this.isLoading}
		               onClick={this.props.onClick && this.onClickInternal}>
			{this.icon}
			{this.props.children}
		</button>
	}

}
