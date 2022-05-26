import {ModelProxy} from "../entry/modelProxy";
import {BaseStream} from "../streams/base.stream";
import {Connector} from "../streams/connector";
import {ModelAction} from "../shared/types";
import {EntityLocator} from "../entry/locator";

export class ChildWindowConnector<TState, TActions extends ModelAction = {}> extends Connector{
    constructor(window: Window, proxy: ModelProxy<TState, TActions>) {
        // @ts-ignore to be implemented
        super(new BaseStream(window), proxy);
        window.addEventListener('beforeunload', this.dispose)
        this.on('disconnect', () => window.removeEventListener('beforeunload', this.dispose));
    }
}
