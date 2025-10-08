import {di} from "@cmmn/core";
import {P2PNode} from "@cmmn/sync";
import {MainP2PNode} from "./src/mainP2PNode";
import {CounterRepository} from "./src/counter-repository";
import {CounterModel} from "./src/counterModel";

di.override(P2PNode, MainP2PNode);
export {
	CounterRepository, CounterModel
}