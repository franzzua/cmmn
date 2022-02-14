import {component, HtmlComponent, Pointer, property} from "@cmmn/ui";
import {IEvents, IState, template} from "./point-editor.template";
import style from "./point-editor.style.less";
import {Injectable} from "@cmmn/core";
import {PointItem} from "../../drawing.store";

@Injectable(true)
@component({name: 'point-editor', template, style})
export class PointEditorComponent extends HtmlComponent<IState, IEvents> {

    @property()
    private item!: PointItem;

    private get Hovered() {
        const position = Pointer.Position;
        if (!position)
            return false;
        if (position.x - this.item.figure.X > 3)
            return false;
        if (position.y - this.item.figure.Y > 3)
            return false;
        return true;
    }

    get State() {
        return {
            item: this.item,
            hovered: this.Hovered
        };
    }
}
