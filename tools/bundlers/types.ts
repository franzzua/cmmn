import {Bundle} from "../model/bundle.ts";

export interface IBundler {
    bundle(): Promise<Bundle>;
}