import {BaseStreamWindow} from './base-stream.window';
import {Connector} from '../streams/connector';
import {ModelProxy} from '../entry/modelProxy';
import {ModelAction} from '../shared/types';

/**
 * Находится на стороне Main-thread Parent-окна.
 * Выступает в роли прокси между доменом(находится в воркере) и Child-окном.
 *
 * СХЕМА ОБМЕНА:
 *   - [onMessage,    targetIn: Window Parent-окна] - сообщения из Child-окна(в основном Actions) перенаправляет -> в воркер.
 *   - [postMessage, targetOut: WindowProxy       ] - состояние из воркера перенаправляет -> в Child-окно.
 * здесь WindowProxy - это то, что возвращает функция window.open(...).
 */
export class ChildWindowConnector<TState, TActions extends ModelAction = {}> extends Connector {

    constructor(childId: any,
                windowProxy: WindowProxy,
                modelProxy: ModelProxy<TState, TActions>) {
        super(
            new BaseStreamWindow(window, windowProxy, childId),
            modelProxy.locator
        );
        // windowProxy.addEventListener('beforeunload', this.dispose)
        // this.on('disconnect', () => windowProxy.removeEventListener('beforeunload', this.dispose));
    }

}
