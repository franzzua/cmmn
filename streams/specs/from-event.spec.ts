import { expect, sinon, suite, test } from "@cmmn/tools/test";
import { from } from '../src/sources/from'

@suite
export class FromEventSpec {


  @test
  async shouldUnsubscribeOnBreak(){
    const et = new EventTarget();
    const onChange = sinon.spy();
    const spy = sinon.spy();
    et.removeEventListener = spy;
    const ai = from<Event>(et, "change");
    setTimeout(() => et.dispatchEvent(new Event("change")), 10);
    setTimeout(() => ai.return(null), 20);
    for await (let event of ai) {
      onChange(event);
    }
    expect(onChange.calledOnce).toBeTruthy();
    expect(spy.calledOnce).toBeTruthy();
  }


  @test
  async shouldUnsubscribeOnThrow(){
    const et = new EventTarget();
    const onChange = sinon.spy();
    const spy = sinon.spy();
    et.removeEventListener = spy;
    const ai = from<Event>(et, "change");
    setTimeout(() => et.dispatchEvent(new Event("change")), 10);
    try{
      for await (let event of ai) {
        onChange(event);
        throw new Error();
      }
    } catch (e) {
      expect(onChange.calledOnce).toBeTruthy();
      expect(spy.calledOnce).toBeTruthy();
    }
  }
}