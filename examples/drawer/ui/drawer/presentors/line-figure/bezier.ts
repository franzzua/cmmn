import {IPoint} from "@cmmn/ui";


export type BezierInput = Array<IPoint> | {
    length: number;
    get(index): IPoint;
} | Array<[x: number, y: number]>;

export class Bezier {

    /**
     * Generates svg-path string like M {...} C {...} S {...}
     * Complexity: O(N), about 4ms for 1k points
     */
    public static getString(input: Array<[x: number, y: number]>)
    public static getString(input: Array<IPoint>)
    public static getString(input: {
        length: number;
        get(index): IPoint;
    })
    public static getString(input: BezierInput) {
        const getter = this.getGetter(input);
        const controls = this.getControlPoints(input.length, getter);
        const first = getter(0);
        let result = `M${first.X} ${first.Y}`
        const c1 = controls.next().value;
        const c2 = controls.next().value;
        const p1 = getter(1);
        result += ['C', c1.X, c1.Y, c2.X, c2.Y, p1.X, p1.Y].join(' ');
        for (let i = 2; i < input.length; i++) {
            const control = controls.next().value;
            const p = getter(i);
            result += ['S', control.X, control.Y, p.X, p.Y].join(' ')
        }
        return result;
    }

    private static getGetter(input: BezierInput): (index: number) => IPoint{
        if ('get' in input)
            return index => input.get(index);
        if (Array.isArray(input)){
            if (Array.isArray(input[0])){
                return index => ({X: input[index][0], Y: input[index][1]});
            }else{
                return index => input[index] as IPoint;
            }
        }
        throw new Error(`Input not supported: ${input}`);
    }

    private static arrayGetter = (array: IPoint[]) => i => array[i];
    private static otherGetter = (array: { get(index): IPoint }) => i => array.get(i);

    /**
     * Generator of Bezier-control points
     * For first segment returns two control points: [p0 c01 c10 p1]
     * For other segments only one control point: [p1 ... c21 p2]
     * Supposed that first control point on segments is opposite to previous.
     * So c12 = p1 + (p1 - c10)
     * @param input
     */
    public static getControls(input: BezierInput): IterableIterator<IPoint> {
        const getter = this.getGetter(input);
        return this.getControlPoints(input.length, getter);
    }

    private static* getControlPoints(length: number, getter: (index) => IPoint): IterableIterator<IPoint> {
        const xControls = this.computeControlPoints(length, index => getter(index).X);
        const yControls = this.computeControlPoints(length, index => getter(index).Y);
        for (let i = 0; i < length; i++) {
            const x = xControls.next().value;
            const y = yControls.next().value;
            yield {X: x, Y: y};
        }
    }

    private static* computeControlPoints(length: number, get: (i: number) => number): IterableIterator<number> {
        const p1 = [];
        const n = length - 1;

        /* rhs vector */
        const a = [];
        const b = [];
        const c = [];
        const r = [];

        /* left most segment */
        a[0] = 0;
        b[0] = 2;
        c[0] = 1;
        r[0] = get(0) + 2 * get(1);

        /* internal segments */
        for (let i = 1; i < n - 1; i++) {
            a[i] = 1;
            b[i] = 4;
            c[i] = 1;
            r[i] = 4 * get(i) + 2 * get(i + 1);
        }

        /* right segment */
        a[n - 1] = 2;
        b[n - 1] = 7;
        c[n - 1] = 0;
        r[n - 1] = 8 * get(n - 1) + get(n);

        /* solves Ax=b with the Thomas algorithm (from Wikipedia) */
        for (let i = 1; i < n; i++) {
            const m = a[i] / b[i - 1];
            b[i] = b[i] - m * c[i - 1];
            r[i] = r[i] - m * r[i - 1];
        }

        p1[n - 1] = r[n - 1] / b[n - 1];
        for (let i = n - 2; i >= 0; --i) {
            p1[i] = (r[i] - c[i] * p1[i + 1]) / b[i];
        }
        yield p1[0];

        /* we have p1, now compute p2 */
        for (let i = 0; i < n - 1; i++) {
            yield 2 * get(i + 1) - p1[i + 1];
        }

        yield 0.5 * (get(n) + p1[n - 1]);
    }
}