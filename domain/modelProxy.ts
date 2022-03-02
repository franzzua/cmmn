import {Model} from "./worker/model";
import {Stream} from "./streams/stream";
import {ModelAction, ModelPath} from "./shared/types";

export class ModelProxy<TState, TActions extends ModelAction = {}> extends Model<TState, TActions> {

    constructor(protected stream: Stream, public path: ModelPath) {
        super();
    }

    public $state = this.stream.getCell<Readonly<TState>>(this.path);

    public override Actions: TActions = new Proxy({} as any as TActions, {
        get: (target: any, key: string) => {
            if (key in target)
                return target[key];
            return target[key] = function () {
                return this.Invoke(key, Array.from(arguments))
            }.bind(this);
        }
    });

    public Invoke(action: string, args: any[]): Promise<any> {
        return this.stream.Invoke({
            path: this.path,
            args, action
        });
    }

    public override QueryModel(path: (string | number)[]): any {
        return new ModelProxy(this.stream, [this.path, path].flat());
    }

}

