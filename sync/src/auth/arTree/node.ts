export abstract class Node {

    protected constructor(public readonly pk: CryptoKey, public readonly sk: CryptoKey) {
    }
    abstract readonly size: number;

    abstract getSharedKey(): Promise<CryptoKey>;

    public abstract add(node: Node): Promise<Node>;

    abstract getPublicKeys(): Iterable<CryptoKey>;
    abstract getLeafKeys(): Iterable<CryptoKey>;
}