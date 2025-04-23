import {Serializer} from "../p2p/serializer";
import {Deserializer} from "../p2p/deserializer";
import {ArTree} from "./arTree/ar-tree";

export class KeyStore {

	private tree = new ArTree(this.peerId);

	constructor(private peerId: string) {
	}

	public async getPublicKey(){
		return this.tree.getPublicKey();
	}

	add(peerId: string, key: Uint8Array){
		return this.tree.add(peerId, key);
	}

	async encrypt(message: Uint8Array){
		const sharedKey = await this.tree.getSharedKey();
		const iv = crypto.getRandomValues(new Uint8Array(16));
		const data = await crypto.subtle.encrypt({
			...sharedKey.algorithm,
			iv
		}, sharedKey, message);
		return Serializer.serialize([iv, new Uint8Array(data)]);
	}

	async decrypt(message: Uint8Array){
		const sharedKey = await this.tree.getSharedKey();
		const des = new Deserializer(message);
		const iv = des.readUint8Array();
		const data = des.readUint8Array();
		return new Uint8Array(await crypto.subtle.decrypt({
			...sharedKey.algorithm,
			iv
		}, sharedKey, data));
	}

}

