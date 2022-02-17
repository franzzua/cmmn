import {ITemplate} from "@cmmn/ui";
import {ObservableMap} from "cellx-collections";
import {DrawingFigureJson, Mode} from "../drawer/types";

export const template: ITemplate<IState, IEvents> = (html, state, events) => state ? html`
    <app-drawer name="drawer" items=${state.items}></app-drawer>
    <menu style="z-index: 1; position: absolute;">
        <button .mode=${Mode.line} ?active=${state.mode == Mode.line}
                onclick=${events.changeMode(e => e.target.mode)}>Line
        </button>
        <button .mode=${Mode.point} ?active=${state.mode == Mode.point}
                onclick=${events.changeMode(e => e.target.mode)}>Point
        </button>
        <button .mode=${Mode.polygone} ?active=${state.mode == Mode.polygone}
                onclick=${events.changeMode(e => e.target.mode)}>Poly
        </button>
    </menu>
` : html``;

export type IState = {
    mode: Mode;
    items: ObservableMap<string, DrawingFigureJson>;
}

export type IEvents = {
    changeMode(mode: Mode);
}
