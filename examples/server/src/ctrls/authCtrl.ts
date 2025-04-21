import {ctrl, get} from "@cmmn/server";
import {subtle} from "node:crypto";
import process from "node:process";
import fs from "node:fs/promises";


const envKey = 'MASTER_KEY';

@ctrl('auth')
export class AuthCtrl {
	private tokenProvider = {
		getToken(uri: string){
			return {
				uri,
				mode: 'write'
			}
		}
	}
	private masterKey: CryptoKeyPair;
	private keyAlgorithm = {
		name: 'Ed25519',
	};
	private async getMasterKey() {
		const stored = process.env[envKey];
		if (stored){
			const keys = stored.split('.').map(text => Buffer.from(text, 'base64'));
			const [privateKey, publicKey] = await Promise.all([
				subtle.importKey('pkcs8', keys[0], this.keyAlgorithm, false, ['sign']),
				subtle.importKey('spki', keys[1], this.keyAlgorithm, false, ['verify'])
			]);
			return {
				privateKey, publicKey
			}
		}
		const key = await subtle.generateKey(this.keyAlgorithm, true, ['sign', 'verify']) as CryptoKeyPair;
		await this.saveKey(key);
		return key;
	}

	private async saveKey(key: CryptoKeyPair){
		const keys = await Promise.all([
			subtle.exportKey('pkcs8', key.privateKey),
			subtle.exportKey('spki', key.publicKey),
		]);
		const env = await fs.readFile('./.env', {encoding: 'utf-8'});
		const serialized = keys.map(key => Buffer.from(key).toString('base64')).join('.')
		await fs.writeFile('./.env', env.replace(/\n$/, '') + envKey + '=' + serialized + '\n', { encoding: 'utf-8'});
	}


	@get('key/:uri')
	async getToken(req: {
		uri: string;
	}) {
		const key = this.masterKey ??= await this.getMasterKey();
		const token = this.tokenProvider.getToken(req.uri)
		const signature = await subtle.sign(this.keyAlgorithm, key.privateKey, Buffer.from(JSON.stringify(token), 'utf-8'));
		return {
			token,
			signature: Buffer.from(signature).toString('base64')
		};
	}

	@get('public')
	async getPublic() {
		const key = this.masterKey ??= await this.getMasterKey();
		return subtle.exportKey('jwk', key.publicKey);
	}
}