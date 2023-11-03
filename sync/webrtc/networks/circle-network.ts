import {BaseNetwork} from "./base-network";
import {ConnectionDirection} from "./network";

/**
 * Connects every user to next {size} users and previous {size} users to him.
 */
export class MultiCircleNetwork extends BaseNetwork{

    constructor(me: string, users: string[], protected size: number) {
        super(me, users);
    }

    protected updateUsers(users: string[]) {
        const ordered = users.sort();
        let index = -1;
        for (let i = 0; i < ordered.length; i++){
            let user = ordered[i];
            if (user < this.me)
                index = i;
            this.users.set(user, {
                direction: ConnectionDirection.none,
                connected: false
            });
        }
        for (let i = 0; i <= this.size; i++){
            const left = ordered[(index - i) % ordered.length];
            const right = ordered[(index + i + 1) % ordered.length];
            this.users.get(left).direction = ConnectionDirection.in;
            this.users.get(right).direction = ConnectionDirection.out;
        }
    }

}