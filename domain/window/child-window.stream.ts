import {Lazy} from '@cmmn/core';
import {BaseStreamWindow} from './base-stream.window';
import {WorkerStream} from '../streams/workerStream';
import {WorkerMessageType} from '../shared/types';

/**
 * Находится на стороне Main-thread Child-окна.
 *
 * Браузер открывает Child-окно после вызова из под Parent-окна функции window.open(...) .
 * При инициализации Child-окна В ЕГО Main-thread создается ChildWindowStream.
 *
 * СХЕМА ОБМЕНА:
 *   - [onMessage,    targetIn: Window Child-окна] - из Parent-окна пришло сообщение -> в Child-окно;
 *   - [postMessage, targetOut: Window.opener    ] - из Child-окна перенаправляет сообщение -> в Parent-окно.
 */
export class ChildWindowStream extends WorkerStream {

    private sendDisconnectToParent = true;

    constructor() {
        super(window);

        window.addEventListener('keyup', () => this.sendDisconnectToParent = true);
        window.addEventListener('keydown', ({code, ctrlKey, metaKey}) => {
            const isCombinationForPageRefresh = code === 'F5' ||
                (code === 'KeyR' && (ctrlKey || metaKey)); // win: ctrl+R; mac: cmd+R
            this.sendDisconnectToParent = !isCombinationForPageRefresh;
        });

        window.addEventListener('beforeunload', () => {
            if (this.sendDisconnectToParent) {
                this.postMessage({type: WorkerMessageType.Disconnect});
            }
        });
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

    protected onDisconnect() { // из Parent-окна пришел disconnect
        this.sendDisconnectToParent = false;
        window.close();
    }

}
