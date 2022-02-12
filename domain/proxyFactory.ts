import {IFactory} from "./shared/factory";
import {Model} from "./worker/model";
import {ModelProxy} from "./modelProxy";
import {Stream} from "./streams/stream";
import {Injectable} from "@cmmn/core";
import {ModelPath} from "./shared/types";
import {getRootProxy} from "./shared/domain.structure";

@Injectable()
export class ProxyFactory extends IFactory<any> {

    constructor(private stream: Stream) {
        super();
    }

    private rootProxy = getRootProxy();
    public get Root(): any {
        return new this.rootProxy(this.stream, ['Root']);
    }
    private Instances = new Map<string, ModelProxy<any, any>>();

    public GetModel<TModel extends Model<any, any>>(path: ModelPath): TModel {
        return this.Instances.getOrAdd(path.join(':'),
            key => new ModelProxy(this.stream, path)) as any as TModel;
    }

}
