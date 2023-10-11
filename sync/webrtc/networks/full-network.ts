import {ConnectionDirection} from "./network.js";
import {BaseNetwork} from "./base-network.js";

export class FullNetwork extends BaseNetwork {

    constructor(me: string, users: string[]) {
        super(me, users);
    }

    updateUsers(users: string[]) {
        for (let user of users) {
            if (this.users.has(user))
                continue;
            this.users.set(user, {
                direction: (user > this.me) ? ConnectionDirection.out : ConnectionDirection.in,
                connected: false
            });
        }
    }
}