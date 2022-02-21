import {IPoint} from "@cmmn/ui";


export type BezierInput = Array<IPoint> | {
    length: number;
    get(index): IPoint;
} | Array<[x: number, y: number]>;

export class Bezier {

    constructor(private input: BezierInput) {
    }

    private getter = Bezier.getGetter(this.input);
    private controls = Array.from(this.getControlPoints(this.input.length, this.getter));

    /**
     * Generates svg-path string like M {...} C {...} S {...}
     * Complexity: O(N), about 4ms for 1k points
     */
    public toString() {
        // const controls = this.getControlPoints(this.input.length, this.getter);
        const first = this.getter(0);
        let result = 'M' + first.X + ' ' + first.Y;
        const c1 = this.controls[0];
        const c2 = this.controls[1];
        const p1 = this.getter(1);
        result += 'C' + c1.X + ' ' + c1.Y + ' ' + c2.X + ' ' + c2.Y + ' ' + p1.X + ' ' + p1.Y;
        for (let i = 2; i < this.input.length; i++) {
            const control = this.controls[i];
            const p = this.getter(i);
            result += 'S' + control.X + ' ' + control.Y + ' ' + p.X + ' ' + p.Y;
        }
        return result;
    }

    /**
     * Checks if point is near bezier with maxDistance
     * @param point
     * @param maxDistance
     */
    public checkHover(point: IPoint, maxDistance: number): [number, number] | null {
        for (let i = 0; i < this.input.length - 1; i++) {
            if (this.checkSegmentHover(point, maxDistance, i))
                return [i, i + 1];
        }
        return null;
    }

    /**
     * Checks if point is near bezier with maxDistance
     * @param point
     * @param maxDistance
     */
    public checkSegmentHover(point: IPoint, maxDistance: number, segment: number) {
        const a = this.getter(segment);
        const d = this.getter(segment + 1);
        const c = this.controls[segment + 1];
        const b = segment === 0 ? this.controls[0] : ((a, segment) => {
            const x = this.controls[segment];
            return {
                X: 2 * a.X - x.X,
                Y: 2 * a.Y - x.Y,
            }
        })(a, segment);

        function getIntervals(a, b, c, d, value): [number, number][] {
            // x1*t3+x2*t2+x3*t+x4 == 0
            const x1 = -a + 3 * b - 3 * c + d;
            const x2 = 3 * a - 6 * b + 3 * c;
            const x3 = -3 * a + 3 * b;
            const x4 = a - value;
            const shift1 = x1 < 0 ? -maxDistance : maxDistance;
            const roots1 = solveCubic(x1, x2, x3, x4 + shift1).sort();
            const roots2 = solveCubic(x1, x2, x3, x4 - shift1).sort();

            if (roots1.length == 0 || roots1.length > 3)
                throw new Error(`cubic equation has ${roots1.length} roots`);
            if (roots2.length == 0 || roots2.length > 3)
                throw new Error(`cubic equation has ${roots2.length} roots`);

            function checkExtremum(t: number) {
                // x1*t3+x2*t2+x3*t+x4 == 0
                // 3x1*t2+2x2*t+x3 = 0
                const derivation = 3 * x1 * t * t + 2 * x2 * t + x3;
                return Math.abs(derivation) < 1E-8;
            }

            if (roots1.length == 2) {
                roots1.removeAll(checkExtremum);
            }
            if (roots2.length == 2) {
                roots2.removeAll(checkExtremum);
            }
            // у первой 1-2 корня, значит у второй только 1
            if (roots1.length == 1 && roots2.length == 1)
                return [[roots1[0], roots2[0]]];
            if (roots1.length == 1 && roots2.length == 3)
                return [[roots1[0], roots2[0]], [roots2[1], roots2[2]]];
            // у второй 1-2 корня
            if (roots2.length == 1)
                return [[roots1[0], roots1[1]], [roots1[2], roots2[roots2.length - 1]]];

            return [[roots1[0], roots2[0]], [roots2[1], roots1[1]], [roots1[2], roots2[2]]];
        }

        function intersectIntervals(a: [number, number], b: [number, number]): [number, number] | null {
            const res = [Math.max(a[0], b[0]), Math.min(a[1], b[1])] as [number, number];
            if (res[0] > res[1])
                return null;
            return res;
        }

        const xIntervals = getIntervals(a.X, b.X, c.X, d.X, point.X).map(x => intersectIntervals(x, [0, 1])).filter(x => x != null);
        const yIntervals = getIntervals(a.Y, b.Y, c.Y, d.Y, point.Y).map(x => intersectIntervals(x, [0, 1])).filter(x => x != null);

        for (let xInterval of xIntervals) {
            for (let yInterval of yIntervals) {
                if (intersectIntervals(xInterval, yInterval))
                    return true;
            }
        }
        // if (roots1.length > 1 || roots2.length > 1)
        return false;
    }

    private static getGetter(input: BezierInput): (index: number) => IPoint {
        if ('get' in input)
            return index => input.get(index);
        if (Array.isArray(input)) {
            if (Array.isArray(input[0])) {
                return index => ({X: input[index][0], Y: input[index][1]});
            } else {
                return index => input[index] as IPoint;
            }
        }
        throw new Error(`Input not supported: ${input}`);
    }

    /**
     * Generator of Bezier-control points
     * For first segment returns two control points: [p0 c01 c10 p1]
     * For other segments only one control point: [p1 ... c21 p2]
     * Supposed that first control point on segments is opposite to previous.
     * So c12 = p1 + (p1 - c10)
     * @param input
     */
    public getControls(input: BezierInput): IterableIterator<IPoint> {
        return this.getControlPoints(input.length, this.getter);
    }

    private* getControlPoints(length: number, getter: (index) => IPoint): IterableIterator<IPoint> {
        const xControls = computeControlPoints(length, index => getter(index).X);
        const yControls = computeControlPoints(length, index => getter(index).Y);
        for (let i = 0; i < length; i++) {
            const x = xControls.next().value;
            const y = yControls.next().value;
            yield {X: x, Y: y};
        }
    }
}

function* computeControlPoints(length: number, get: (i: number) => number): IterableIterator<number> {
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

function solveCubic(a: number, b: number, c: number, d: number): number[] {
    if (Math.abs(a) < 1e-8) { // Quadratic case, ax^2+bx+c=0
        a = b;
        b = c;
        c = d;
        if (Math.abs(a) < 1e-8) { // Linear case, ax+b=0
            a = b;
            b = c;
            if (Math.abs(a) < 1e-8) // Degenerate case
                return [];
            return [-b / a];
        }

        var D = b * b - 4 * a * c;
        if (Math.abs(D) < 1e-8)
            return [-b / (2 * a)];
        else if (D > 0)
            return [(-b + Math.sqrt(D)) / (2 * a), (-b - Math.sqrt(D)) / (2 * a)];
        return [];
    }

    // Convert to depressed cubic t^3+pt+q = 0 (subst x = t - b/3a)
    const p = (3 * a * c - b * b) / (3 * a * a);
    const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
    let roots;

    if (Math.abs(p) < 1e-8) { // p = 0 -> t^3 = -q -> t = -q^1/3
        roots = [Math.cbrt(-q)];
    } else if (Math.abs(q) < 1e-8) { // q = 0 -> t^3 + pt = 0 -> t(t^2+p)=0
        roots = [0].concat(p < 0 ? [Math.sqrt(-p), -Math.sqrt(-p)] : []);
    } else {
        const D = q * q / 4 + p * p * p / 27;
        if (Math.abs(D) < 1e-8) {       // D = 0 -> two roots
            roots = [-1.5 * q / p, 3 * q / p];
        } else if (D > 0) {             // Only one real root
            const u = Math.cbrt(-q / 2 - Math.sqrt(D));
            roots = [u - p / (3 * u)];
        } else {                        // D < 0, three roots, but needs to use complex numbers/trigonometric solution
            const u = 2 * Math.sqrt(-p / 3);
            const t = Math.acos(3 * q / p / u) / 3;  // D < 0 implies p < 0 and acos argument in [-1..1]
            const k = 2 * Math.PI / 3;
            roots = [u * Math.cos(t), u * Math.cos(t - k), u * Math.cos(t - 2 * k)];
        }
    }

    // Convert back from depressed cubic
    for (let i = 0; i < roots.length; i++)
        roots[i] -= b / (3 * a);

    return roots;
}