import "@cmmn/core";
import {expect, suite, test} from "@cmmn/tools/test";
import {SyncStore} from "../store/sync.store";
import {BroadcastSync} from "../store/broadcast-sync";
import {Fn} from "@cmmn/core";
import { Cell } from "@cmmn/cell";

@suite
export class StoreSpec {

    private mainStore = new SyncStore('main');
    private testStore = new SyncStore('test');

    constructor() {
        const bcMain = new BroadcastSync('bc');
        const bcTest = new BroadcastSync('bc');
        this.mainStore.addSync(bcMain);
        this.testStore.addSync(bcTest);
        // this.mainStore.adapter.connect(new ChannelMock());
        // this.testStore.adapter.connect(new ChannelMock());
    }

    @test
    async setAdd() {
        const mainSet = this.mainStore.getSet<number>("value");
        const testSet = this.testStore.getSet<number>("value");
        // need to activate sets, because they are lazy by default
        mainSet.on('change', () => {});
        testSet.on('change', () => {});
        mainSet.add(1);
        await Fn.asyncDelay(10);
        expect(Array.from(testSet)).toEqual([1])
        testSet.add(3);
        mainSet.add(2);
        await Fn.asyncDelay(10);
        expect(Array.from(testSet).sort()).toEqual([1, 2, 3]);
        expect(Array.from(mainSet).sort()).toEqual([1, 2, 3]);
    }

    @test
    async objectSet() {
        const main = this.mainStore.getObjectCell<{a?: number; b?: number;}>("value");
        const test = this.testStore.getObjectCell<{a?: number; b?: number;}>("value");
        // need to activate sets, because they are lazy by default
        main.on('change', () => {});
        test.on('change', () => {});
        main.Diff({a: 1});
        await Fn.asyncDelay(10);
        expect(test.Value).toEqual({a: 1})
        test.Diff({b: 3, a: 2})
        main.Diff({a: 4});
        await Fn.asyncDelay(10);
        expect(main.Value).toEqual(test.Value);
        expect(main.Value.b).toEqual(3);
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
