import {di} from "@cmmn/core";
import {P2PNode} from "@cmmn/sync";
import {MainP2PNode} from "./src/mainP2PNode.ts";
import {CounterRepository} from "./src/counter-repository.ts";
import {CounterModel} from "./src/counterModel.ts";

di.override(P2PNode, MainP2PNode);
export {
	CounterRepository, CounterModel
}