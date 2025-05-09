export abstract class Cryptor {
	abstract encrypt(message: Uint8Array): Promise<Uint8Array>;
	abstract decrypt(message: Uint8Array): Promise<Uint8Array>;
}