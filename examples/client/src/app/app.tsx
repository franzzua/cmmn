import {Store} from './store';
import {Component, component, useCelled} from "@cmmn/react";
import {Button} from "@cmmn/examples-ui-lib";
import {type Api, ApiToken} from "./api";
import {inject} from "@cmmn/core";
import {Counters} from "../counter";
//
@component()
export class App extends Component {

	@inject(Store) store!: Store;
	@inject(ApiToken) api!: Api;

	render() {
		return <div style={{display: 'flex', gap: '1em', flexDirection: 'column'}}>
			<Counters id={'1'}/>
			{/*<Counters id={'2'}/>*/}
			{/*<Counters id={'3'}/>*/}
		</div>;
	}
}


export const Buttons = props => useCelled<{}>(props, (store, api: Api) => (
	<div style={{display: 'flex', gap: '1em', flexDirection: 'column'}}>
		<Button disabled={api.getData.get().isFetching} onClick={() => store.value++}>Inc</Button>
		<Button icon={"***"} onClick={api.getData.fetch}>Refetch</Button>
	</div>
), Store, ApiToken);