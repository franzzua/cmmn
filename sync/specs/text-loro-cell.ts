import {LoroCell} from "../src/crdt/loro-cell";

export class TextLoroCell extends LoroCell<string> {
    public text = this.doc.getText('value');

}


