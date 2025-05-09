import {LoroDocCell, LoroDocExtensions} from "./loro-doc-cell";
import {LoroText} from "loro-crdt";
import {BaseCell} from "@cmmn/core";


export function text(docCell: LoroDocCell, id: string): Text {
	const text = docCell.doc.getText(id);
	return docCell.extend<TextExtensions, LoroText>(
		text,
		{
			id: id
		}
	);
}

export type TextExtensions = {
	id: string;
}

export type Text = LoroDocExtensions<LoroText> & TextExtensions;

BaseCell.addAdapter(LoroText, LoroText.prototype.subscribe);
