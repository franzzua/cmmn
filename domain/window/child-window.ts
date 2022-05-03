import {ModelProxy} from "../modelProxy";
import {BaseStream} from "../streams/base.stream";
import {Connector} from "../streams/connector";
import {ModelAction} from "../shared/types";

export class ChildWindowConnector<TState, TActions extends ModelAction = {}> extends Connector{
    constructor(window: Window, proxy: ModelProxy<TState, TActions>) {
        super(new BaseStream(window), proxy);
        window.addEventListener('beforeunload', this.dispose)
        this.on('disconnect', () => window.removeEventListener('beforeunload', this.dispose));
    }

}