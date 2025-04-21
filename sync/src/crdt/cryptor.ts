import {PeerId} from "@libp2p/interface";

export type Cryptor<TEncrypted = Uint8Array> = {
	encrypt(message: Uint8Array, uri: string, peerId: PeerId): Promise<TEncrypted>;
	decrypt(message: TEncrypted, uri: string, peerId: PeerId): Promise<Uint8Array | undefined>;
}