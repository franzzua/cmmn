import {ctrl, get} from "@cmmn/server";
import {subtle} from "node:crypto";
import process from "node:process";
import fs from "node:fs/promises";
import {KeyProvider} from "../key-provider";
import {KeyStorage} from "../services/key-storage";


const masterkey = 'MASTER_KEY';

@ctrl('auth')
export class AuthCtrl {
	private masterKeyStorage = new KeyStorage('MASTER_KEY', {
		name: 'Ed25519',
	}, ['sign'], ['verify']);
	private sharedKeyStorage = new KeyStorage('SHARED_KEY', {
		name: "AES-GCM",
		length: 256,
	}, ['decrypt', 'encrypt']);

	private tokenProvider = {
		getToken(uri: string){
			return {
				uri,
				mode: 'write'
			}
		}
	}

	@get('key/:uri')
	async getToken(req: {
		uri: string;
	}) {
		const masterKey = await this.masterKeyStorage.getOrCreateKey() as CryptoKeyPair;
		const token = this.tokenProvider.getToken(req.uri)
		const signature = await subtle.sign(masterKey.privateKey.algorithm, masterKey.privateKey, Buffer.from(JSON.stringify(token), 'utf-8'));
		const sharedKey = await this.sharedKeyStorage.getOrCreateKey() as CryptoKey;
		return {
			token,
			signature: Buffer.from(signature).toString('base64'),
			key: await subtle.exportKey('jwk', sharedKey),
			algo: sharedKey.algorithm
		};
	}

	@get('public')
	async getPublic() {
		const masterKey = await this.masterKeyStorage.getOrCreateKey() as CryptoKeyPair;
		return subtle.exportKey('jwk', masterKey.publicKey);
	}
}