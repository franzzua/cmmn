import { attr } from 'uhtml';

attr.set('style', (el: HTMLElement, value) => {
	Object.assign(el.style, value);
});
