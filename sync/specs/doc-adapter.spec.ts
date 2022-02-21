import {suite, test, expect} from "@cmmn/tools/test";
import { Doc } from "yjs";
import {ChannelMock} from "./mocks/channel.mock";
import {DocAdapter} from "../shared/doc-adapter";
import { Awareness } from "y-protocols/awareness";

@suite
export class DocAdapterSpec{

    @test
    testTwoDocs(){
        const doc1 = new Doc();
        const doc2 = new Doc();
        const adapter1 = new DocAdapter(doc1, new Awareness(doc1));
        const adapter2 = new DocAdapter(doc2, new Awareness(doc2));
        adapter1.connect(new ChannelMock());
        adapter2.connect(new ChannelMock());

        const value1 = doc1.getText('value');
        const value2 = doc2.getText('value');

        value1.insert(0, 'hello');
        const json = value2.toJSON();
        expect(json).toEqual(value1.toJSON())
    }
}

