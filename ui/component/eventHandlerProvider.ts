import {IEvents, SingleArg} from "./types";
import {bind, Fn} from "@cmmn/core";
import {HtmlComponentBase} from "./html-component-base";

export class EventHandlerProvider<TEvents extends IEvents> {
    constructor(private component: HtmlComponentBase<any, TEvents>) {
    }

    private eventHandlers: {
        [key: string]: [Function, boolean, Function]
    } = {};


    private unsibscribers: Function[] = [];

    @bind
    private addUnsubscriber(unsubscr: Function) {
        this.unsibscribers.push(unsubscr);
    }

    public getEventHandler<TKey extends keyof TEvents = keyof TEvents>(type: TKey) {
        return (mapping: (event: Event) => SingleArg<TEvents[TKey]> = Fn.I as any) => {
            const key = `${type}.${mapping}`;
            if (key in this.eventHandlers)
                return this.eventHandlers[key];
            const listener = (event: Event) => {
                const directHandler = this.component.Events && this.component.Events[type];
                if (directHandler)
                    directHandler.call(this.component, mapping(event));
                return false;
            };
            return (this.eventHandlers[key] = [listener, false, this.addUnsubscriber]);
        }
    }

    public Unsubscribe() {
        this.unsibscribers.forEach(f => f());
    }
}