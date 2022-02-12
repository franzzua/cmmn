import {LineItem} from "../drawing.store";

export class LinePresentor {

    private root = document.createElementNS("http://www.w3.org/2000/svg", "g");

    constructor(private item: LineItem) {
    }

    private create<TElement extends SVGElement>(name): TElement {
        const el = document.createElementNS('http://www.w3.org/2000/svg', name);
        this.root.appendChild(el);
        return el;
    }

    render() {
        const existedPoints = Array.from(this.root.querySelectorAll('circle'));
        this.item.figure.forEach((point,i) => {
            const existed = existedPoints.splice(i, 1)[0] ?? this.create('circle');
            existed.setAttribute('r', '3');
            existed.setAttribute('cx', point.X.toString());
            existed.setAttribute('cy', point.Y.toString());
        })
        const existedLines = Array.from(this.root.querySelectorAll('line'));
        this.item.figure.slice(1)
            .map((p, i) => ([p, this.item.figure[i]]))
            .forEach((pair, i) => {
                const existed = existedLines.splice(i, 1)[0] ?? this.create('line');
                existed.setAttribute('x1', pair[0].X.toString());
                existed.setAttribute('y1', pair[0].Y.toString());
                existed.setAttribute('x2', pair[1].X.toString());
                existed.setAttribute('y2', pair[1].Y.toString());
            });
        return this.root;
    }
}
