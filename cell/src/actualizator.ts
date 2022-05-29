import {BaseCell, CellState} from './baseCell';

export class Actualizator {

    public static CurrentCell: BaseCell;

    private static CellsToActualize = new Set<BaseCell>();
    private static queue: Array<BaseCell>;
    private static ResolvedPromise = Promise.resolve(); // для добавления микрозадачи
    public static wait: Promise<void>; // await Actualizator.wait; -> дождаться актуализации изменившихся ячеек

    public static Up(cell: BaseCell) {
        if (Actualizator.queue) { // ЕСЛИ обновление ячейки произошло в рамках микрозадачи UpAll
            Actualizator.queue.unshift(cell);
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
        if (cell.state === CellState.Actual)
            return;
        const oldDependencies = cell.dependencies;
        cell.dependencies = null;
        const prevCell = Actualizator.CurrentCell;
        Actualizator.CurrentCell = cell;
        try {
            cell.isPulling = true;
            cell.set(cell.pull());
            cell.isPulling = false;
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

    /* @internal */
    static imCalled(cell: BaseCell) {
        if (!Actualizator.CurrentCell)
            return;
        Actualizator.CurrentCell.addDependency(cell);
        cell.addReaction(Actualizator.CurrentCell);
    }

}
