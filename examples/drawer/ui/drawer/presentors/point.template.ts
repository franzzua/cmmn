import {IPoint} from "../drawing.store";
import {Const} from "../const";

export function Point(svg, point: IPoint, {selected, hovered}) {
    return svg`
        <g class="drawer-point" transform=${`translate(${point.X}, ${point.Y})`}>
            <circle class=${hovered ? 'stroke' : 'none'}
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
