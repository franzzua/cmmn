import {ITemplate} from "@cmmn/ui";
import {Mode} from "../drawer/types";

export const template: ITemplate<IState, IEvents> = (html, state, events) => html`
    <app-drawer mode=${state.mode}/>
    <menu style="z-index: 1; position: absolute;">
        <button .mode=${Mode.line} ?active=${state.mode == Mode.line} onclick=${events.changeMode(e => e.target.mode)}>Line</button>
        <button .mode=${Mode.point} ?active=${state.mode == Mode.point} onclick=${events.changeMode(e => e.target.mode)}>Point</button>
        <button .mode=${Mode.polygone} ?active=${state.mode == Mode.polygone} onclick=${events.changeMode(e => e.target.mode)}>Poly</button>
    </menu>
`;

export type IState = {
    mode: Mode
}

export type IEvents = {
    changeMode(mode: Mode);
}
