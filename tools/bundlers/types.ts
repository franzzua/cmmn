import {Bundle} from "../model/bundle";

export interface IBundler {
    bundle(): Promise<Bundle>;
}