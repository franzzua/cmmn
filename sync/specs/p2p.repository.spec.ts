import { after, afterEach, beforeEach, describe, mock, test } from 'node:test';
import { InMemoryP2PNode } from './inMemoryP2PNode';
import { expect } from '@cmmn/tools/test';
import {CRDT, P2PNode } from '../src';
import {Cell, Container, di, Fn} from '@cmmn/core';
import { P2PRepository } from '../src';
import { StorageProvider } from '../src';
import { InMemoryStorage } from './inMemoryStorage';

describe('p2p-repo', () => {
	let contexts: Container[] = [];
	let repos: P2PRepository[] = [];
	di.override(P2PNode, InMemoryP2PNode);
	di.const(StorageProvider, InMemoryStorage.Provider);
	beforeEach(() => {
		contexts = [di.child(), di.child(), di.child()];
		repos = contexts.map((c) => c.resolve(P2PRepository, 'values'));
	});
	afterEach(async () => {
		for (let repo of repos) {
			await repo[Symbol.asyncDispose]();
		}
		for (let context of contexts) {
			await context[Symbol.asyncDispose]();
		}
	});
	after(async () => {
		await di[Symbol.asyncDispose]();
		await InMemoryP2PNode.root[Symbol.asyncDispose]();
	});

	test('peers', async () => {
		await using doc1 = repos[0].createDoc('1');
		await using doc2 = repos[1].createDoc('1');
		const t1 = doc1.getShaped(CRDT.text);
		const t2 = doc2.getShaped(CRDT.text);
		t1.insert(0, 'A');
		t1.commit();
		await new Cell(t2).onceAsync('change');

		expect(t2.toString()).toBe('A');
		await using doc3 = repos[2].createDoc('1');
		const t3 = doc3.getShaped(CRDT.text);
		await new Cell(t3).onceAsync('change');
		expect(t3.toString()).toEqual('A');
	});
});
