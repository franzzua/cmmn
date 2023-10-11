import {BaseCell, Cell} from "@cmmn/cell";
import {EventEmitter, Fn, Injectable} from "@cmmn/core";
import {Stream} from "./stream.js";
import {Action} from "../shared/types.js";
import {Locator} from "../shared/locator.js";
import {VersionState} from "./versionState.js";

@Injectable()
export class DirectStream extends Stream {
    constructor(private locator: Locator) {
        super();
    }

    private actionEmitter = new EventEmitter<{
        action: void
    }>()

    async Invoke(action: Action): Promise<any> {
        await Promise.resolve();
        const model = this.locator.get<any, any>(action.path);
        if (!model) throw new Error("model not found at path " + action.path.join(':'))
        const result = await model.Actions[action.action](...action.args);
        this.actionEmitter.emit('action');
        return result;
    }

    getCell<T>(path: (string | number)[]): BaseCell {
        let model = this.locator.get(path);
        const vs = new VersionState({
            onExternal: state => model.State = state
        });
        if (model) {
            vs.LinkRemote(model);
        } else {
            const off = this.actionEmitter.on('action', () => {
                model = this.locator.get(path);
                if (!model) return;
                off();
                vs.LinkRemote(model);
            })
        }
        // vs.on('change', event => model.State = event.value);
        // vs.setRemote(Fn.ulid(), model.State);
        return vs;
    }
}
