import {suite, test} from "@cmmn/tools/test";
import {Bezier} from "../drawer/presentors/line-figure/bezier";

@suite
export class BezierSpec {

    @test
    speedTest() {
        const avg = []
        for (let i = 0; i < 300; i += 10) {
            const points = new Array(10 + i * i).fill(0).map(() => ({
                X: Math.random(),
                Y: Math.random(),
            }));
            const time = performance.now();
            const str = Bezier.getString(points);
            const duration = performance.now() - time;
            avg.push(duration)
        }
        console.log(avg);
        // expect(controls).toHaveLength(points.length);
        // expect(control2).toHaveLength(2 * points.length - 2);
    }
}

[

]