import {BaseStreamWindow} from '../streams/base-stream.window';
import {ModelProxy} from "../entry/modelProxy";
import {Connector} from "../streams/connector";
import {ModelAction} from "../shared/types";

export class ChildWindowConnector<TState, TActions extends ModelAction = {}> extends Connector{
    constructor(child: Window, proxy: ModelProxy<TState, TActions>) {
        super(new BaseStreamWindow(child), proxy.locator);
        child.addEventListener('beforeunload', this.dispose)
        this.on('disconnect', () => child.removeEventListener('beforeunload', this.dispose));
    }
}
