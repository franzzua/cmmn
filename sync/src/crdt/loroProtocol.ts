import {LoroJoinMessage, LoroMessage, LoroMessageType, LoroRequestMessage, LoroUpdateMessage} from "./loro.message";
import {EventEmitter} from "@cmmn/core";

export abstract class LoroProtocol<PeerId = unknown> extends EventEmitter<{
    [LoroMessageType.Update]: LoroUpdateMessage & LoroProtocolMessage<PeerId>;
    [LoroMessageType.Join]: LoroJoinMessage & LoroProtocolMessage<PeerId>;
    [LoroMessageType.Request]: LoroRequestMessage & LoroProtocolMessage<PeerId>;
}> implements AsyncDisposable{

    protected onMessage(message: LoroMessage, from: PeerId, topic: string) {

        const messageWithReply = Object.assign(message, {
            reply: (message: LoroMessage) => this.send(from.toString(), message),
            from,
            topic
        }) as LoroMessage & LoroProtocolMessage<PeerId>
        switch (messageWithReply.type) {
            case LoroMessageType.Update:
                this.emit(LoroMessageType.Update, messageWithReply);
                break;
            case LoroMessageType.Join:
                this.emit(LoroMessageType.Join, messageWithReply);
                break;
            case LoroMessageType.Request: {
                this.emit(LoroMessageType.Request, messageWithReply);
                break;
            }
        }
    }

    public abstract send(topic: string, message: LoroMessage);

    abstract join(topic: string): void;

    abstract leave(topic: any): void;
    abstract [Symbol.asyncDispose](): Promise<void>;
}

type LoroProtocolMessage<PeerId> = {
    topic: string;
    from: PeerId;
    reply(message: LoroMessage): Promise<void | unknown>;
}