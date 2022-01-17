import {GlobalStaticState} from "./component";
import {IEvents} from "./types";
import {Cell} from "@cmmn/core";

export abstract class HtmlComponent<TState, TEvents extends IEvents = {}> extends HTMLElement {
    Events: TEvents;

    $state: Cell<TState>;

    get State(): TState {
        return this.$state.get();
    }
    /** @internal **/
    public $render: Cell<string>;

    Actions: Function[] = [];
    Effects: Function[] = [];
}

const HtmlComponentImpl = function () {
    const element = GlobalStaticState.creatingElement;
    // @ts-ignore
    this.__proto__.__proto__ = element.__proto__;
    // @ts-ignore
    element.__proto__ = this.__proto__;
    this.Events = this;
    this.Actions = [];
    this.Effects = [];
    Object.assign(element, this);
    return element;
}

// @ts-ignore
HtmlComponent = HtmlComponentImpl as any;