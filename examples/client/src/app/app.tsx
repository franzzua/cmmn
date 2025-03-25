import {Store} from './store';
import {Component, component, useCell, useCelled, useInjected} from "@cmmn/react";
import {Button} from "@cmmn/examples-ui-lib";
import {type Api, ApiToken} from "./api";
import {inject} from "@cmmn/core";
//
@component()
export class App extends Component {

	@inject(Store) store!: Store;
	@inject(ApiToken) api!: Api;

	render() {
		return <div style={{display: 'flex', gap: '1em', flexDirection: 'column'}}>
			Hi there: <span>{this.store.value}</span>
			Query: <span>{JSON.stringify(this.api.getData.get())}</span>
		</div>;
	}
}


export const Buttons = props => useCelled<{}>(props, (store, api: Api) => (
	<div style={{display: 'flex', gap: '1em', flexDirection: 'column'}}>
		<Button disabled={api.getData.get().isFetching} onClick={() => store.value++}>Inc</Button>
		<Button icon={"***"} onClick={api.getData.fetch}>Refetch</Button>
	</div>
), Store, ApiToken);