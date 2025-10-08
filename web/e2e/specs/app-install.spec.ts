import {ElementHandle, expect as expectBase, Page, test as testBase} from "@playwright/test";
import {type PwaInstallApi} from "@cmmn/service-worker/client";

const test = testBase.extend<{app: AppInstallPage}>({
	async app({ page }, use){
		await page.goto('pages/sw.html');
		const appPage =  new AppInstallPage(page);
		await use(appPage);
	}
});

class AppInstallPage {
	api: ElementHandle<PwaInstallApi>;
	constructor(private page: Page, ) {
	}

	async init(preventPrompt = false){
		this.api = await this.page.evaluateHandle(async preventPrompt => {
			// @ts-ignore
			const { PwaInstallApi } = await import('/_/@cmmn/service-worker/client');
			return new PwaInstallApi(preventPrompt);
		}, preventPrompt);
	}

	async expectInitialized(value: boolean){
		const isInitialized = await this.invoke(a => a.isInitialized)
		expect(isInitialized).toBe(value);
	}
	async prompt(){
		await this.invoke(a => a.prompt());
	}

	async invoke<T>(fn: (api: PwaInstallApi) => Promise<T> | T){
		return await this.page.evaluate<T>(fn, this.api);
	}
}

const expect = expectBase.extend({

})

test('init', async ({ page, app }) => {
	await app.init();
	await app.expectInitialized(false);
	await app.prompt();
});

