export abstract class TokenParser {

    public abstract Parse(token: string): Promise<{
        User: string;
        AccessMode: 'read' | 'write'
    }>
}

export type UserInfo = {
    user: string;
    accessMode: 'read' | 'write';
}