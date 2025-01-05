export type RpcMessage = {
    args: any[]
    method: string;
    id: string;
    service: string;
} | {
    result?: any;
    error?: any;
    id: string;
}

export type RpcService = {
    [key: string | symbol]: (...args: Transferable[]) => Transferable | Promise<Transferable>;
}

export type Transferable =
    string | boolean | number | bigint | null | undefined |
    ReadonlyArray<Transferable> | {
    [key: string]: Transferable;
};