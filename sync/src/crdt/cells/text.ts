import {LoroDoc, LoroText} from "loro-crdt";
import {BaseCell} from "@cmmn/core";
import {extend, LoroDocExtensions} from "./extend";

export class Text extends LoroText implements LoroDocExtensions<LoroText> {
	protected constructor(
		public readonly base: LoroText,
		public readonly doc: LoroDoc,
		public readonly commit: () => void,
	) {
		super();
	}
}
export function text(doc: LoroDoc, id: string): Text {
	const text = doc.getText(id);
	return extend(text, Text, doc);
}

BaseCell.addAdapter(LoroText, LoroText.prototype.subscribe);
