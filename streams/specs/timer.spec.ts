import { expect, suite, test } from "@cmmn/tools/test";
import { before, after } from "node:test";
import { timer } from "./timer";
import { pipe, take } from "../src";
import { share } from "../src";
import { toArray } from "../src";
import { checkEventTargets, mockEventTarget } from "./mockEventTarget";


before(mockEventTarget);
after(checkEventTargets);
@suite
export class TimerSpec {

  @test
  async timer(){
    let i = 0;
    for await (const time of timer(1)){
      expect(i++).toEqual(time);
      if (i > 5) break;
    }
    i = 0;
    for await (const time of timer(2)){
      expect(i).toEqual(time);
      i+=2;
      if (i > 5) break;
    }
  }

  @test
  async useTwice(){
    let i = 0;
    const nn = timer(1);
    for await (const time of nn){
      expect(i++).toEqual(time);
      if (i > 5) break;
    }
    for await (const time of nn){
      expect(i++).toEqual(time);
      if (i > 10) break;
    }
  }

  @test
  async useTwiceParallel(){
    let i = 0;
    const nn = timer(1);
    await Promise.all([
      (async () => {
        for await (const time of nn){
          expect(i++).toEqual(time);
          if (i > 5) break;
        }
      })(),
      (async () => {
        for await (const time of nn) {
          expect(i++).toEqual(time);
          if (i > 10) break;
        }
      })()
    ]);
  }

  @test
  async useTwiceParallel2(){
    const t = timer(1);
    const [a1, a2] = await Promise.all([
      toArray(pipe(t, take(5))),
      toArray(pipe(t, take(5))),
    ]);
    expect(a1).toEqual([0,2,4,6,8]);
    expect(a2).toEqual([1,3,5,7,9]);
  }

  @test
  async share(){
    const t = share<number>()(timer(1));
    let i = 0;
    for await (const time of t){
      expect(i++).toEqual(time);
      if (i > 5) break;
    }
  }

  @test
  async shareParallel(){
    const t = share<number>()(timer(1));
    const [a1, a2] = await Promise.all([
      toArray(pipe(t, take(5))),
      toArray(pipe(t, take(5))),
    ]);
    expect(a1).toEqual([0,1,2,3,4]);
    expect(a2).toEqual([0,1,2,3,4]);
  }

}