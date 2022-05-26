import {BaseCell, CellState} from "./baseCell";

export class Actualizator {

    public static CurrentCell: BaseCell;
    private static CellsToActualize = new Set<BaseCell>();

    private static ResolvedPromise = Promise.resolve();
    public static Up(cell: BaseCell) {
        if (Actualizator.queue){
            Actualizator.queue.unshift(cell);
            return;
        }
        Actualizator.CellsToActualize.add(cell);
        Actualizator.wait ??= Actualizator.ResolvedPromise.then(Actualizator.UpAll);
    }
    private static queue: Array<BaseCell>;
    public static UpAll() {
        Actualizator.queue = Array.from(Actualizator.CellsToActualize);
        Actualizator.wait = null
        while (Actualizator.queue.length) {
            const cell = Actualizator.queue.pop();
            Actualizator.Down(cell);
        }
        Actualizator.CellsToActualize.clear();
        Actualizator.queue = null;
    }

    public static Down(cell: BaseCell) {
        if (cell.state == CellState.Actual)
            return;
        const oldDependencies = cell.dependencies;
        cell.dependencies = null;
        if (Actualizator.CurrentCell === cell)
            throw new Error('cyclical pull');
        const prevCell = Actualizator.CurrentCell;
        Actualizator.CurrentCell = cell;
        try {
            cell.set(cell.pull());
        } catch (e) {
            cell.setError(e);
        }
        Actualizator.CurrentCell = prevCell;
        if (oldDependencies) {
            for (let oldDependency of oldDependencies) {
                if (cell.dependencies?.has(oldDependency))
                    continue;
                oldDependency.removeReaction(cell);
            }
        }
        cell.state = CellState.Actual;
    }

    static wait: Promise<void>;

    /* @internal */
    static imCalled(cell: BaseCell) {
        if (!Actualizator.CurrentCell)
            return;
        Actualizator.CurrentCell.addDependency(cell);
        cell.addReaction(Actualizator.CurrentCell);
    }
}
