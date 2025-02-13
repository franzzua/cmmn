import { VersionVector } from 'loro-crdt';
import type { PeerId } from '@libp2p/interface';
import { peerIdFromCID } from '@libp2p/peer-id';
import { CID } from 'multiformats';
import { Serializer } from './serializer';
import { Deserializer } from './deserializer';

type LoroUpdateMessage = {
	type: LoroMessageType.Update;
	update: Uint8Array;
};
type LoroRequestMessage = {
	type: LoroMessageType.Request;
	version: VersionVector;
};
type LoroJoinMessage = {
	type: LoroMessageType.Join;
	peerId: PeerId;
	version: VersionVector;
};

export enum LoroMessageType {
	Update,
	Request,
	Join,
}

export type LoroMessage =
	| LoroUpdateMessage
	| LoroJoinMessage
	| LoroRequestMessage;
export const LoroMessage = {
	serialize(msg: LoroMessage) {
		const data =
			msg.type == LoroMessageType.Update ? msg.update : msg.version.encode();
		const peerId =
			msg.type == LoroMessageType.Join ? msg.peerId.toCID().bytes : undefined;
		return Serializer.serialize([
			{ value: msg.type, size: 8 },
			data,
			...(peerId ? [peerId] : []),
		]);
	},
	deserialize(data: Uint8Array): LoroMessage {
		const des = new Deserializer(data);
		const type = des.readByte();
		const bytes = des.readUint8Array();

		switch (type) {
			case LoroMessageType.Update:
				return {
					type: type,
					update: bytes,
				};
			case LoroMessageType.Request:
				return {
					type: type,
					version: VersionVector.decode(bytes),
				};
			case LoroMessageType.Join:
				const peerId = des.readUint8Array();
				return {
					type: type,
					peerId: peerIdFromCID(CID.decode(peerId)),
					version: VersionVector.decode(bytes),
				};
		}
	},
};
