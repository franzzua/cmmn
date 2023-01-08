import {Network} from "./network";
import {FullNetwork} from "./fullNetwork";

export function networkFactory(me:string, users: string[]): Network{
    return new FullNetwork(me, users);
}