import {Component, component, ReactRouter, Scope} from "@cmmn/react";
import {type Api, ApiToken} from "./api";
import {bind, cell, inject} from "@cmmn/core";
import type {FC} from "react";
import {ButtonGreen as Button} from "@cmmn/examples-ui-lib/green-button";

const router = ReactRouter.fromTable({
	root: {
		fc: AppPage,
		route: ''
	},
	counter: {
		route: '/counter?id=:id',
		loadFC: () => import("./counter.page").then(x => x.CounterPage as FC)
	}
}, '/example/react');

@component()
export class App extends Component {
	@cell()
	private accessor ctrl;
	private counters;


	// @inject(Store) store!: Store;
	@inject(ApiToken) api!: Api;

	@bind()
	async load(){
		this.counters = await import('../counter');
		this.ctrl = await import('../counter/counters.controller');
	}

	render() {
		return router.Current;
	}
}

export function AppPage(){
	return (<>
		<Button onClick={() => router.go('counter', {id: 1})}>Load 1</Button>
		<Button onClick={() => router.go('counter', {id: 3})}>Load 3</Button>
		<Button onClick={() => router.go('counter', {id: 5})}>Load 5</Button>
	</>)
}

