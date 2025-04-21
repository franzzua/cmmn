import { VersionVector } from 'loro-crdt';
import { Serializer } from './serializer';
import { Deserializer } from './deserializer';


export type LoroUpdateMessage = {
	type: LoroMessageType.Update;
	update: Uint8Array;
	publicKey: Uint8Array;
};
export type LoroRequestMessage = {
	type: LoroMessageType.Request;
	version: Uint8Array;
	publicKey: Uint8Array;
};
export type LoroJoinMessage = {
	type: LoroMessageType.Join;
	version: Uint8Array;
	publicKey: Uint8Array;
};

export enum LoroMessageType {
	Update,
	Request,
	Join,
}

export type LoroMessage = LoroUpdateMessage
	| LoroJoinMessage
	| LoroRequestMessage;

export const LoroMessage = {
	serialize(msg: LoroMessage) {
		const data = msg.type == LoroMessageType.Update ? msg.update : msg.version;
		// const peerId =
		// 	msg.type == LoroMessageType.Join ? msg.peerId.toCID().bytes : undefined;
		return Serializer.serialize([
			{ value: msg.type, size: 8 },
			data,
			msg.publicKey,
		]);
	},
	deserialize(data: Uint8Array): LoroMessage {
		const des = new Deserializer(data);
		const type = des.readByte();
		const bytes = des.readUint8Array();
		const publicKey = des.readUint8Array();
		switch (type) {
			case LoroMessageType.Update:
				return {
					type: type,
					update: bytes,
					publicKey
				} as LoroUpdateMessage;
			case LoroMessageType.Request:
				return {
					type: type,
					version: bytes,
					publicKey
				} as LoroRequestMessage;
			case LoroMessageType.Join:
				return {
					type: type,
					version: bytes,
					publicKey
				} as LoroJoinMessage;
		}
	},
};
