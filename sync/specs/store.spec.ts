import {expect, suite, test} from "@cmmn/tools/test";
import {SyncStore} from "../store/sync.store";
import {ChannelMock} from "./mocks/channel.mock";

@suite
export class StoreSpec {

    private mainStore = new SyncStore<Entity>();
    private testStore = new SyncStore<Entity>();

    constructor() {
        this.mainStore.adapter.connect(new ChannelMock());
        this.testStore.adapter.connect(new ChannelMock());
    }

    @test
    add() {
        this.mainStore.Items.set('one', {
            id: 'one',
            title: 'two'
        });
        expect(this.testStore.Items.get('one').title).toEqual('two');
    }
    @test
    delete() {
        this.add();
        this.mainStore.Items.delete('one');
        expect(this.testStore.Items.has('one')).toBe(false);
    }

    @test
    update() {
        this.add();
        this.mainStore.Items.set('one', {
            id: 'one',
            title: 'three'
        });
        expect(this.testStore.Items.get('one').title).toEqual('three');
    }
}

class Entity {
    id: string;
    title: string;
}
