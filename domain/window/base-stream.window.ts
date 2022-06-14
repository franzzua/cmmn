import {bind} from '@cmmn/core';
import {BaseStream, IPostOpt} from '../streams/base.stream';

export class BaseStreamWindow extends BaseStream {

    constructor(target: Window, // target.addEventListener('message', this.onMessage)
                private childId,
                private targetToPost: Window) {
        if (!childId) {
            throw new Error('BaseStreamWindow. Not defined "childId"');
        }
        if (!targetToPost) {
            throw new Error('BaseStreamWindow. Not defined "targetToPost"');
        }
        super(target);
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
        this.targetToPost.postMessage({
            ...data,
            childId: this.childId,
        }, {
            ...opt,
            targetOrigin: globalThis.origin,
        });
    }

}
