export class KeyProvider {
	private root = new KeyTree();
	constructor(private masterKey: CryptoKey) {
	}

	public getKeys(publicKey: CryptoKey){

	}
}

export abstract class Node {
	public parent?: Node;
	public left?: Node;
	public right?: Node;
}

export class KeyTree extends Node {

}

export class KeyLeaf extends Node {

}