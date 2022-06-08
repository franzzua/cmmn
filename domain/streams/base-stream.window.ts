import {bind} from '@cmmn/core';
import {BaseStream, IPostOpt} from './base.stream';
import {WorkerMessage} from "../shared/types";

export class BaseStreamWindow extends BaseStream {

    protected subscribe(eventName: keyof { message: WorkerMessage["data"] }) {
        globalThis.addEventListener('message', this.onMessage);
        globalThis.addEventListener('messageerror', this.onMessageError);
        super.subscribe(eventName);
    }
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
