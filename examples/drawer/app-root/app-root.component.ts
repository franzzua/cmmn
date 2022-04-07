import {component, ExtendedElement, HtmlComponent} from "@cmmn/ui";
import {IEvents, IState, template} from "./app-root.template";
import style from "./app-root.style.less";
import {bind, Injectable} from "@cmmn/core";
import {DrawingFigureJson, Mode} from "../drawer/types";
import {AppDrawerComponent} from "../drawer";
import {IFactory, ModelProxy, proxy} from "@cmmn/domain/proxy";
import {DrawingFigure, DrawingFigureFactory} from "../drawer/model";
import {ObservableMap} from "cellx-collections";
import { Computed } from "cellx-decorators";

@Injectable(true)
@component({name: 'app-root', template, style})
export class AppRootComponent extends HtmlComponent<IState, IEvents> implements IEvents {

    constructor(private factory: IFactory) {
        super();
    }

    protected store = this.factory.Root as any;

    @Computed
    get drawer() {
        if (this.$render.get() == 0)
            return null;
        return (this.element.children.namedItem('drawer') as ExtendedElement<AppDrawerComponent>)?.component;
    }

    get State() {
        if (!this.drawer)
            return {mode: Mode.idle, selected: []};
        return {
            mode: this.drawer?.Mode,
            selected: Array.from(this.drawer?.services?.selection?.getSelectedItems()??[]).map(x => x.toJson()),
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

    deleteSelected() {
        this.drawer.services.selection.deleteSelected();
    }

    private get Items() {
        return this.drawer && this.drawer.services.store.Items;
    }

    @HtmlComponent.effect()
    subscribe() {
        this.store.$state.onChange(this.onRemoteChange);
        this.onRemoteChange({data: {value: this.store.State ?? []}});
        this.Items?.onChange(this.onLocalChange);
    }

    disconnectedCallback() {
        this.store.$state.offChange(this.onRemoteChange);
        this.Items.offChange(this.onLocalChange);
        super.disconnectedCallback();
    }


    @bind
    private async onRemoteChange(event) {
        if (this.muteRemote)
            return;
        const arr = event.data.value as DrawingFigureJson[];
        if (!this.Items) {
            this.drawer.services.store.Items = new ObservableMap(arr.map(x => [x.id, DrawingFigureFactory(x)]));
            return;
        }
        const keys = new Set(this.Items.keys());
        for (let json of arr) {
            keys.delete(json.id);
            if (this.Items.has(json.id)) {
                this.Items.get(json.id).fromJson(json);
            } else {
                const figure = DrawingFigureFactory(json);
                if (figure.isValid())
                    this.Items.set(json.id, figure);
            }
        }
        keys.forEach(key => this.Items.delete(key));
    }
    private muteRemote = false;

    @bind
    private async onLocalChange(event) {
        this.muteRemote = true;
        const value = event.data.value as DrawingFigure;
        switch (event.data.subtype) {
            case "add":
            case "update":
                await this.store.Actions.AddOrUpdate(value.toJson());
                break;
            case "delete":
                await this.store.Actions.Delete(event.data.key);
                break;
        }
        this.muteRemote = false;
    }

}

@proxy.of(Object)
export class DrawingProxy extends ModelProxy<DrawingFigureJson[], {
    AddOrUpdate(item: DrawingFigureJson);
    Delete(id: string);
}> {

}
