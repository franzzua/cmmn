import {Cell, Fn} from '@cmmn/core';
import { describe, test, mock } from 'node:test';
import { expect } from '@cmmn/tools/test';
import { InMemoryP2PNode } from './inMemoryP2PNode';
import {CRDT, LoroDocCell} from "../src";

describe('crdt', () => {
	test('text', async function text() {
		const doc = new LoroDocCell();
		const source = doc.getShaped(CRDT.text);
		source.insert(0, 'Hello');
		source.insert(5, ' world!');
		source.commit();
		expect(source.toString()).toEqual('Hello world!');
		const onChange = mock.fn();
		source.delete(11, 1);
		Cell.OnChange(() => source, onChange);
		source.doc.commit();
		await Fn.asyncDelay(0);
		expect(onChange.mock.callCount()).toEqual(1);
		expect(source.toString()).toEqual('Hello world');
	});
	//
	// test('p2p', async function p2p() {
	// 	const nodes = [new InMemoryP2PNode(), new InMemoryP2PNode()];
	// 	const docs = [new LoroDocCell(), new LoroDocCell()];
	// 	const texts = docs.map(cell => cell.getShaped(CRDT.text));
	// 	texts[0].insert(0, 'H');
	// 	texts[0].commit();
	// 	await InMemoryP2PNode.connect(nodes);
	// 	const syncs = [] as AsyncDisposable[];
	// 	for (let i = 0; i < 2; i++) {
	// 		syncs.push(await docs[i].syncP2P(nodes[i], 'ch'));
	// 	}
	// 	try {
	// 		await Fn.asyncDelay(10);
	// 		expect(texts[1].toString()).toEqual('H');
	//
	// 		texts[1].insert(1, 'e');
	// 		texts[1].commit();
	// 		await Fn.asyncDelay(10);
	// 		expect(texts[0].toString()).toEqual('He');
	// 	} finally {
	// 		for (let sync of syncs) {
	// 			await sync[Symbol.asyncDispose]();
	// 		}
	// 		for (let node of nodes) {
	// 			await node[Symbol.asyncDispose]();
	// 		}
	// 	}
	// });
});
