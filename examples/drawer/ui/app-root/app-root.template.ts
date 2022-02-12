import {ITemplate} from "@cmmn/ui";

export const template: ITemplate<IState, IEvents> = (html, state, events) => html`
    <app-drawer/>
`;

export type IState = {}

export type IEvents = {}
