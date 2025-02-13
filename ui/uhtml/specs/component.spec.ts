import { parseHTML } from 'linkedom';
import * as global from 'linkedom';
import { describe, test, mock } from 'node:test';
import * as assert from 'node:assert';
import { bind, EventListener } from '@cmmn/core';

const x = parseHTML(`<!doctype html><html lang="en"></html>`);
Object.assign(globalThis, global);
globalThis.customElements = x.customElements;
globalThis.document = x.document;
globalThis.window = x.window;
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 40);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

describe('component', async () => {
	const { Component, component, property, html, svg } = await import(
		'../index'
	);

	await test('hello-world', async () => {
		@component()
		class HelloWorld extends Component {
			@property()
			accessor subTitle: string = 'World';

			render() {
				return html`<span>Hello ${this.subTitle}</span>`;
			}
		}

		const el = x.document.createElement('hello-world') as HelloWorld;
		x.document.appendChild(el);
		await EventListener.onceAsync(el, 'render');
		assert.equal(el.innerText, 'Hello World');
		el.subTitle = 'Hole';
		await EventListener.onceAsync(el, 'render');
		assert.equal(el.innerText, 'Hello Hole');
		el.setAttribute('sub-title', 'friend');
		await EventListener.onceAsync(el, 'render');
		assert.equal(el.innerText, 'Hello friend');
		// assert.equal(el.getAttribute('title'), 'World');
	});

	await test('listener', async () => {
		@component()
		class MyClicker extends Component {
			@bind()
			onClick(e: MouseEvent) {
				this.dispatchEvent(new Event('my-click'));
			}

			render() {
				return html`
                    <button @click="${this.onClick}">Click me</button>`;
			}
		}

		const el = x.document.createElement('my-clicker') as MyClicker;
		x.document.appendChild(el);
		await EventListener.onceAsync(el, 'render');
		const fn = mock.fn();
		el.addEventListener('my-click', fn);
		el.querySelector('button').click();
		assert.equal(fn.mock.callCount(), 1);
	});

	await test('injection', async () => {
		@component()
		class MyInjector extends Component {
			render() {
				return html`
                    <div>
                        ${this.injectedChildren}
                    </div>
                `;
			}
		}

		const el = x.document.createElement('my-injector') as MyInjector;
		const span = document.createElement('span');
		el.appendChild(span);
		x.document.appendChild(el);
		await EventListener.onceAsync(el, 'render');
		assert.equal(el.firstElementChild.firstElementChild, span);
	});

	await test('classes', async () => {
		@component()
		class MyClasses extends Component {
			render() {
				return html`
                    <div class=${[{ one: true, two: false }, 'three']} style=${{
											background: 'red',
											color: 'white',
										}}/>
                `;
			}
		}

		const el = x.document.createElement('my-classes');
		x.document.appendChild(el);
		await EventListener.onceAsync(el, 'render');
		const div = el.firstElementChild as HTMLDivElement;
		assert.equal(div.getAttribute('class'), 'one three');
		assert.equal(div.style.background, 'red');
		assert.equal(div.style.color, 'white');
	});
});
