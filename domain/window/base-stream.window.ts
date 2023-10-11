import {bind} from '@cmmn/core';
import {BaseStream, IPostOpt} from '../streams/base.stream.js';


export class BaseStreamWindow extends BaseStream {

    constructor(targetIn: Window,          // to receive messages
                private targetOut: Window, // to send messages
                private childId) {
        super(targetIn);

        if (!targetOut) {
            throw new Error('BaseStreamWindow. Not defined "targetOut"');
        }
        if (!childId) {
            throw new Error('BaseStreamWindow. Not defined "childId"');
        }

        /**
         * Обе стороны открепленного окна(Parent, Child) сразу готовы для обмена.
         */
        this.Connected.resolve();

        // this.on('message', message => console.log(`in`, getMessageTypeStr(message.type), message));
        // this.on('post', message => console.log(`out`, getMessageTypeStr(message.type), message));
    }

    @bind
    protected onMessage(event): void {
        if (event.origin !== globalThis.origin) {
            return;
        }
        if (event.data.childId !== this.childId)
            return;
        super.onMessage(event);
    }

    protected postMessage(data: any, opt: IPostOpt = {}): void {
        if (!this.targetOut) { // из конструктора BaseStream может быть вызван метод postMessage
            return;
        }
        this.targetOut.postMessage({
            ...data,
            childId: this.childId,
        }, {
            ...opt,
            targetOrigin: globalThis.origin,
        });
    }

}
