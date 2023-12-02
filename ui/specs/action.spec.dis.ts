/**
 * @jest-environment jsdom
 */
import {expect, sinon, suite, test} from "@cmmn/tools/test";
import {action, ActionSubscribeType} from "../extensions/action";
import {HtmlComponent} from "../component/htmlComponent";
import {GlobalStaticState} from "../component/component";
import {AnimationFrame} from "../user-events/animationFrameListener";
import {effect} from "../extensions/effect";

@suite
class HtmlComponentSpec {

    @test
    async checkTwoOnRender() {
        class Test extends HtmlComponent<any> {
            static Template = (html, state) => html`${state}`;
            count = 0;

            @action(() => null, ActionSubscribeType.OnFirstRender)
            onRender1(){
                this.count += 1;
            }

            @action(() => null, ActionSubscribeType.OnFirstRender)
            onRender2(){
                this.count += 1;
            }

            @effect()
            onEffect(){
                this.count += 1;
            }

            get State(){
                return 'Hi';
            }

        }
        // const element = Test.Extend<Test>(document.createElement('div'));
        // const t = element.component;
        // expect(t.count).toEqual(0);
        // document.body.appendChild(element);
        // await t.onceAsync('render');
        // expect(t.count).toEqual(3);
        // expect(element.textContent).toEqual(t.State);
        // const spy = sinon.spy();
        // t.on('dispose', spy);
        // document.body.removeChild(element);
        // await Promise.resolve();
        // expect(spy.callCount).toEqual(1);
    }

}