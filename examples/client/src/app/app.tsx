import {Store} from './store';
import {Component, component, Scope, useCelled, useInjected} from "@cmmn/react";
import {Button} from "@cmmn/examples-ui-lib";
import {type Api, ApiToken} from "./api";
import {Fn, inject} from "@cmmn/core";
import {Counters} from "../counter";
import {Draggable} from "../draggable";
import {DraggableTarget} from "../draggable/draggable.target";
import {DraggableClone} from "../draggable/draggable.clone";
import {DraggableContext} from "../draggable/draggable.context";
import {CountersController} from "../model/counters.controller";
//
@component()
export class App extends Component {

	@inject(Store) store!: Store;
	@inject(ApiToken) api!: Api;

	render() {
		return <div style={{display: 'flex', gap: '1em', flexDirection: 'column'}}>
			<Scope provide={[CountersController, '1']}>
				<Counters />
			</Scope>
			<DraggableClone/>
			{/*<Counters id={'2'}/>*/}
			{/*<Counters id={'3'}/>*/}
		</div>;
	}
}
