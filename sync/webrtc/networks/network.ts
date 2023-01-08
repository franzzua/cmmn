export interface Network {
    get map(): ReadonlyMap<string, {connected}>;
    isConnectedTo(user: string): boolean;
}

