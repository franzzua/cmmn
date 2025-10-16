import {Pack} from "../model/pack";
import {IBundler} from "./types";
import {Target} from "../model/target";
import {ViteBundler} from "./vite.bundler";
import {RolldownBundler} from "./rolldown-bundler";
import {Resolver} from "../model/resolver";

export function createBundler(pack: Pack, resolver: Resolver): IBundler {
    if (pack instanceof Target)
        return new ViteBundler(pack, resolver);
    return new RolldownBundler(pack, resolver)
}