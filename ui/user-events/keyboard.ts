import {EventListener} from "@cmmn/core";

export class KeyboardListener extends EventListener<{
    keydown: KeyboardEvent,
    keyup: KeyboardEvent,
    keypress: KeyboardEvent,
}> {
    constructor(public element: HTMLElement | SVGElement) {
        super(document);
    }

}