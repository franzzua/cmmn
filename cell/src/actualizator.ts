import {BaseCell} from './baseCell.js';

export class Actualizator {

    public static CurrentCell: BaseCell;

    private static CellsToActualize = new Set<BaseCell>();
    private static queue: Array<BaseCell>;
    private static ResolvedPromise = Promise.resolve(); // to add a microtask
    public static wait: Promise<void>; // await Actualizator.wait; -> to wait for the updated cells to be updated

    public static Up(cell: BaseCell) {
        if (Actualizator.queue) { // IF the cell update occurred as part of a microtask UpAll
            if (!Actualizator.queue.includes(cell)) {
                Actualizator.queue.unshift(cell);
            }
            return;
        }
        Actualizator.CellsToActualize.add(cell);
        Actualizator.wait ??= Actualizator.ResolvedPromise.then(Actualizator.UpAll);
    }

    public static UpAll() {
        Actualizator.queue = Array.from(Actualizator.CellsToActualize);
        Actualizator.CellsToActualize.clear();
        Actualizator.wait = null;
        while (Actualizator.queue.length) {
            const cell = Actualizator.queue.pop();
            Actualizator.Down(cell);
        }
        Actualizator.queue = null;
    }

    public static Down(cell: BaseCell) {
        if (cell.isActual)
            return;
        const oldDependencies = cell.dependencies;
        cell.dependencies = null;
        const prevCell = Actualizator.CurrentCell;
        Actualizator.CurrentCell = cell;
        let value, error;
        try {
            cell.isPulling = true;
            value = cell.pull();
        } catch (e) {
            error = e;
        }finally {
            cell.isPulling = false;
        }
        if (error) {
            cell.setError(error)
        } else {
            cell.setInternal(value);
        }
        Actualizator.CurrentCell = prevCell;
        if (oldDependencies) {
            for (let oldDependency of oldDependencies) {
                if (cell.dependencies?.has(oldDependency))
                    continue;
                oldDependency.removeReaction(cell);
            }
        }
    }

    /* @internal */
    static imCalled(cell: BaseCell) {
        if (!Actualizator.CurrentCell)
            return;
        Actualizator.CurrentCell.addDependency(cell);
        cell.addReaction(Actualizator.CurrentCell);
    }

}
