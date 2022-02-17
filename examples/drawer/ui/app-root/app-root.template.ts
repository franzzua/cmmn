import { Cell, ICellx } from "@cmmn/core";
import {ITemplate} from "@cmmn/ui";
import { ObservableList, ObservableMap } from "cellx-collections";
import {DrawingFigureJson, Mode} from "../drawer/types";

export const template: ITemplate<IState, IEvents> = (html, state, events) => html`
    <app-drawer name="drawer" 
                mode=${state.mode} 
                items=${state.items}/>
    <menu style="z-index: 1; position: absolute;">
        <button .mode=${Mode.line} ?active=${state.mode.get() == Mode.line} onclick=${events.changeMode(e => e.target.mode)}>Line</button>
        <button .mode=${Mode.point} ?active=${state.mode.get() == Mode.point} onclick=${events.changeMode(e => e.target.mode)}>Point</button>
        <button .mode=${Mode.polygone} ?active=${state.mode.get() == Mode.polygone} onclick=${events.changeMode(e => e.target.mode)}>Poly</button>
    </menu>
`;

export type IState = {
    mode: Cell<Mode>;
    items: ObservableMap<string, DrawingFigureJson>;
}

export type IEvents = {
    changeMode(mode: Mode);
}
