import {Fn, inject} from "@cmmn/core";
import {Transport} from "./transport/transport";

const quorumChannel = 'quorum';
export class Quorum implements Disposable {
    @inject(Transport<QuorumMessage>) transport!: Transport<QuorumMessage>;
    public id = Fn.uuid();

    private users = new Set<string>([this.id]);
    leader: string = this.id;

    private getLeader(){
        let max: string | undefined = undefined;
        for (let user of this.users) {
            if (!max || user > max) max = user;
        }
        return max;
    }

    public get isLeader(){
        return this.id === this.leader;
    }

    private unsubscribe =  this.transport.on(quorumChannel, e => {
        switch (e.type){
            case QuorumMessageType.enter:
                this.users.add(e.id);
                break;
            case QuorumMessageType.exit:
                this.users.delete(e.id);
                break;
        }
        this.leader = this.getLeader();
    });

    constructor() {
        this.transport.send(quorumChannel, {
            id: this.id,
            type: QuorumMessageType.enter
        });
    }

    [Symbol.dispose](): void {
        this.unsubscribe();
    }
}

export type QuorumMessage = {
    id: string;
    type: QuorumMessageType;
}
enum QuorumMessageType {
    enter,
    exit,
}