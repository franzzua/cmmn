import {Network} from "./network.js";
import {FullNetwork} from "./full-network.js";
import {MultiCircleNetwork} from "./circle-network.js";

export function networkFactory(me:string, users: string[]): Network{
    if (users.length < 10){
        return new FullNetwork(me, users);
    }
    if (users.length < 1000){
        return new MultiCircleNetwork(me, users, 3);
    }
    return new MultiCircleNetwork(me, users, 5);
}