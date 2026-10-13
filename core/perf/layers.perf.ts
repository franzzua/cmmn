/**
 * Port of the cellx "layers" benchmark (master: cell/perf/perf.html) to the current @cmmn/core cells,
 * with jotai (latest, v3) for comparison.
 *
 * Every layer has 4 cells depending on the previous layer:
 *   prop1 = prev.prop2
 *   prop2 = prev.prop1 - prev.prop3
 *   prop3 = prev.prop2 + prev.prop4
 *   prop4 = prev.prop3
 * Every cell is subscribed, then all 4 source cells are changed and the last layer is read.
 *
 * run: node --expose-gc --import @cmmn/tools/import core/perf/layers.perf.ts [layers...] [--runs=N]
 */
import { atom, createStore, type PrimitiveAtom, type Atom } from 'jotai/vanilla';
import { BaseCell, Cell } from '../cell';
import { Graph } from '../cell/graph';

type Values = [number, number, number, number];
type Report = { build: number; recalc: number; before: Values; after: Values };
type Test = (layerCount: number) => Promise<Report>;

const start: Values = [1, 2, 3, 4];
const change: Values = [4, 3, 2, 1];

function cmmn(CellClass: typeof BaseCell): Test {
	return async (layerCount) => {
		const t0 = performance.now();
		const first = start.map((x) => new CellClass<number>(x));
		let layer = first;
		for (let i = layerCount; i--; ) {
			const [p1, p2, p3, p4] = layer;
			layer = [
				new CellClass(() => p2.get()),
				new CellClass(() => p1.get() - p3.get()),
				new CellClass(() => p2.get() + p4.get()),
				new CellClass(() => p3.get()),
			];
			for (const c of layer) c.on('change', () => {});
			for (const c of layer) c.get();
		}
		const end = layer;
		const read = () => end.map((c) => c.get()) as Values;
		const t1 = performance.now();
		const before = read();

		globalThis.gc?.(); // don't bill build garbage to recalc
		const t2 = performance.now();
		first.forEach((c, i) => c.set(change[i]));
		await Graph.wait;
		const after = read();
		const t3 = performance.now();
		return { build: t1 - t0, recalc: t3 - t2, before, after };
	};
}

const jotai: Test = async (layerCount) => {
	const t0 = performance.now();
	const store = createStore();
	const first = start.map((x) => atom(x)) as PrimitiveAtom<number>[];
	let layer: Atom<number>[] = first;
	for (let i = layerCount; i--; ) {
		const [p1, p2, p3, p4] = layer;
		layer = [
			atom((get) => get(p2)),
			atom((get) => get(p1) - get(p3)),
			atom((get) => get(p2) + get(p4)),
			atom((get) => get(p3)),
		];
		for (const a of layer) store.sub(a, () => {});
		for (const a of layer) store.get(a);
	}
	// one write atom, so jotai recomputes dependents once for all 4 sources (cmmn batches them in a microtask)
	const setAll = atom(null, (_, set) => first.forEach((a, i) => set(a, change[i])));
	const end = layer;
	const read = () => end.map((a) => store.get(a)) as Values;
	const t1 = performance.now();
	const before = read();

	globalThis.gc?.(); // don't bill build garbage to recalc
	const t2 = performance.now();
	store.set(setAll);
	const after = read();
	const t3 = performance.now();
	return { build: t1 - t0, recalc: t3 - t2, before, after };
};

// naive getters: no caching, so it is exponential — only run on small graphs
const vanilla: Test = async (layerCount) => {
	const t0 = performance.now();
	const first = { prop1: start[0], prop2: start[1], prop3: start[2], prop4: start[3] };
	let layer: typeof first = first;
	for (let i = layerCount; i--; ) {
		const prev = layer;
		layer = {
			get prop1() { return prev.prop2; },
			get prop2() { return prev.prop1 - prev.prop3; },
			get prop3() { return prev.prop2 + prev.prop4; },
			get prop4() { return prev.prop3; },
		};
	}
	const end = layer;
	const read = () => [end.prop1, end.prop2, end.prop3, end.prop4] as Values;
	const t1 = performance.now();
	const before = read();

	globalThis.gc?.(); // don't bill build garbage to recalc
	const t2 = performance.now();
	[first.prop1, first.prop2, first.prop3, first.prop4] = change;
	const after = read();
	const t3 = performance.now();
	return { build: t1 - t0, recalc: t3 - t2, before, after };
};

const tests: Record<string, Test> = {
	'cmmn BaseCell': cmmn(BaseCell),
	'cmmn Cell': cmmn(Cell as typeof BaseCell),
	jotai,
	vanilla,
};

const args = process.argv.slice(2);
const runs = +(args.find((x) => x.startsWith('--runs='))?.split('=')[1] ?? 10);
const layerCounts = args.filter((x) => !x.startsWith('--')).map(Number);
if (!layerCounts.length) layerCounts.push(10, 100, 1000, 5000);

const median = (xs: number[]) => xs.toSorted((a, b) => a - b)[xs.length >> 1];
const fmt = (x: number) => x.toFixed(3).padStart(10);

for (const layers of layerCounts) {
	console.log(`\nlayers: ${layers}, runs: ${runs} (median ms)`);
	console.log(`${'library'.padEnd(16)}${'build'.padStart(10)}${'recalc'.padStart(10)}  before -> after`);
	for (const [name, test] of Object.entries(tests)) {
		if (name === 'vanilla' && layers > 20) continue;
		const reports: Report[] = [];
		try {
			await test(Math.min(layers, 10)); // warmup
			for (let i = 0; i < runs; i++) {
				globalThis.gc?.();
				reports.push(await test(layers));
			}
		} catch (e) {
			console.log(`${name.padEnd(16)}failed: ${e}`);
			continue;
		}
		const { before, after } = reports[0];
		console.log(
			`${name.padEnd(16)}${fmt(median(reports.map((r) => r.build)))}${fmt(median(reports.map((r) => r.recalc)))}  [${before}] -> [${after}]`,
		);
	}
}
