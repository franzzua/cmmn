import {component, Component, documentEvents, html} from "@cmmn/uhtml";


@component({name: 'app-root'})
export class AppRoot extends Component {
	// private pwa = resolve(PwaInstallApi)

	render() {
		return html`Loaded`;
		// return html`
        //     <div>isInitialized: ${this.pwa.isInitialized}</div>
        //     <div>isUserChoosing: ${this.pwa.isUserChoosing}</div>
		// 	<div>userChoice: ${this.pwa.userChoice?.outcome}</div>
        //     <button @click=${this.pwa.prompt}>Install</button>
		// `;
	}
}
console.log(AppRoot);