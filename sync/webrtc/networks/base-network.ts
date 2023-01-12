import {Connection, ConnectionDirection, Network} from "./network";
import {EventEmitter} from "@cmmn/core";

export abstract class BaseNetwork extends EventEmitter<{
    change: void;
}> implements Network {
    protected users = new Map<string, Connection>();

    public get map(): ReadonlyMap<string, Connection> {
        return this.users;
    }

    protected constructor(protected me: string, users: string[]) {
        super();
        this.updateUsers(users);
    }

    protected abstract updateUsers(users: string[]);

    isConnectedTo(user: string) {
        return this.users.get(user)?.connected;
    }

    setConnected(user: string, incoming: boolean): void {
        const connection = this.users.get(user);
        if ((connection.direction === ConnectionDirection.in) == incoming){
            connection.connected = true;
            this.emit('change')
        }else{
            throw new Error(`Wrong connection direction. Should be ${connection.direction}, but received ${incoming ? 'in' : 'out'}`);
        }
    }
    setDisconnected(user: string, incoming: boolean): void{
        const connection = this.users.get(user);
        if ((connection.direction === ConnectionDirection.in) == incoming){
            connection.connected = false;
            this.emit('change')
        }else{
            throw new Error(`Wrong connection direction. Should be ${connection.direction}, but received ${incoming ? 'in' : 'out'}`);
        }
    }
}