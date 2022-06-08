import {bind} from '@cmmn/core';
import {BaseStream, IPostOpt} from './base.stream';

export class BaseStreamWindow extends BaseStream {

    @bind
    protected onMessage(event): void {
        if (event.origin !== globalThis.origin) {
            return;
        }
        super.onMessage(event);
    }

    protected postMessage(data: any, opt: IPostOpt = {}): void {
        super.postMessage(data, {
            ...opt,
            targetOrigin: opt.targetOrigin || globalThis.origin,
        });
    }

}
