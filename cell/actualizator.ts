import {Cell} from "./cell";

export class Actualizator {

    public static CurrentCell: Cell;
    private static CellsToActualize = new Set<Cell>();

    public static Add(cell: Cell) {
        Actualizator.CellsToActualize.add(cell);
        Actualizator.wait ??= Promise.resolve().then(Actualizator.ProcessAll);
    }

    public static ProcessAll() {
        Actualizator.wait = null
        Actualizator.CellsToActualize.forEach(Actualizator.Process);
        Actualizator.CellsToActualize.clear();
    }

    public static Process(cell: Cell) {
        if (Actualizator.CurrentCell === cell)
            throw new Error('cyclical pull');
        const prevCell = Actualizator.CurrentCell;
        Actualizator.CurrentCell = cell;
        try {
            cell.set(cell.pull());
        } catch (e) {
            cell.error = e;
        }
        Actualizator.CurrentCell = prevCell;
    }

    static wait: Promise<void>;
}