import { afterEach, beforeEach, describe, mock, test } from 'node:test';
import { InMemoryP2PNode } from './inMemoryP2PNode';
import { P2PNode } from '../src';

describe('p2p', () => {
	let nodes: P2PNode[] = [];

	beforeEach(() => {
		nodes = [new InMemoryP2PNode(), new InMemoryP2PNode()];
	});
	afterEach(async () => {
		for (let node of nodes) {
			await node[Symbol.asyncDispose]();
		}
	});

	// test('peers', async () => {
	// 	await Promise.all(nodes.map((x) => x.init));
	// 	expect(nodes[0].peers.size).toBe(1);
	// 	expect(nodes[1].peers.size).toBe(1);
	// });
	//
	// test('add-peer', async () => {
	// 	await Promise.all(nodes.map((x) => x.init));
	// 	const listener = mock.fn();
	// 	Cell.OnChange(() => nodes[0].peers, listener);
	// 	nodes.push(new InMemoryP2PNode());
	// 	await nodes[2].init;
	// 	expect(listener.mock.calls).toHaveLength(1);
	// });
});
