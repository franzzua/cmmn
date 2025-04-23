import * as util from "node:util";

const HASH_NAME = 'SHA-256';
const HMAC_NAME = "HMAC";

export const utils = {
    algo: {
        name: 'ECDH',
        namedCurve: "P-384",
    },
    curve: {
        name: "ECDSA",
        namedCurve: "P-384",
        hash: HASH_NAME,
    },
    keyUsages: ['deriveKey'],
    createKey() {
        return crypto.subtle.generateKey(this.algo, true, ['deriveKey']);
    },
    importHMAC(raw: ArrayBuffer) {
        return crypto.subtle.importKey("raw", raw, { name: HMAC_NAME, hash: { name: HASH_NAME } }, true, ["sign", "verify"]);
    },
    async hkdf(buffer: ArrayBuffer, info: Uint8Array = undefined): Promise<CryptoKey> {
        const salt = await utils.importHMAC(new Uint8Array(32).buffer);
        const prk = await utils.importHMAC(await utils.sign(salt, buffer));
        const data = await utils.sign(prk, info);
        return crypto.subtle.importKey("raw", data, this.curve, true, []);
    },
    async getSharedKey(privateKey: CryptoKey, publicKey: CryptoKey): Promise<CryptoKey> {
        return await crypto.subtle.deriveKey({
            name: this.algo.name,
            public: publicKey,
        }, privateKey, {
            name: "AES-GCM",
            length: 256,
        }, false, ['encrypt', 'decrypt']);
    },
    async getPublicKey(sk: CryptoKey) {
        const jwkPrivate = await crypto.subtle.exportKey("jwk", sk);
        delete jwkPrivate.d;
        return crypto.subtle.importKey("jwk", jwkPrivate, this.curve, true, []);

    },
    async sign(privateKey: CryptoKey, data: ArrayBuffer) {
        return crypto.subtle.sign(privateKey.algorithm, privateKey, data);
    },
    sha256(data: Uint8Array) {
        return crypto.subtle.digest('sha-256', data);
    },
    X3DH: {
        async send(selfIdentity: CryptoKeyPair,
                   remoteIdentity: CryptoKey,
                   keyExchangeKeyPair: CryptoKeyPair,
                   remoteEphemeralKey: CryptoKey) {
            const data = await utils.concat([
                await utils.getSharedKey(selfIdentity.privateKey, remoteIdentity),
                await utils.getSharedKey(selfIdentity.privateKey, remoteEphemeralKey),
                await utils.getSharedKey(keyExchangeKeyPair.privateKey, remoteIdentity),
                await utils.getSharedKey(keyExchangeKeyPair.privateKey, remoteEphemeralKey),
            ]);
            return await utils.hkdf(data);
        },
        async receive(selfIdentity: CryptoKeyPair,
                      remoteIdentity: CryptoKey,
                      ephemeralKey: CryptoKeyPair,
                      keyExchangeKey: CryptoKey) {
            const data = await utils.concat([
                await utils.getSharedKey(selfIdentity.privateKey, remoteIdentity),
                await utils.getSharedKey(ephemeralKey.privateKey, remoteIdentity),
                await utils.getSharedKey(selfIdentity.privateKey, keyExchangeKey),
                await utils.getSharedKey(ephemeralKey.privateKey, keyExchangeKey),
            ]);
            return await utils.hkdf(data);
        },
    },
    async concat(keys: CryptoKey[]) {
        const arrays = await Promise.all(keys.map(utils.export));
        const size = arrays.reduce((a, b) => a + b.length, 0);
        const result = new Uint8Array(size);
        let position = 0;
        for (let array of arrays) {
            result.set(array, position);
            position += array.length;
        }
        return result;
    },
    async export(key: CryptoKey) {
        if (key.type == "public")
            return new Uint8Array(await crypto.subtle.exportKey("raw", key));
        const pkcs8 = await crypto.subtle.exportKey("pkcs8", key)
        return new Uint8Array(pkcs8, '302e020100300506032b657004220420'.length / 2);
    },
    PK_LENGTH: 33,
    SK_LENGTH: 32,
    SI_LENGTH: 64,
    ENCRYPTION_PREFIX_LENGTH: 12,
    ENCRYPTION_SUFFIX_LENGTH: 16,
}

