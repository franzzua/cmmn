import {Store} from './store';
import {Component, component, useCell} from "@cmmn/react";
import {Button} from "@cmmn/examples-ui-lib";
import {type Api, ApiToken} from "./api";
import {inject} from "@cmmn/core";

@component()
export class App extends Component {

	@inject(Store) store!: Store;
	@inject(ApiToken) api!: Api;

	render() {
		return <div style={{display: 'flex', gap: '1em', flexDirection: 'column'}}>
			Hi there: <span>{this.store.value}</span>
			Query: <span>{JSON.stringify(this.api.getData.get())}</span>
			<Buttons/>
		</div>;
	}
}

@component()
export class Buttons extends Component {

	@inject(Store) store!: Store;
	@inject(ApiToken) api!: Api;

	fc(){
		return useCell(() => (
			<div style={{display: 'flex', gap: '1em', flexDirection: 'column'}}>
				<Button disabled={this.api.getData.get().isFetching} onClick={() => this.store.value++}>Inc</Button>
				<Button icon={"***"} onClick={this.api.getData.fetch}>Refetch</Button>
			</div>
		));
	}
}