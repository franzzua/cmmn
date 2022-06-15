import {Lazy} from '@cmmn/core';
import {BaseStreamWindow} from './base-stream.window';
import {WorkerStream} from '../streams/workerStream';

/**
 * Находится на стороне Main-thread Child-окна.
 *
 * Браузер открывает Child-окно после вызова из под Parent-окна функции window.open(...) .
 * При инициализации Child-окна В ЕГО Main-thread создается ChildWindowStream.
 *
 * СХЕМА ОБМЕНА:
 *   - [onMessage,    targetIn: Window Child-окна] - из Parent-окна пришло сообщение -> в Child-окно;
 *   - [postMessage, targetOut: Window.opener    ] - из Child-окна отправляю сообщение -> в Parent-окно
 *
 */
export class ChildWindowStream extends WorkerStream {

    constructor() {
        super(window);
    }

    @Lazy
    protected get BaseStream() {
        const target = this.target as Window;
        return new BaseStreamWindow(
            target,
            target.opener,
            target['childId'],
        );
    }

}
