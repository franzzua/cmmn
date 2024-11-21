import {BaseCell} from './base-cell.js';

export class Graph {

    public static CurrentCell: BaseCell;

    private static CellsToActualize = new Set<BaseCell>();
    private static queue: Array<BaseCell>;
    private static ResolvedPromise = Promise.resolve(); // to add a microtask
    public static wait: Promise<void>; // await Actualizator.wait; -> to wait for the updated cells to be updated

    public static Up(cell: BaseCell) {
        if (Graph.queue) { // IF the cell update occurred as part of a microtask UpAll
            if (!Graph.queue.includes(cell)) {
                Graph.queue.unshift(cell);
            }
            return;
        }
        Graph.CellsToActualize.add(cell);
        Graph.wait ??= Graph.ResolvedPromise.then(Graph.UpAll);
    }

    public static UpAll() {
        Graph.queue = Array.from(Graph.CellsToActualize);
        Graph.CellsToActualize.clear();
        Graph.wait = null;
        while (Graph.queue.length) {
            const cell = Graph.queue.pop();
            Graph.Down(cell);
        }
        Graph.queue = null;
    }

    public static Down(cell: BaseCell) {
        if (cell.isActual)
            return;
        const oldDependencies = cell.dependencies;
        cell.dependencies = null;
        const prevCell = Graph.CurrentCell;
        Graph.CurrentCell = cell;
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
        Graph.CurrentCell = prevCell;
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
        if (!Graph.CurrentCell)
            return;
        Graph.CurrentCell.addDependency(cell);
        cell.addReaction(Graph.CurrentCell);
    }

}
