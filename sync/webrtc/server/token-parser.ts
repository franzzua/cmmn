export abstract class TokenParser {

    public abstract Parse(token: string): Promise<{
        User: string;
        AccessMode: 'read' | 'write'
    }>
}