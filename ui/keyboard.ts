import {EventListener} from "@cmmn/core";

export class KeyboardListener extends EventListener<{
    keydown: KeyboardEvent,
    keyup: KeyboardEvent,
    keypress: KeyboardEvent,
}> {

}

export const Keyboard = new KeyboardListener(document);
