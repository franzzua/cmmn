import {Serializer} from "../p2p/serializer";
import {Deserializer} from "../p2p/deserializer";

export class KeyStore {
	private algo = {
		name: 'ECDH',
		namedCurve: "P-384",
	};
	private key = crypto.subtle.generateKey(this.algo, true, ['deriveKey']);

	private keyMap = new Map<string, CryptoKey>();

	constructor() {
	}

	private publicKey: Uint8Array;
	public async getPublicKey(){
		if (this.publicKey) return this.publicKey;
		const key = await this.key;
		const bytes = await crypto.subtle.exportKey('raw', key.publicKey);
		return this.publicKey = new Uint8Array(bytes);
	}

	async add(peerId: string, key: Uint8Array){
		const cryptoKey = await crypto.subtle.importKey('raw', key, this.algo, true, []);
		this.keyMap.set(peerId, cryptoKey);
		console.log(cryptoKey);
	}

	async encrypt(message: Uint8Array){
		if (this.keyMap.size == 0) return message;
		const sharedKey = await this.getSharedKey();
		const iv = crypto.getRandomValues(new Uint8Array(16));
		const data = await crypto.subtle.encrypt({
			...sharedKey.algorithm,
			iv
		}, sharedKey, message);
		return Serializer.serialize([iv, new Uint8Array(data)]);
	}

	async decrypt(message: Uint8Array){
		if (this.keyMap.size == 0) return message;
		const sharedKey = await this.getSharedKey();
		const des = new Deserializer(message);
		const iv = des.readUint8Array();
		const data = des.readUint8Array();
		return new Uint8Array(await crypto.subtle.decrypt({
			...sharedKey.algorithm,
			iv
		}, sharedKey, data));
	}

	async getSharedKey(){
		const publicKey = [...this.keyMap.values()][0];
		return await crypto.subtle.deriveKey({
			name: this.algo.name,
			public: publicKey,
		}, await this.key.then(x => x.privateKey), {
			name: "AES-GCM",
			length: 256,
		}, false, ["encrypt", "decrypt"]);
	}
}