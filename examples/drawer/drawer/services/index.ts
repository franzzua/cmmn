import {Container} from "@cmmn/core";
import {CreatorService} from "./creator.service";
import {HoverService} from "./hover.service";
import {SelectionService} from "./selection.service";
import {DragService} from "./drag.service";
import {MagnetismService} from "./magnetism.service";
import { DrawingStore } from "./drawing.store";
import {AppDrawerComponent} from "../app-drawer/app-drawer.component";
import { EditorService } from "./editor.service";
export {
    CreatorService,
    HoverService,
    SelectionService,
    DragService,
    MagnetismService,
    DrawingStore,
    EditorService
}


export const DrawingContainer = () => Container.withProviders(
    CreatorService,
    HoverService,
    SelectionService,
    DragService,
    MagnetismService,
    EditorService
)

export function services(appDrawer: AppDrawerComponent) {
    const store = new DrawingStore(appDrawer);
    const container = DrawingContainer();
    container.provide([{
        provide: DrawingStore, useValue: store
    }]);
    const creator = container.get<CreatorService>(CreatorService);
    const selection = container.get<SelectionService>(SelectionService);
    const hover = container.get<HoverService>(HoverService);
    const drag = container.get<DragService>(DragService);
    const magnet = container.get<MagnetismService>(MagnetismService);
    const editor = container.get<EditorService>(EditorService);
    return {
        creator,
        editor,
        selection,
        hover,
        drag,
        magnet,
        store
    }
}