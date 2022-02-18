import {component, ExtendedElement, HtmlComponent} from "@cmmn/ui";
import {IEvents, IState, template} from "./app-root.template";
import style from "./app-root.style.less";
import {Injectable} from "@cmmn/core";
import {Mode} from "../drawer/types";
import {AppDrawerComponent} from "../drawer";
import {Computed} from "cellx-decorators";
import {StoreFactory} from "../services/store.factory";

@Injectable(true)
@component({name: 'app-root', template, style})
export class AppRootComponent extends HtmlComponent<IState, IEvents> implements IEvents {

    constructor(private storeFactory: StoreFactory) {
        super();
    }

    protected store = this.storeFactory.getStore('default')

    @Computed
    get drawer() {
        if (this.$render.get() == 0)
            return null;
        return (this.element.children.namedItem('drawer') as ExtendedElement<AppDrawerComponent>)?.component;
    }

    get State() {
        if (!this.store.IsSynced)
            return null;
        return {
            mode: this.drawer?.Mode,
            selected: this.drawer?.services?.selection?.SelectedItems.map(x => x.toJson()),
            items: this.store.Items,
        }
    }

    changeMode(mode: Mode) {
        if (this.drawer.Mode == Mode.line) {
            this.drawer.create();
        } else {
            this.drawer.services.creator.cancel();
        }
        if (this.drawer.Mode == mode) {
            this.drawer.Mode = Mode.idle;
        } else {
            this.drawer.Mode = mode;
        }
    }
    deleteSelected(){
        this.drawer.services.selection.deleteSelected();
    }


}

