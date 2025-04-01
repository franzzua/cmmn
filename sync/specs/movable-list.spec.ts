import {describe, test} from "node:test";
import {IMovableList, updateMovableList} from "../src/crdt/update-movable-list";
import {expect} from "@cmmn/tools/test";

describe('movable-list', () => {
	test('add', () => check([1], [2, 1]));
	test('del', () => check([1, 2, 3], [1, 3]));
	test('add-del', () => check([1, 2], [2, 3]));
	test('move', () => check([1, 2, 3], [1, 3, 2]));
	test('move-del', () => check([1, 2, 3], [3, 2]));
	test('all-1', () => check([1, 2, 3], [3, 4, 2]));
	test('all-2', () => check([1, 2, 3 ,4, 5, 8], [6, 3, 5, 4, 8, 2, 4, 1]));
	test('all-3', () => check([1, 2, 3 ,4, 5, 8], [6, 3, 1]));
})

function check(arr1: number[], arr2: number[]) {
	console.log('from', arr1, 'to', arr2)
	const ml = new MovableList(arr1);
	updateMovableList(ml, arr2);
	expect(arr2).toEqual(ml.toArray());
}

class MovableList<T> implements IMovableList<T> {
	constructor(private arr: T[]) {
	}

	get(index: number): T {
		return this.arr[index];
	}

	indexOf(t: T, fromIndex: number | undefined): number {
		return this.arr.indexOf(t, fromIndex);
	}

	insert(index: number, value: T) {
		this.arr.splice(index, 0, value);
		console.log('insert', index, value, this.arr);
	}

	get length() {
		return this.arr.length;
	}

	toArray(): T[] {
		return this.arr;
	}

	delete(index: number, count: number) {
		this.arr.splice(index, count);
		console.log('delete', index, count, this.arr);
	}

	move(from: number, to: number) {
		const removed = this.arr.splice(from, 1);
		this.arr.splice(to, 0, ...removed);
		console.log('move', from, to, this.arr);
	}

	push(value: T) {
		this.arr.push(value);
		console.log('push', value, this.arr);
	}
}