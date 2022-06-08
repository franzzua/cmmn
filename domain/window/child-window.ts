import {BaseStreamWindow} from '../streams/base-stream.window';
import {ModelProxy} from "../entry/modelProxy";
import {Connector} from "../streams/connector";
import {ModelAction} from "../shared/types";

export class ChildWindowConnector<TState, TActions extends ModelAction = {}> extends Connector{
    constructor(window: Window, proxy: ModelProxy<TState, TActions>) {
        super(new BaseStreamWindow(window), proxy.locator);
        window.addEventListener('beforeunload', this.dispose)
        this.on('disconnect', () => window.removeEventListener('beforeunload', this.dispose));
    }
}
