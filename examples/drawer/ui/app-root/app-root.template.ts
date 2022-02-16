import {ITemplate} from "@cmmn/ui";
import {DrawingFigureJson, Mode} from "../drawer/types";

export const template: ITemplate<IState, IEvents> = (html, state, events) => html`
    <app-drawer name="drawer" 
                mode=${state.mode} 
                @add=${events.add(x => x.detail)}
                items=${state.Items}/>
    <menu style="z-index: 1; position: absolute;">
        <button .mode=${Mode.line} ?active=${state.mode == Mode.line} onclick=${events.changeMode(e => e.target.mode)}>Line</button>
        <button .mode=${Mode.point} ?active=${state.mode == Mode.point} onclick=${events.changeMode(e => e.target.mode)}>Point</button>
        <button .mode=${Mode.polygone} ?active=${state.mode == Mode.polygone} onclick=${events.changeMode(e => e.target.mode)}>Poly</button>
    </menu>
`;

export type IState = {
    mode: Mode;
    Items: DrawingFigureJson[];
}

export type IEvents = {
    changeMode(mode: Mode);
    add(item: DrawingFigureJson);
}
