import {EventEmitter, EventEmitterBase} from '@cmmn/core';
import {Actualizator} from './actualizator.js';

export class BaseCell<T = any> extends EventEmitter<{
    change: { value: T, oldValue: T },
    error: Error,
}> {

    /** @internal **/
    pull: () => T;
    value: T;
    error: Error;
    dependencies: Set<BaseCell<any>>; // cells on which this cell depends
    private reactions: Set<BaseCell<any>>; // cells dependent on this cell
    isPulling = false;
    isActive = false;
    isActual: boolean;
    // debug = getDebugName(/BaseCell|Cell/);

    constructor(value: T | (() => T)) {
        super();
        if (typeof value === "function") {
            this.pull = value as () => T;
            this.isActual = false;
        } else {
            this.value = value;

            this.isActual = true;
        }
    }

    public get(): T {
        if (this.isPulling) {
            throw new CyclicalPullError(this);
        }
        Actualizator.imCalled(this);
        if (this.isActive && !this.isActual) {
            Actualizator.Down(this);
        }
        if (this.isActual){
            if (this.error)
                throw this.error;
            return this.value;
        }
        return this.pull();
    }

    /** @internal **/
    public setInternal(value: T) {
        if (this.compare(value))
            return;
        this.update(value);
    }

    public set(value: T) {
        this.setInternal(value);
        this.isActual = true;
    }

    protected onValueContentChanged = (change) => {
        this.update(this.value); // e.g. adding a new element to ObservableMap
    }

    public setError(error: Error) {
        this.update(undefined, error);
    }

    /**
     * Called when only one of the changes has occurred:
     *  - cell value changed;
     *  - OR the content of the cell value has changed;
     *  - OR an error has occurred.
     */
    protected update(value: T, error?: Error) {
        this.error = error;
        const oldValue = this.value;
        this.value = value;
        if (this.isActive) {
            this.isActual = true;
        }
        if (oldValue !== value) {
            if (oldValue instanceof EventEmitterBase) {
                oldValue.off('change', this.onValueContentChanged);
            }
            if (value instanceof EventEmitterBase) {
                value.on('change', this.onValueContentChanged);
            }
        }
        if (error)
            this.emit('error', error);
        else
            this.notifyChange(value, oldValue);
        if (this.reactions) {
            for (let reaction of this.reactions) {
                reaction.isActual = false;
                Actualizator.Up(reaction);
            }
        }
    }

    protected compare(value: T) {
        return Object.is(value, this.value);
    }

    protected notifyChange(value: T, oldValue: T) {
        this.emit('change', {value, oldValue});
        if (this.isActive && value !== oldValue){
            if (BaseCell.isLikeCell(value)) {
                value.on('change', this.onValueContentChanged);
            }
            if (BaseCell.isLikeCell(oldValue)) {
                oldValue.off('change', this.onValueContentChanged);
            }
        }
    }

    active() {
        this.isActive = true;
        if (BaseCell.isLikeCell(this.value)) {
            this.value.on('change', this.onValueContentChanged);
        }
    }

    protected disactive() {
        this.isActive = false;
        if (BaseCell.isLikeCell(this.value)) {
            this.value.off('change', this.onValueContentChanged);
        }
        if (this.dependencies) {
            for (let dependency of this.dependencies) {
                dependency.removeReaction(this)
            }
            this.dependencies = null;
        }
        if (this.pull) {
            this.isActual = false;
        }
    }

    protected subscribe(eventName: keyof { change: T }) {
        if (eventName == 'change' && !this.isActive) {
            this.active();
            Actualizator.Down(this);
        }
    }

    protected unsubscribe(eventName: keyof { change: T }) {
        if (eventName == 'change' && this.isActive && !this.reactions)
            this.disactive();
    }

    addDependency(cell: BaseCell) {
        this.dependencies ??= new Set();
        this.dependencies.add(cell);
    }

    addReaction(cell: BaseCell) {
        this.reactions ??= new Set();
        this.reactions.add(cell);
        if (!this.isActive && cell.isActive)
            this.active();
    }

    removeReaction(cell: BaseCell) {
        if (!this.reactions)
            return;
        this.reactions.delete(cell);
        if (!this.reactions.size) {
            this.reactions = null;
            if (this.isActive && !this.listeners.get('change')?.length)
                this.disactive();
        }
    }

    /** @internal **/
    // register classes as cell like, so any "change" event will notify wrapped cell
    static likeCells = new Set<any>([EventEmitterBase]);
    static isLikeCell(target): target is EventEmitterBase<{"change": any}>{
        for (let likeCell of BaseCell.likeCells) {
            if (target instanceof likeCell)
                return true;
        }
        return false;
    }
}

// export const CellState = {
//     // value is actual
//     Actual: true,
//     // value is not actual, maybe will update
//     Dirty: false,
// }

export class CyclicalPullError extends Error {
    constructor(public cell: BaseCell) {
        super('cyclical pull');
    }
}
