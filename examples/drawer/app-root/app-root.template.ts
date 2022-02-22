import {ITemplate} from "@cmmn/ui";
import {ObservableList, ObservableMap} from "cellx-collections";
import {DrawingFigureJson, Mode} from "../drawer/types";

export const template: ITemplate<IState, IEvents> = (html, state, events) => state ? html`
    <app-drawer name="drawer"></app-drawer>
    <menu >
        <button .mode=${Mode.line} ?active=${state.mode == Mode.line}
                onclick=${events.changeMode(e => e.target.mode)}>Line
        </button>
        <button .mode=${Mode.point} ?active=${state.mode == Mode.point}
                onclick=${events.changeMode(e => e.target.mode)}>Point
        </button>
        <button .mode=${Mode.polygone} ?active=${state.mode == Mode.polygone}
                onclick=${events.changeMode(e => e.target.mode)}>Poly
        </button>

        ${state.selected?.length ? html.for('delete')`
            <button onclick=${events.deleteSelected()}>Del
            </button>
        ` : ''}
        <input/>
    </menu>
` : html``;

export type IState = {
    mode: Mode;
    selected: DrawingFigureJson[];
}

export type IEvents = {
    deleteSelected();
    changeMode(mode: Mode);
}
