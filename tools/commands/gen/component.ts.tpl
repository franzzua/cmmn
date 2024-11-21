import {component, HtmlComponent, property} from "@cmmn/ui";
import {template, IState, IEvents} from "./$name$.template";
import style from "./$name$.style.less";
import {Injectable} from "@cmmn/core";

@Injectable(true)
@component({name: '$name$', template, style})
export class $Name$Component extends HtmlComponent<IState, IEvents> {

    @property()
    private property!: any;

    get State() {
        return this.property;
    }
}
