export enum WorkerMessageType {
    State = 0,
    Action = 1,
    Response = 2,
    Connected = 3,
    Subscribe = 4
}

export type WorkerResponse = {
    type: WorkerMessageType.Response;
    version: string;
    response?: any,
    error?: any,
    actionId: string;
};
export type ModelKey = string|number;
export type ModelPath = ModelKey[];
export type Action = {
    path: ModelPath;
    action: string;
    args: any[]
}
export type WorkerAction = {
    type: WorkerMessageType.Action;
    version: string;
    actionId: string;
} & Action;
export type WorkerSubscribe = {
    path: ModelPath;
    type: WorkerMessageType.Subscribe;
};
export type WorkerState = {
    path: ModelPath;
    type: WorkerMessageType.State;
    state: any;
    version: string;
};
export type WorkerConnected = {
    type: WorkerMessageType.Connected;
};
export type ModelStructure = {

}
export type ModelAction = {
    [key: string]: (...args: any[]) => Promise<any>;
}
export type WorkerMessage = {
    data: WorkerState
        | WorkerAction
        | WorkerResponse
        | WorkerSubscribe
        | WorkerConnected,
    transferables: any[]
};
export type WorkerMessageSerialized = {
    data: Uint8Array;
    transferables: any[];
}
// | {
//     buffer: SharedArrayBuffer;
//     id: string;
// }