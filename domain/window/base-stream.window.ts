import {bind} from '@cmmn/core';
import {BaseStream, IPostOpt} from '../streams/base.stream';

export class BaseStreamWindow extends BaseStream {

    constructor(targetIn: Window,          // to receive messages
                private targetOut: Window, // to send messages
                private childId) {
        if (!childId) {
            throw new Error('BaseStreamWindow. Not defined "childId"');
        }
        if (!targetOut) {
            throw new Error('BaseStreamWindow. Not defined "targetOut"');
        }
        super(targetIn);
    }

    @bind
    protected onMessage(event): void {
        if (event.origin !== globalThis.origin) {
            return;
        }
        if (event.data.childId !== this.childId)
            return;
        console.log(`onMessage`, {...event.data})
        super.onMessage(event);
    }

    protected postMessage(data: any, opt: IPostOpt = {}): void {
        console.log(`postMessage`, {
            ...data,
            childId: this.childId,
        }, {
            ...opt,
            targetOrigin: globalThis.origin,
        })
        this.targetOut.postMessage({
            ...data,
            childId: this.childId,
        }, {
            ...opt,
            targetOrigin: globalThis.origin,
        });
    }

}
