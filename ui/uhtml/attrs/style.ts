import {attr} from 'uhtml';

attr.set('style', setStyleByCssText);


function setStyleByCssText(el: HTMLElement, value: object) {
	let style = "";
	for (let key in value) {
		style += key + ':' + value[key] + ';'
	}
	el.style.cssText = style;
}