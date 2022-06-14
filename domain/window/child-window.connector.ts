import {BaseStreamWindow} from './base-stream.window';
import {ModelProxy} from '../entry/modelProxy';
import {Connector} from '../streams/connector';
import {ModelAction} from '../shared/types';

/**
 * Работает на стороне Main-thread Parent-окна.
 * Выступает в роли прокси между доменом(находится в воркере) и Child-окном.
 *
 * СХЕМА ОБМЕНА:
 *   - [onMessage,   target: Window Parent-окна] - сообщения из Child-окна(в основном Actions) перенаправляет -> в воркер.
 *   - [postMessage, target: WindowProxy       ] - состояние из воркера перенаправляет -> в Child-окно.
 * здесь WindowProxy - это то, что возвращает функция window.open(...)
 *
 */
export class ChildWindowConnector<TState, TActions extends ModelAction = {}> extends Connector {

    constructor(windowProxy: WindowProxy,
                childId: any,
                modelProxy: ModelProxy<TState, TActions>) {
        super(new BaseStreamWindow(window, childId, windowProxy), modelProxy.locator);
        // windowProxy.addEventListener('beforeunload', this.dispose)
        // this.on('disconnect', () => windowProxy.removeEventListener('beforeunload', this.dispose));
    }

}
