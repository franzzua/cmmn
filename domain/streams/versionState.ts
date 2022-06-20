import {EventEmitter, EventEmitterBase, Fn, ResolvablePromise} from "@cmmn/core";
import {BaseCell, Cell, cell, ICellOptions} from '@cmmn/cell';
import { ModelLike } from "../shared/types";

/**
 * Есть два состояния одной сущности - в воркере и в мейне. Они должны быть одинаковыми (consistency),
 * но из-за времени пересылки это невозможно. Поэтому добиваемся Eventual Consistency - состояния могут
 * различаться, но если перестать менять, то придут к единому.
 *
 * Реализуется через last-write-wins register: в воркере и в мейне есть версии. Чья больше - тот и прав.
 * Но немного упрощаем - версия генерится только в мейн, и:
 *  1. При обновлении состояния со стороны мейна увеличиваем версию, сохраняем и отправляем в воркер.
 *  2. Когда пришло из воркера, то смотрим - это ответ на старое сообщение или на последнее.
 *     Если на старое, то неинтересно. Если на последнее - то обновляем.
 *
 * Поэтому большой поток diff, например, изменения названия слайда, можем хранить прямо в proxy.State (см. ModelProxy#set State())
 * Он будет всегда актуальный и не будут попадаться старые состояния.
 */
export class VersionState<T> extends Cell<T> {
    @cell
    remoteVersion: string;
    @cell
    localVersion: string;
    @cell
    localState: T;
    @cell
    remoteState: T;
    public waitLoaded = new ResolvablePromise<void>();
    private isLoaded: boolean;

    constructor(options: ICellOptions<T>) {
        super(() => {
            if (this.localVersion && this.remoteVersion < this.localVersion)
                return this.localState;
            return this.remoteState;
        }, options);
    }

    public up() {
        // this.localVersion = Fn.ulid();
    }

    setRemote(version: string, state: T) {
        this.remoteState = state;
        this.remoteVersion = version;
        if (!this.isLoaded){
            this.waitLoaded.resolve();
        }
    }

    setLocal(value: T){
        this.localState = value;
        this.localVersion = Fn.ulid();
    }

    LinkRemote(model: ModelLike<T, any>) {
        Cell.OnChange(() => model.State, event => this.setRemote(Fn.ulid(), event.value));
        this.setRemote(Fn.ulid(), model.State);
    }
}
