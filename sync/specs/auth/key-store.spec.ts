import {describe, test} from "node:test";
import {ArTree} from "../../src/auth/arTree/ar-tree";
import {expect} from "@cmmn/tools/test";

describe("ArTree", () => {
    test("1 peer", async () => {
        const aliceTree = new ArTree();
        // expect(await aliceTree.getPublicKey()).not.toHaveLength(0);
        expect(await aliceTree.getSharedKey()).not.toHaveLength(0);

        // const encrypted = await aliceTree.encrypt(new Uint8Array([1, 2, 3, 4, 5]));
        // const decrypted = await aliceTree.decrypt(encrypted);
        // expect(decrypted).not.toHaveLength(0);
        // for (let i = 0; i < decrypted.length; i++) {
        //     expect(decrypted[i]).toEqual(i + 1);
        // }
    });

    test("2 peer", async () => {
        const alice = new ArTree();
        const bob = new ArTree();
        const [alicePK, bobPK] = [
            await alice.getPublicKey(),
            await bob.getPublicKey(),
        ];
        await alice.add(bobPK);
        await bob.add(alicePK);
        const aliceSK = await alice.getSharedKey();
        const bobSK = await alice.getSharedKey();
        expect(aliceSK).toEqual(bobSK);
        // const message = new Uint8Array([1, 2, 3, 4, 5]);
        // const encrypted = await alice.encrypt(message);
        // const decrypted = await bob.decrypt(encrypted);
        // expect(decrypted).toHaveLength(message.length);
        // for (let i = 0; i < decrypted.length; i++) {
        //     expect(decrypted[i]).toEqual(message[i]);
        // }
    })
})

