import {Cryptor} from "./cryptor";
import {P2PRepository} from "./p2p.repository";
import {PeerId} from "@libp2p/interface";

export class P2PAuth implements Cryptor{

	constructor(private repository: P2PRepository) {
	}

	async decrypt(message: Uint8Array): Promise<Uint8Array | undefined> {
		return message;
	}

	async encrypt(message: Uint8Array): Promise<Uint8Array> {
		return message;
	}
}
