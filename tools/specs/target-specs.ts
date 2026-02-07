import {describe, test} from "node:test";
import {Target} from "../model/target";
import {Flags} from "../model/flags";
import {expect} from "expect";
import {fileURLToPath} from "node:url";
import {Monorepo} from "../model/monorepo";

describe('target', async function target() {
    const monorepo = await Monorepo.load();
	const targets = monorepo.packs;
	const map = new Map(targets.map(x => [x.packageJson.name, x]));
	await describe('@cmmn/core', function (){
		const target = map.get('@cmmn/core');
		test('entries', function (){
			expect(target.entries).toHaveLength(1);
			const entry = target.getEntry("");
			expect(entry.name).toBe("");
			expect(entry.source).toBe(fileURLToPath(import.meta.resolve("@cmmn/core")));
			expect(entry.relative).toBe("index.ts");
			expect(entry.output).toBe("index.js");
			expect(entry.isExcluded).toBe(false);
			expect(entry.isHTML).toBe(false);
			expect(entry.isJavaScript).toBe(false);
			expect(entry.isTypeScript).toBe(true);
		});
	});
	await describe('@cmmn/uhtml', function (){
		const target = map.get('@cmmn/uhtml');
		test('entries', function (){
			expect(target.entries).toHaveLength(1);
			const entry = target.getEntry("");
			expect(entry.name).toBe("");
			expect(entry.source).toBe(fileURLToPath(import.meta.resolve("@cmmn/uhtml")));
			expect(entry.relative).toBe("index.ts");
			expect(entry.output).toBe("index.js");
			expect(entry.isExcluded).toBe(false);
			expect(entry.isHTML).toBe(false);
			expect(entry.isJavaScript).toBe(false);
			expect(entry.isTypeScript).toBe(true);
		});
	});

	await describe('@cmmn/service-worker', function (){
		const target = map.get('@cmmn/service-worker');
        for (let entryName of ['client', 'worker']) {
            test(entryName, function (){
                const entry = target.getEntry(entryName);
                expect(entry.name).toBe(entryName);
                expect(entry.source).toBe(fileURLToPath(import.meta.resolve(`@cmmn/service-worker/${entryName}`)));
                expect(entry.relative).toBe(`${entryName}/index.ts`);
                expect(entry.output).toBe(`${entryName}.js`);
                expect(entry.isExcluded).toBe(false);
                expect(entry.isHTML).toBe(false);
                expect(entry.isJavaScript).toBe(false);
                expect(entry.isTypeScript).toBe(true);
            });
        }
	});

	await describe('@cmmn/examples-client', function (){
		const target = map.get('@cmmn/examples-client');
		test('entries', function (){
			expect(target.entries).toHaveLength(1);
			const entry = target.getEntry("");
			expect(entry.name).toBe("");
			expect(entry.source).toBe(fileURLToPath(import.meta.resolve("@cmmn/examples-client")));
			expect(entry.relative).toBe("src/index.html");
			expect(entry.output).toBe("index.html");
			expect(entry.isExcluded).toBe(false);
			expect(entry.isHTML).toBe(true);
			expect(entry.isJavaScript).toBe(false);
			expect(entry.isTypeScript).toBe(false);
		});
	});

	await describe('@cmmn/examples-counter', function (){
		const target = map.get('@cmmn/examples-counter');
		test('entries', function (){
			expect(target.entries).toHaveLength(1);
			const entry = target.getEntry("");
			expect(entry.name).toBe("");
			expect(entry.source).toBe(fileURLToPath(import.meta.resolve("@cmmn/examples-counter")));
			expect(entry.relative).toBe("index.html");
			expect(entry.output).toBe("index.html");
			expect(entry.isExcluded).toBe(false);
			expect(entry.isHTML).toBe(true);
			expect(entry.isJavaScript).toBe(false);
			expect(entry.isTypeScript).toBe(false);
		});
	});

	await describe('@cmmn/ui', function (){
		const target = map.get('@cmmn/ui');
		test('entries', function (){
			expect(target.entries).toHaveLength(1);
			const entry = target.getEntry("");
			expect(entry.name).toBe("");
			expect(entry.source).toBe(fileURLToPath(import.meta.resolve("@cmmn/ui")));
			expect(entry.relative).toBe("index.ts");
			expect(entry.output).toBe("index.js");
			expect(entry.isExcluded).toBe(false);
			expect(entry.isHTML).toBe(false);
			expect(entry.isJavaScript).toBe(false);
			expect(entry.isTypeScript).toBe(true);
		});
	});
});