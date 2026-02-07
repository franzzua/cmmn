import { test, mock, describe } from 'node:test';
import * as assert from 'node:assert';
import { debounce, throttle, throttled } from '../helpers';
import { Fn } from '../helpers';
import { EventEmitter } from '../event-emitter';
import { getThrottler } from '../helpers/throttle';
import { expect } from '@cmmn/tools/test';

describe('debounce', (ctx) => {
	test('timing', async () => {
		const fn = mock.fn();
		const debounced = debounce(fn, 100);
		debounced();
		await Fn.asyncDelay(10);
		debounced();
		await Fn.asyncDelay(10);
		debounced();
		await Fn.asyncDelay(110);
		debounced();
		await Fn.asyncDelay(110);
		assert.equal(fn.mock.callCount(), 2);
	});

	test('output', async () => {
		const fn = (a, b) => a + b;
		const t = throttle(fn, 10);
		const result1 = t(1, 2);
		const result2 = t(1, 2);
		assert.equal(result1, result2);
		assert.equal(await result1, 3);
	});
});
describe('throttle', (ctx) => {
	test('timinig', async () => {
		const fn = mock.fn();
		const throttled = throttle(fn, 100);
		throttled();
		await Fn.asyncDelay(60);
		throttled();
		await Fn.asyncDelay(70);
		throttled();
		await Fn.asyncDelay(110);
		throttled();
		await Fn.asyncDelay(110);
		assert.equal(fn.mock.callCount(), 3);
	});

	test('output', async () => {
		function fn(a: number, b: number) {
			return a + b;
		}
		const t = throttle(fn, 10);
		const result1 = t(1, 2);
		const result2 = t(1, 2);
		assert.equal(result1, result2);
		assert.equal(await result1, 3);
		assert.equal(await result2, 3);
	});
	test('select', async () => {
		function sum(a: number, b: number) {
			return a + b;
		}
		const t = throttle(sum, 10, {
			select: (...args) => [
				args.map(([a, b]) => a).reduce(sum),
				args.map(([a, b]) => b).reduce(sum),
			],
		});
		const result1 = t(1, 2);
		const result2 = t(3, 4);
		assert.equal(result1, result2);
		assert.equal(await result1, 10);
	});

	test('class', async () => {
		class A {
			constructor(private value = 0) {}

			@throttled(10)
			async increment() {
				return ++this.value;
			}

			get() {
				return this.value;
			}
		}

		const a = new A();
		const p = [a.increment(), a.increment(), a.increment()];

		assert.equal(a.get(), 0);
		await Fn.asyncDelay(20);
		assert.equal(a.get(), 1);
		assert.equal(new Set(p).size, 1);
		assert.equal(await p[0], 1);
		await Fn.asyncDelay(20);
	});
});
