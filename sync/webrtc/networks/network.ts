export interface Network {
    get map(): ReadonlyMap<string, Connection>;
    isConnectedTo(user: string): boolean;

    setConnected(user: string, incoming: boolean): void;
    setDisconnected(user: string, incoming: boolean): void;
}

export type Connection = {
    direction: ConnectionDirection;
    connected: boolean;
}

export enum ConnectionDirection {
    in = 'in',
    out = 'out',
    none = 'none'
}
