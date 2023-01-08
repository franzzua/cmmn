import {Network} from "./network";

export class FullNetwork implements Network {
    private users = new Map<string, {
        connected: boolean;
    }>();

    public get map(): ReadonlyMap<string, { connected }> {
        return this.users;
    }

    constructor(private me: string, users: string[]) {
        this.updateUsers(users);

    }

    updateUsers(users: string[]) {
        for (let user of users) {
            if (this.users.has(user))
                continue;
            const connected = (user > this.me)
            this.users.set(user, {connected});
        }
    }

    isConnectedTo(user: string) {
        return this.users.get(user)?.connected;
    }
}