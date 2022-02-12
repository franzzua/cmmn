import {component, HtmlComponent, property} from "@cmmn/ui";
import {template, IState, IEvents} from "./app-root.template";
import style from "./app-root.style.less";
import {Injectable} from "@cmmn/core";

@Injectable(true)
@component({name: 'app-root', template, style})
export class AppRootComponent extends HtmlComponent<IState, IEvents> {

    @property()
    private property!: any;

    get State() {
        return this.property;
    }
}
