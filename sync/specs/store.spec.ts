import "@cmmn/core";
import {expect, suite, test} from "@cmmn/tools/test";
import {SyncStore} from "../store/sync.store";
import {BroadcastSync} from "../store/broadcast-sync";
import {Fn} from "@cmmn/core";

@suite
export class StoreSpec {

    // private mainStore = new SyncStore('main');
    // private testStore = new SyncStore('main');

    constructor() {
        // this.mainStore.adapter.connect(new ChannelMock());
        // this.testStore.adapter.connect(new ChannelMock());
    }

    @test
    async setAdd() {
        // const s1 = this.mainStore.getSet<number>('items');
        // const s2 = this.testStore.getSet<number>('items');
        // s1.add(1);
        // await Fn.asyncDelay(100);
        // expect(s2.has(1)).toBeTruthy()
    }
    // @test
    // delete() {
    //     this.add();
    //     this.mainStore.Items.delete('one');
    //     expect(this.testStore.Items.has('one')).toEqual(false);
    // }
    //
    // @test
    // update() {
    //     this.add();
    //     this.mainStore.Items.set('one', {
    //         id: 'one',
    //         title: 'three'
    //     });
    //     expect(this.testStore.Items.get('one').title).toEqual('three');
    // }
}

class Entity {
    id: string;
    title: string;
}
