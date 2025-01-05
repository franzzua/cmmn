import {LoroCell} from "./loro-cell";

export class TextLoroCell extends LoroCell<string> {
    public text = this.doc.getText('value');

}


