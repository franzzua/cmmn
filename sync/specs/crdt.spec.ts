import {Cell, Fn} from '@cmmn/core';
import { describe, test, mock } from 'node:test';
import { expect } from '@cmmn/tools/test';
import { InMemoryP2PNode } from './inMemoryP2PNode';
import {CRDT, LoroDocCell} from "../src";
import {LoroCounter} from "loro-crdt/nodejs";
import {Counter, List} from "../src/crdt/cells";
import {Infer} from "../src/crdt/cells/types";

describe('crdt', () => {
	test('text', async function text() {
		const doc = new LoroDocCell();
		const source = doc.getModel(CRDT.text);
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
	test('counter', async function text() {
		const doc = new LoroDocCell();
		const source = doc.getModel(CRDT.counter);
		expect(source.value).toEqual(0);
		source.increment(3);
		expect(source.value).toEqual(3);
		source.value = 6
		expect(source.value).toEqual(6);
		source.commit();
		const onChange = mock.fn();
		Cell.OnChange(() => source, onChange);
		source.value = 7;
		await Fn.asyncDelay(0);
		expect(onChange.mock.callCount()).toEqual(1);
	});

	test('list', async function text() {
		const doc = new LoroDocCell();
		const source = doc.getModel(CRDT.list<number>());
		expect(source.toArray()).toEqual([]);
		source.push(3);
		expect(source.toArray()).toEqual([3]);
		source.commit();
		const onChange = mock.fn();
		Cell.OnChange(() => source, onChange);
		source.delete(0, 1);
		source.commit();
		await Fn.asyncDelay(0);
		expect(onChange.mock.callCount()).toEqual(1);
		expect(source.toArray()).toEqual([]);
	});

	test('list of counters', async function text() {
		const doc = new LoroDocCell();
		const source: List<{
			counter: Counter;
		}> = doc.getModel(CRDT.list({counter: CRDT.counter}));
		expect(source.toArray()).toEqual([]);
		source.push();
		expect(source.toArray().map(x => x.counter.value)).toEqual([0]);
		expect(source.toArray()[0].counter).toBeInstanceOf(LoroCounter);
		const c = source.toArray()[0].counter;
		c.value = 3;
		expect(source.toArray().map(x => x.counter.value)).toEqual([3]);
		source.push();
		source.move(0, 1);
		source.commit();
		expect(source.toArray().map(x => x.counter.value)).toEqual([0, 3]);
	});
});
