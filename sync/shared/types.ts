export type Message =
    | {
    type: "update";
    docID: string;
    updateType: "message" | "savedState";
    update: Uint8Array;
}
    | { type: "join"; senderID: string; docID: string; savedState: Uint8Array }
    | {
    type: "joinReply";
    targetID: string;
    docID: string;
    savedState: Uint8Array;
};

export type MessageType = Message['type'];