import {Cryptor} from "../src";

export class CryptorMock implements Cryptor{
    async encrypt(message: Uint8Array): Promise<Uint8Array> {
        return message;
    }

    async decrypt(message: Uint8Array): Promise<Uint8Array> {
        return message;
    }
}