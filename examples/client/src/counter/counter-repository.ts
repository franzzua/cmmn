import {type Cryptor, P2PRepository} from "@cmmn/sync";
import {singleton} from "@cmmn/core";

@singleton()
export class CounterRepository extends P2PRepository {
	constructor() {
		super('counter')
	}

	async getKey(uri: string) {
		const {algo, key} = await fetch(`/api/auth/key/${uri}`).then(x => x.json());
		return {
			key: await crypto.subtle.importKey('jwk', key, algo, true, ['decrypt', 'encrypt']),
			algo: algo as AlgorithmIdentifier
		};
	}

	protected getCryptor(uri: string): Cryptor {
		const cryptor = new SymmetricCryptor(this.getKey(uri));
		cryptor.encrypt(new Uint8Array([1,2,3,4])).then(enc => cryptor.decrypt(enc));
		return cryptor;
	}
}


export class SymmetricCryptor implements Cryptor {
	constructor(private key: Promise<{key: CryptoKey, algo: AesGcmParams}>) {
	}
	private ivLength = 16;
	async encrypt(data: Uint8Array) {
		const iv = crypto.getRandomValues(new Uint8Array(this.ivLength))
		const {key, algo} = await this.key;
		return crypto.subtle.encrypt({
			...algo,
			iv
		}, key, data)
			.then(x => {
				const result = new Uint8Array(x.byteLength + this.ivLength);
				result.set(iv);
				result.set(new Uint8Array(x), this.ivLength);
				return result;
			}).catch((e) => {
				console.error('Encrypt error:', e);
				return new Uint8Array(0);
			});
	}

	async decrypt(data: Uint8Array) {
		const {key, algo} = await this.key;
		const iv = new Uint8Array(data.buffer, 0, this.ivLength);
		const encrypted = new Uint8Array(data.buffer, this.ivLength);
		return crypto.subtle.decrypt({ ...algo, iv }, key, encrypted).then(x => {
			return new Uint8Array(x);
		}).catch((e) => {
			console.error('Decrypt error:', e);
			return new Uint8Array(0);
		});
	}
}

export class RSACryptor implements Cryptor {
	constructor(private key: Promise<CryptoKeyPair>) {
	}

	private algo = {
		name: 'RSA-OAEP'
	}

	async encrypt(data: Uint8Array) {
		const {publicKey} = await this.key;
		return crypto.subtle.encrypt(this.algo, publicKey, data)
			.then(x => {
				return new Uint8Array(x);
			}).catch((e) => {
				console.error('Encrypt error:', e, publicKey, data.length);
				return new Uint8Array(0);
			});
	}

	async decrypt(data: Uint8Array) {
		const {privateKey} = await this.key;
		return crypto.subtle.decrypt(this.algo, privateKey, data).then(x => {
			return new Uint8Array(x);
		}).catch((e) => {
			console.error('Decrypt error:', e);
			return new Uint8Array(0);
		});
	}
}