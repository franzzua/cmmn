import {type Cryptor, P2PAuth, P2PRepository} from "@cmmn/sync";
import {singleton} from "@cmmn/core";

@singleton()
export class CounterRepository extends P2PRepository {
	constructor() {
		super('counter')
	}
}

@singleton()
export class CounterAuth extends P2PAuth {

	async getKey(uri: string) {
		const {algo, key} = await fetch(`/api/auth/key/${uri}`).then(x => x.json());
		return {
			algo,
			key: await crypto.subtle.importKey('jwk', key,
				algo, false, ['encrypt', "decrypt"])
		};
	}

	getCryptor(uri: string): Cryptor<Uint8Array> {
		return new AESCryptor(this.getKey(uri));
	}
}

export class AESCryptor implements Cryptor<Uint8Array> {
	constructor(private key: Promise<{ key: CryptoKey, algo }>) {
	}

	private iv = new Uint32Array([1,2,3,4]);

	async encrypt(data: Uint8Array) {
		const {algo, key} = await this.key.catch(console.error);
		return crypto.subtle.encrypt({...algo, iv: this.iv}, key, data)
			.then(x => new Uint8Array(x)).catch((e) => {
				console.error(e);
				return null;
			});
	}

	async decrypt(data: Uint8Array) {
		const {key, algo} = await this.key;
		return crypto.subtle.decrypt({...algo, iv: this.iv}, key, data).then(x => new Uint8Array(x));
	}
}