// @ts-ignore
globalThis.window = globalThis;
import {StoreFactory} from "../services/store.factory";
import {IFactory, Model, ModelAction, ModelPath, WorkerEntry} from "@cmmn/domain/worker"
import {Container, Injectable} from "@cmmn/core";
import {DrawingFigureJson} from "../drawer/types";


@Injectable()
export class Drawing extends Model<any> {
    constructor(private storeFactory: StoreFactory) {
        super();
    }

    private store = this.storeFactory.getStore('default');

    get State() {
        return [...this.store.Items.values()];
    }

    public AddOrUpdate(item: DrawingFigureJson){
        this.store.Items.set(item.id, item);
    }

    public Delete(id: string){
        this.store.Items.delete(id);
    }
}
@Injectable()
class DrawingFactory extends IFactory {
    constructor(private drawing: Drawing) {
        super();
    }

    public GetModel<TState, TActions extends ModelAction>(path: ModelPath): Model<TState, TActions> {
        return this.Root;
    }

    public get Root(): Model<any, any> {
        return this.drawing;
    }

}


Container.withProviders(WorkerEntry, {
    provide: IFactory, useClass: DrawingFactory
}, StoreFactory).get(WorkerEntry);
