import { expect, suite, test } from "@cmmn/tools/test";
import { bufferCount, concatMap, filter, map, pairwise, pipe, take, toArray } from '../src'
import { timer } from "./timer";
import { takeUntil } from "../src/operators/takeUntil";
import { share } from "../src";
import { skip } from "../src";
import { after, before } from "node:test";
import { checkEventTargets, mockEventTarget } from "./mockEventTarget";

// before(mockEventTarget);
// after(checkEventTargets);

@suite
export class OperatorSpec {

  @test
  async take(){
    const array = await toArray(take(5)(timer(1)));
    expect(array).toEqual([0,1,2,3,4]);
  }

  @test
  async skip(){
    const array = await toArray(take(5)(skip(3)(timer(1))));
    expect(array).toEqual([3,4,5,6,7]);
  }

  @test
  async map(){
    const array = await toArray(pipe(timer(1),
        map<number>(x => 2 ** x),
        take<number>(5)
    ));
    expect(array).toEqual([1,2,4,8,16]);
  }

  @test
  async takeUntil(){
    const st = share<number>()(timer(1));
    const five = filter<number>(x => x == 5)(st);
    const array = await toArray(takeUntil(five)(st));
    expect(array).toEqual([0, 1, 2, 3, 4, 5]);
  }

  @test
  async concatMap(){
    const switched = concatMap<number>(
        x => take<number>(3)(timer(x + 1))
    )(take<number>(3)(timer(1)));
    const array = await toArray(switched);
    expect(array).toEqual([0,1,2,0,2,4,0,3,6]);
  }

  @test
  async pairwise(){
    const switched = pairwise()(timer(1));
    const array = await toArray(take(3)(switched));
    expect(array).toEqual([[0,1],[1,2], [2,3]]);
  }

  @test
  async bufferCount(){
    const switched = bufferCount(2)(timer(1));
    const array = await toArray(take(3)(switched));
    expect(array).toEqual([[0,1],[2,3],[4,5]]);
  }


}
