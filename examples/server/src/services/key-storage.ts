import {subtle} from "node:crypto";
import fs from "node:fs/promises";
import process from "node:process";
import {singleton} from "@cmmn/core";

@singleton()
export class KeyStorage {
	constructor(private readonly name: string,
	            public readonly keyAlgorithm: AlgorithmIdentifier | RsaHashedKeyGenParams | EcKeyGenParams | AesKeyGenParams | HmacKeyGenParams | Pbkdf2Params,
	            private readonly privateKeyUsage: KeyUsage[],
	            private readonly publicKeyUsage: KeyUsage[] = []) {
	}

	private _cached: CryptoKeyPair | CryptoKey | undefined;

	public async getOrCreateKey() {
		if (this._cached) {
			return this._cached;
		}
		if (process.env[this.name]) {
			return this._cached = await this.parse(process.env[this.name])
		}
		this._cached = await subtle.generateKey(this.keyAlgorithm, true, [...this.privateKeyUsage, ...this.publicKeyUsage]) as CryptoKeyPair | CryptoKey;
		await this.saveKey(this.name, this._cached);
		return this._cached;
	}


	private async saveKey(name: string, key: CryptoKeyPair | CryptoKey) {
		const serialized = await this.serialize(key);
		const env = await fs.readFile('./.env', {encoding: 'utf-8'});
		await fs.writeFile('./.env', env.replace(/\n$/, '') + '\n' + name + '=' + serialized + '\n', {encoding: 'utf-8'});
	}

	private async serialize(key: CryptoKeyPair | CryptoKey) {
		if ('privateKey' in key) {
			const keys = await Promise.all([
				subtle.exportKey('pkcs8', key.privateKey),
				subtle.exportKey('spki', key.publicKey),
			]);
			return keys.map(key => Buffer.from(key).toString('base64')).join('.');
		} else {
			return Buffer(await subtle.exportKey('raw', key)).toString('base64');
		}
	}

	private async parse(str: string): Promise<CryptoKeyPair | CryptoKey> {
		const keys = str.split('.').map(text => Buffer.from(text, 'base64'));
		if (keys.length == 2) {
			const [privateKey, publicKey] = await Promise.all([
				subtle.importKey('pkcs8', keys[0], this.keyAlgorithm, true, this.privateKeyUsage),
				subtle.importKey('spki', keys[1], this.keyAlgorithm, true, this.publicKeyUsage)
			]);
			return {
				privateKey, publicKey
			}
		} else {
			return subtle.importKey('raw', keys[0], this.keyAlgorithm, true, this.privateKeyUsage);
		}
	}
}