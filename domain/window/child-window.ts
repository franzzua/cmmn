import {ModelProxy} from "../entry/modelProxy";
import {BaseStream} from "../streams/base.stream";
import {Connector} from "../streams/connector";
import {ModelAction} from "../shared/types";
import {EntityLocator} from "../entry/entity-locator.service";

export class ChildWindowConnector<TState, TActions extends ModelAction = {}> extends Connector{
    constructor(window: Window, proxy: ModelProxy<TState, TActions>) {
        super(new BaseStream(window), proxy.locator);
        window.addEventListener('beforeunload', this.dispose)
        this.on('disconnect', () => window.removeEventListener('beforeunload', this.dispose));
    }
}
