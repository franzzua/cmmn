import { LoroDocCell } from '../src';

export class TextLoroCell extends LoroDocCell<string> {
	public text = this.doc.getText('value');
}
