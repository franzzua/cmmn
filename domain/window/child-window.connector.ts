import {BaseStreamWindow} from './base-stream.window.js';
import {WorkerMessageType} from '../shared/types.js';
import {Connector} from '../streams/connector.js';
import {Locator} from '../shared/locator.js';

/**
 * Находится на стороне Main-thread Parent-окна.
 * Выступает в роли прокси:
 *   Child-окно <=> Parent-окно <=> Домен (locator -> WorkerStream)
 *
 * СХЕМА ОБМЕНА:
 *   - [onMessage,    targetIn: Window Parent-окна    ] - сообщения из Child-окна(в основном Actions) перенаправляет -> в воркер.
 *   - [postMessage, targetOut: WindowProxy Child-окна] - состояние из воркера перенаправляет -> в Child-окно.
 * здесь WindowProxy - это то, что возвращает функция window.open(...).
 */
export class ChildWindowConnector extends Connector {

    constructor(childId: any,
                childWindowProxy: WindowProxy,
                locator: Locator) {
        super(
            new BaseStreamWindow(window, childWindowProxy, childId),
            locator
        );
        window.addEventListener('beforeunload', this.closeChild.bind(this));
    }

    closeChild() {
        this.postMessage({type: WorkerMessageType.Disconnect})
    }

}
