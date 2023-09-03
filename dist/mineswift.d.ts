type Position = number[];
interface Cell {
    mines: number;
    isMine: boolean;
    isOpen: boolean;
    isFlag: boolean;
    row: number;
    col: number;
    pos: Position;
}
type Hint = Cell[] & {
    safe: boolean;
};
/**
 * A 2D-Array, with row-major layout (rows, then columns) containing the minefield cells and their properties:
 *
 * @prop {Array}   rows                    - The minefield cell rows.
 * @prop {Array}   rows[].cols             - The minefield cells of the row, on their column.
 * @prop {number}  rows[].cols[].mines     - The number of mines present around a cell.
 * @prop {boolean} rows[].cols[].isMine    - Whether a cell is a mine.
 * @prop {boolean} rows[].cols[].isOpen    - Whether a cell is revealed.
 * @prop {boolean} rows[].cols[].isFlag    - Whether a cell is flagged.
 * @prop {number}  rows[].cols[].row       - The row position of the cell.
 * @prop {number}  rows[].cols[].col       - The column position of the cell.
 * @prop {number[]} rows[].cols[].pos - An array of the row and column of the cell.
 */
declare class Minefield extends Array<Array<Cell>> {
    #private;
    /**
     * Creates a new minefield with the given rows, columns and mines number (and randomizes the mines using the fisher-yates shuffle algorithm).
     *
     * Remember that the number of rows is the height of the minefield, while the number of columns is the width.
     * @param {number} rows The number of rows of the minefield (1-based).
     * @param {number} cols The number of columns of the minefield (1-based).
     * @param {object} opts Optional settings.
     * @param {number | Position[]} opts.mines The number of total mines (default: rows*cols/5). If given an array of positions instead ("[[row, col], [row2, col2], ...]"), mines will be set in those, without randomizing.
     * @param {Function} opts.rng A function that returns a random decimal number between 0 and 1 (default: {@link Math.random}).
     * @returns {Minefield} A new Minefield object.
     */
    constructor(rows: number, cols: number, { mines, rng }?: {
        mines?: number | Position[];
        rng?: Function;
    });
    /**
     * Replaces this Minefield object with a new Minefield object with the same rows, columns and mines number.
     *
     * That means that randomizing will also reset the minefield.
     * @param {Function} rng A function that returns a random decimal number between 0 and 1 (default: {@link Math.random}).
     * @returns The minefield has been randomized
     */
    randomize(rng?: Function): void;
    /**
     * Closes all cells and removes all flags from the minefield.
     * @returns The minefield has been reset.
     */
    reset(): void;
    /**
     * Calculates and assigns the nearby number of mines of each cell.
     * @returns The nearby number of mines for each cell has been calculated.
     */
    resetMines(): void;
    /**
     * Returns a number-only simplified version of the minefield.
     *
     *  - -1: A mine;
     *  - [0-8]: A cell with the number of nearby mines.
     *
     * @returns {number[][]} A Number-Only array containing the numbers with meanings explained above.
     */
    simplify(): number[][];
    /**
     * Returns a version of the minefield where all the rows are concatenated in a single array. Useful for iterating each cell quickly.
     *
     * WARNING! This array will keep the reference of every cell, so modifying this array will also modify the ones of the actual minefield.
     * @returns {Cell[]} The concatenated minefield rows.
     */
    concatenate(): Cell[];
    /**
     * Opens a given cell and may open nearby ones following the minesweeper game rules.
     * @param {Position} position The position of the cell to open "[row, col]".
     * @param {object} opts Optional settings.
     * @param {boolean} opts.firstMove If true, and a bomb is opened, it will be moved in another cell starting from 0 (default: {@link isNew()}).
     * @param {boolean} opts.nearbyOpening Allows the opening of nearby cells if the given cell is already open and its nearby mines number matches the number of nearby flagged cells.
     * @param {boolean} opts.nearbyFlagging Allows the flagging of nearby cells if the given cell is already open and its nearby mines number matches the number of nearby closed cells.
     * @returns {Cell[]} An array containing arrays with the coordinates of the updated cells.
     * @throws If the cell position is invalid.
     */
    open([row, col]: Position, { firstMove, nearbyOpening, nearbyFlagging }?: {
        firstMove?: boolean;
        nearbyOpening?: boolean;
        nearbyFlagging?: boolean;
    }): Cell[];
    /**
     * Checks if a minefield is solvable starting from a given cell by not guessing, using an algorithm.
     *
     * WARNING! This method will take more time the more the minefield is big. However it is highly optimized to mitigate this as much as possible.
     *
     * Note that the algorithm isn't perfect and it might return false on really hard but still solvable minefields. Although, it's worth noting that encountering those is really unlikely.
     * @param {Position} position The position of the cell to start from "[row, col]". If given an empty array, will start from the current state.
     * @param {number} position.row The row of the cell to start from.
     * @param {number} position.col The column of the cell to start from.
     * @param {boolean} restore Whether to restore the Minefield to all cells closed at the end.
     * @returns {boolean} Whether the minefield is solvable from a given cell (by not guessing).
     * @throws If the cell position is invalid.
     */
    isSolvableFrom([row, col]: Position, restore?: boolean): boolean;
    /**
     * Checks the minefield to find hints about its state.
     * @param {boolean} accurateHint If false, the function will also return the nearby cells around the hint. If true, it will only return the exact cells to open/flag.
     * @returns {Hint[]} An array of arrays of hint cells, along with a property "safe" which indicates if the hint cells are safe to open or mines to flag.
     * @example minefield.getHint(true, false)
     * //[ [{...}, {...}, safe: true], [{...}, {...}, safe: false] ]
     */
    getHints(accurateHint?: boolean): Hint[];
    /**
     * Finds the position of the cells directly around a given cell.
     * @param {Position} position The position of the desired cell "[row, col]".
     * @param {number} position.row The row of the desired cell.
     * @param {number} position.col The column of the desired cell.
     * @param {boolean} includeSelf If true, also include the position of the given cell.
     * @returns {Cell[]} An Array containing the cells directly around the given one.
     * @throws If the cell position is invalid.
     */
    getNearbyCells([row, col]: Position, includeSelf?: boolean): Cell[];
    /**
     * Shorthand for getting a cell by doing "minefield.cellAt(position)" instead of "minefield[ position[0] ][ position[1] ]".
     * @param {Position | [Position]} position The position of the desired cell to start from. Row and column can be either in an array or passed as-is. If given only one value, it is assumed that that value is the index of the concatenated minefield.
     * @returns {Cell} The cell object at the given position.
     */
    cellAt(...position: Position | [Position]): Cell;
    /**
     * @returns {boolean} a Boolean value that indicates whether the game is new (before the first move).
     */
    isNew(): boolean;
    /**
     * @returns {boolean} a Boolean value that indicates whether the game is going on (after the first move, before game over).
     */
    isGoingOn(): boolean;
    /**
     * @returns {boolean} a Boolean value that indicates whether the game is over (both cleared or lost).
     */
    isOver(): boolean;
    /**
     * @returns {boolean} a Boolean value that indicates whether the minefield has been cleared (no mines opened).
     */
    isCleared(): boolean;
    /**
     * @returns {boolean} a Boolean value that indicates whether a mine has been opened in the current minefield.
     */
    isLost(): boolean;
    /**
     * Creates and logs by default a visually clear string of the minefield, useful for debugging. Legend:
     *
     *  - ?: Unknown cells (neither open or flagged)
     *  - F: Flagged cells (If the cell is, for some reason, also open, it will get treated as unflagged.)
     *  - X: An open mine
     *  - [0-8]: An open cell, with its nearby mines number
     *
     * @param {object} opts Optional settings.
     * @param {boolean} opts.unicode Whether to replace various characters with unicode symbols for better viewing.
     * @param {boolean} opts.positions Whether to include the grid row and column positions.
     * @param {boolean} opts.color Whether to include command line colors in the visualization.
     * @param {Position[]} opts.highlight An array of positions "[[row, col], [row2, col2], ...]" of cells to highlight.
     * @param {boolean} opts.uncover Whether to show every cell as if they were open.
     * @param {boolean} opts.log Whether to log the visualization.
     * @returns {string} The visualization string.
     */
    visualize({ unicode, positions, color, highlight, uncover, log }?: {
        unicode?: boolean;
        positions?: boolean;
        color?: boolean;
        highlight?: Position[];
        uncover?: boolean;
        log?: boolean;
    }): string;
    /**
     * @returns {number} The number of rows of the current minefield.
     */
    get rows(): number;
    /**
     * Either removes rows from the minefield or adds empty ones.
     *
     * Then, resets the nearby mines number for every cell.
     * @param {number} rows The number of target rows.
     * @returns The number of rows has been changed.
     */
    set rows(rows: number);
    /**
     * @returns {number} The number of columns of the current minefield.
     */
    get cols(): number;
    /**
     * Either removes columns from the minefield or adds empty ones.
     *
     * Then, resets the nearby mines number for every cell.
     * @param {number} cols The number of target columns.
     * @returns The number of columns has been changed.
     */
    set cols(cols: number);
    /**
     * @returns {number} The number of cells in the current minefield.
     */
    get cells(): number;
    /**
     * Loops over the minefield to find any instance of a mine.
     *
     * Because of this, it's recommended to cache this value.
     * @returns {number} The number of mines in the current minefield.
     */
    get mines(): number;
    /**
     * Either removes random mines from the minefield or adds other ones at random positions.
     *
     * Then, resets the nearby mines number for every cell.
     * @param {number} mines The number of target mines.
     * @returns The number of mines has been changed.
     */
    set mines(mines: number);
    /**
     * Loops over the minefield to find any instance of a flagged cell.
     *
     * Because of this, it's recommended to cache this value.
     * @returns {number} The number of flagged cells in the current minefield.
     */
    get flags(): number;
}
export = Minefield;
//# sourceMappingURL=mineswift.d.ts.map