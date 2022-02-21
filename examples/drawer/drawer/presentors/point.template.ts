import {Const} from "../const";
import {Renderable, TemplateFunction, IPoint} from "@cmmn/ui";

export function PointTemplate(svg: TemplateFunction<Renderable>, point: IPoint, {selected, hovered}): Renderable {
    if (svg.cache) {
        const cached = svg.cache as SVGGElement;
        cached.transform.baseVal[0].setTranslate(point.X, point.Y);
        if (hovered) {
            (cached.firstElementChild as SVGCircleElement).classList.add('stroke');
        } else {
            (cached.firstElementChild as SVGCircleElement).classList.remove('stroke');
        }
        if (selected) {
            (cached.lastElementChild as SVGCircleElement).classList.add('fill');
            (cached.lastElementChild as SVGCircleElement).classList.remove('stroke');
        } else {
            (cached.lastElementChild as SVGCircleElement).classList.remove('fill');
            (cached.lastElementChild as SVGCircleElement).classList.add('stroke');
        }
        return cached;
    }
    return svg`
        <g class="drawer-point" transform=${`translate(${point.X}, ${point.Y})`}>
            <circle class=${hovered ? 'stroke' : ''}
                    r=${Const.pointRadiusBig}/>
                    
            <circle class=${selected ? 'fill' : 'stroke'}
                    r=${Const.pointRadius}/>
        </g>
    `;
}

export type IState = {
    point: IPoint;
    selected: boolean;
    hovered: boolean;
}

export type IEvents = {}
