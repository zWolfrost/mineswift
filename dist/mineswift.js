"use strict";
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
class Minefield extends Array {
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
    constructor(rows, cols, { mines = Math.floor(rows * cols / 5), rng = Math.random } = {}) {
        super();
        rows = parseIntRange(rows, 1);
        cols = parseIntRange(cols, 1);
        if (mines == 0)
            mines = [];
        if (Array.isArray(mines)) {
            //Assign properties to cells
            for (let i = 0; i < rows; i++) {
                this[i] = [];
                for (let j = 0; j < cols; j++) {
                    this[i][j] = {
                        mines: 0,
                        isMine: false,
                        isOpen: false,
                        isFlag: false,
                        row: i,
                        col: j,
                        pos: [i, j]
                    };
                }
            }
            //Add mines and assign nearby mines number for nearby cells
            for (let pos of mines) {
                this.cellAt(pos).isMine = true;
                this.getNearbyCells(pos, true).forEach(cell => cell.mines++);
            }
        }
        else {
            //Assign properties to cells and add mines
            for (let i = 0; i < rows; i++) {
                this[i] = [];
                for (let j = 0; j < cols; j++) {
                    this[i][j] = {
                        mines: 0,
                        isMine: mines-- > 0,
                        isOpen: false,
                        isFlag: false,
                        row: i,
                        col: j,
                        pos: [i, j],
                    };
                }
            }
            //Fisher-Yates shuffle algorithm
            for (let i = (this.rows * this.cols) - 1; i > 0; i--) {
                let j = Math.floor(rng() * (i + 1));
                let [row, col] = this.#indexToPosition(i);
                let [row2, col2] = this.#indexToPosition(j);
                [this[row][col], this[row2][col2]] = [this[row2][col2], this[row][col]];
            }
            //Assign position and nearby mines number for nearby cells
            for (let i = 0; i < this.rows; i++) {
                for (let j = 0; j < this.cols; j++) {
                    this[i][j].row = i;
                    this[i][j].col = j;
                    this[i][j].pos = [i, j];
                    if (this[i][j].isMine) {
                        this.getNearbyCells([i, j], true).forEach(cell => cell.mines++);
                    }
                }
            }
        }
    }
    /**
     * Replaces this Minefield object with a new Minefield object with the same rows, columns and mines number.
     *
     * That means that randomizing will also reset the minefield.
     * @param {Function} rng A function that returns a random decimal number between 0 and 1 (default: {@link Math.random}).
     * @returns The minefield has been randomized
     */
    randomize(rng = Math.random) {
        Object.assign(this, new Minefield(this.rows, this.cols, { mines: this.mines, rng: rng }));
    }
    /**
     * Closes all cells and removes all flags from the minefield.
     * @returns The minefield has been reset.
     */
    reset() {
        for (let row of this) {
            for (let cell of row) {
                cell.isOpen = cell.isFlag = false;
            }
        }
    }
    /**
     * Calculates and assigns the nearby number of mines of each cell.
     * @returns The nearby number of mines for each cell has been calculated.
     */
    resetMines() {
        for (let row of this) {
            for (let cell of row) {
                cell.mines = 0;
            }
        }
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this[i][j].isMine) {
                    this.getNearbyCells([i, j], true).forEach(cell => cell.mines++);
                }
            }
        }
    }
    /**
     * Returns a number-only simplified version of the minefield.
     *
     *  - -1: A mine;
     *  - [0-8]: A cell with the number of nearby mines.
     *
     * @returns {number[][]} A Number-Only array containing the numbers with meanings explained above.
     */
    simplify() {
        let simplified = [];
        for (let i = 0; i < this.rows; i++) {
            simplified.push([]);
            for (let j = 0; j < this.cols; j++) {
                let cell = this[i][j];
                simplified[i].push(cell.isMine ? -1 : cell.mines);
            }
        }
        return simplified;
    }
    /**
     * Returns a version of the minefield where all the rows are concatenated in a single array. Useful for iterating each cell quickly.
     *
     * WARNING! This array will keep the reference of every cell, so modifying this array will also modify the ones of the actual minefield.
     * @returns {Cell[]} The concatenated minefield rows.
     */
    concatenate() {
        return [].concat(...this);
    }
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
    open([row, col], { firstMove = this.isNew(), nearbyOpening = false, nearbyFlagging = false } = {}) {
        let flat = this.concatenate();
        let index = this.#positionToIndex(this.#validatePosition(row, col));
        let updatedCells = [];
        let flatOpenEmptyZone = (index) => {
            for (let cell of this.#getEmptyZoneIndex(index)) {
                if (flat[cell].isOpen == false) {
                    flat[cell].isOpen = true;
                    updatedCells.push(flat[cell]);
                }
            }
        };
        if (flat[index].isOpen == false) {
            if (flat[index].isMine && firstMove) {
                flat[index].isMine = false;
                for (let nearbyCell of this.#getNearbyCellsIndex(index, true)) {
                    flat[nearbyCell].mines--;
                }
                for (let i = 0; i < flat.length; i++) {
                    if (flat[i].isMine == false && i != index) {
                        flat[i].isMine = true;
                        for (let nearbyCell of this.#getNearbyCellsIndex(i, true)) {
                            flat[nearbyCell].mines++;
                        }
                        break;
                    }
                }
            }
            flatOpenEmptyZone(index);
        }
        else if (flat[index].mines != 0) {
            if (nearbyOpening || nearbyFlagging) {
                let nearbyClosedCellsCount = 0, nearbyFlaggedCellsCount = 0, nearbyUnflaggedCells = [];
                for (let nearbyCell of this.#getNearbyCellsIndex(index)) {
                    if (flat[nearbyCell].isOpen == false) {
                        nearbyClosedCellsCount++;
                        if (flat[nearbyCell].isFlag)
                            nearbyFlaggedCellsCount++;
                        else
                            nearbyUnflaggedCells.push(nearbyCell);
                    }
                }
                if (nearbyOpening) {
                    if (flat[index].mines == nearbyFlaggedCellsCount) {
                        for (let unflaggedCell of nearbyUnflaggedCells) {
                            flatOpenEmptyZone(unflaggedCell);
                        }
                    }
                }
                if (nearbyFlagging) {
                    if (flat[index].mines == nearbyClosedCellsCount) {
                        for (let unflaggedCell of nearbyUnflaggedCells) {
                            flat[unflaggedCell].isFlag = true;
                            updatedCells.push(flat[unflaggedCell]);
                        }
                    }
                }
            }
        }
        return updatedCells;
    }
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
    isSolvableFrom([row, col], restore = true) {
        if (row !== undefined && col !== undefined) {
            let firstCell = this.cellAt(this.#validatePosition(row, col));
            firstCell.isOpen = true;
            if (firstCell.mines !== 0) {
                if (restore)
                    firstCell.isOpen = false;
                return false;
            }
        }
        let flat = this.concatenate();
        let importantCells = [];
        for (let i = 0; i < flat.length; i++) {
            if (flat[i].isOpen) {
                importantCells.push(i);
            }
        }
        let updates = true;
        while (updates) {
            updates = false;
            let allLinkedGroups = [];
            importantCells = importantCells.filter(cell => {
                for (let nearbyCell of this.#getNearbyCellsIndex(cell)) {
                    if (flat[nearbyCell].isOpen == false && flat[nearbyCell].isFlag == false) {
                        return true;
                    }
                }
                return false;
            });
            for (let i of importantCells) //1st try: open cells using nearby mines and flags
             {
                if (flat[i].mines == 0) //all nearby cells are fine
                 {
                    for (let emptyCell of this.#getEmptyZoneIndex(i)) {
                        if (flat[emptyCell].isOpen == false) {
                            flat[emptyCell].isOpen = true;
                            importantCells.push(emptyCell);
                            updates = true;
                        }
                    }
                }
                else {
                    let nearbyClosedCellsCount = 0, nearbyFlaggedCellsCount = 0, nearbyUnflaggedCells = Object.assign([], { mines: 0 });
                    for (let nearbyCell of this.#getNearbyCellsIndex(i)) {
                        if (flat[nearbyCell].isOpen == false) {
                            nearbyClosedCellsCount++;
                            if (flat[nearbyCell].isFlag)
                                nearbyFlaggedCellsCount++;
                            else
                                nearbyUnflaggedCells.push(nearbyCell);
                        }
                    }
                    if (nearbyUnflaggedCells.length > 0) {
                        if (flat[i].mines == nearbyFlaggedCellsCount) //all nearby unflagged cells are safe -> open them
                         {
                            for (let cell of nearbyUnflaggedCells) {
                                flat[cell].isOpen = true;
                                importantCells.push(cell);
                            }
                            updates = true;
                        }
                        if (flat[i].mines == nearbyClosedCellsCount) //all nearby unflagged cells are mines -> flag them
                         {
                            for (let cell of nearbyUnflaggedCells)
                                flat[cell].isFlag = true;
                            updates = true;
                        }
                        if (flat[i].mines > nearbyFlaggedCellsCount) //all nearby unflagged cells have SOME mines -> link them
                         {
                            if (matrixIncludesArr(allLinkedGroups, nearbyUnflaggedCells) == false) {
                                nearbyUnflaggedCells.mines = flat[i].mines - nearbyFlaggedCellsCount;
                                allLinkedGroups.push(nearbyUnflaggedCells);
                            }
                        }
                    }
                }
            }
            if (updates == false) //2nd try: open cells using linked groups
             {
                let shiftUpdates = true;
                while (shiftUpdates) //adding & shifting linked groups
                 {
                    shiftUpdates = false;
                    for (let i of importantCells) {
                        let linkedGroupsSum = Object.assign([], { mines: 0 });
                        let nearbyClosedCells = [];
                        let nearbyFlaggedCellsCount = 0;
                        for (let nearbyCell of this.#getNearbyCellsIndex(i)) {
                            if (flat[nearbyCell].isFlag)
                                nearbyFlaggedCellsCount++;
                            else if (flat[nearbyCell].isOpen == false)
                                nearbyClosedCells.push(nearbyCell);
                        }
                        for (let linkedGroup of allLinkedGroups) {
                            if (arrIncludesEveryItemOfArr(nearbyClosedCells, linkedGroup) && nearbyClosedCells.length != linkedGroup.length) {
                                let shiftLinkedGroup = Object.assign(nearbyClosedCells.filter(cell => linkedGroup.includes(cell) == false), //shifting
                                { mines: flat[i].mines - linkedGroup.mines - nearbyFlaggedCellsCount });
                                if (shiftLinkedGroup.length > 0 && shiftLinkedGroup.mines > 0 && matrixIncludesArr(allLinkedGroups, shiftLinkedGroup) == false) {
                                    allLinkedGroups.push(shiftLinkedGroup);
                                    shiftUpdates = true;
                                }
                                if (arrIncludesSomeItemOfArr(linkedGroupsSum, linkedGroup) == false) //adding
                                 {
                                    linkedGroupsSum.mines += linkedGroup.mines;
                                    linkedGroupsSum.push(...linkedGroup);
                                }
                            }
                        }
                        if (linkedGroupsSum.mines > 0 && matrixIncludesArr(allLinkedGroups, linkedGroupsSum) == false) {
                            allLinkedGroups.push(linkedGroupsSum);
                            shiftUpdates = true;
                        }
                    }
                }
                for (let i of importantCells) //open cells using linked groups
                 {
                    let nearbyCells = this.#getNearbyCellsIndex(i);
                    for (let linkedGroup of allLinkedGroups) {
                        if (arrIncludesSomeItemOfArr(linkedGroup, nearbyCells)) {
                            let nearbyFlaggedCellsCount = 0, nearbyUnknownCells = [];
                            for (let nearbyCell of nearbyCells) {
                                if (flat[nearbyCell].isFlag)
                                    nearbyFlaggedCellsCount++;
                                else if (flat[nearbyCell].isOpen == false && linkedGroup.includes(nearbyCell) == false) {
                                    nearbyUnknownCells.push(nearbyCell);
                                }
                            }
                            if (nearbyUnknownCells.length > 0) {
                                let linkedGroupUncontainedCellsCount = linkedGroup.filter(x => nearbyCells.includes(x) == false).length;
                                if (flat[i].mines == nearbyFlaggedCellsCount + linkedGroup.mines + nearbyUnknownCells.length) //all unknown cells are mines > flag them
                                 {
                                    for (let cell of nearbyUnknownCells)
                                        flat[cell].isFlag = true;
                                    updates = true;
                                }
                                else if (flat[i].mines == nearbyFlaggedCellsCount + linkedGroup.mines - linkedGroupUncontainedCellsCount && updates == false) //all unknown cells are clear > open them
                                 {
                                    for (let cell of nearbyUnknownCells) {
                                        if (flat[cell].isFlag == false) {
                                            flat[cell].isOpen = true;
                                            importantCells.push(cell);
                                            updates = true;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (updates == false) //3th try: open cells using remaining flags count
             {
                let flagsCount = 0, minesCount = 0;
                for (let cell of flat) {
                    if (cell.isFlag)
                        flagsCount++;
                    if (cell.isMine)
                        minesCount++;
                }
                if (flagsCount == minesCount) {
                    for (let i = 0; i < flat.length; i++) {
                        if (flat[i].isOpen == false && flat[i].isFlag == false) {
                            flat[i].isOpen = true;
                            importantCells.push(i);
                        }
                    }
                }
                else {
                    for (let linkedGroup of allLinkedGroups)
                        linkedGroup.sort();
                    allLinkedGroups.sort(); //prioritizing smaller linked groups
                    let linkedGroupsSum = Object.assign([], { mines: 0 });
                    for (let linkedGroup of allLinkedGroups) {
                        if (arrIncludesSomeItemOfArr(linkedGroupsSum, linkedGroup) == false) //adding
                         {
                            linkedGroupsSum.mines += linkedGroup.mines ?? 0;
                            linkedGroupsSum.push(...linkedGroup);
                        }
                    }
                    allLinkedGroups.push(linkedGroupsSum);
                    for (let linkedGroup of allLinkedGroups) {
                        if (linkedGroup.mines == minesCount - flagsCount) {
                            for (let i = 0; i < flat.length; i++) {
                                if (flat[i].isOpen == false && flat[i].isFlag == false && linkedGroup.includes(i) == false) {
                                    flat[i].isOpen = true;
                                    importantCells.push(i);
                                    updates = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        if (restore)
            this.reset();
        let isSolvable = (importantCells.length == 0);
        return isSolvable;
    }
    /**
     * Checks the minefield to find hints about its state.
     * @param {boolean} accurateHint If false, the function will also return the nearby cells around the hint. If true, it will only return the exact cells to open/flag.
     * @returns {Hint[]} An array of arrays of hint cells, along with a property "safe" which indicates if the hint cells are safe to open or mines to flag.
     * @example minefield.getHint(true, false)
     * //[ [{...}, {...}, safe: true], [{...}, {...}, safe: false] ]
     */
    getHints(accurateHint = false) {
        let flat = this.concatenate();
        let hintPositions = [];
        let accurateHintPositions = [];
        let allLinkedGroups = [];
        let importantCells = [];
        flat.forEach((cell, i) => {
            if (cell.isOpen) {
                for (let nearbyCell of this.#getNearbyCellsIndex(i)) {
                    if (flat[nearbyCell].isOpen == false && flat[nearbyCell].isFlag == false) {
                        importantCells.push(i);
                        return;
                    }
                }
            }
        });
        for (let i of importantCells) //1st try: using flags
         {
            if (flat[i].isOpen) {
                if (flat[i].mines == 0) //all nearby cells are fine
                 {
                    let nearbyCells = this.#getNearbyCellsIndex(i);
                    let nearbyClosedCells = nearbyCells.filter(x => flat[x].isOpen == false);
                    if (nearbyClosedCells.length > 0) {
                        hintPositions.push(Object.assign([...nearbyCells, i], { safe: true }));
                        accurateHintPositions.push(Object.assign(nearbyClosedCells, { safe: true }));
                    }
                }
                else {
                    let nearbyCells = this.#getNearbyCellsIndex(i);
                    let nearbyClosedCellsCount = 0, nearbyFlaggedCellsCount = 0, nearbyUnflaggedCells = Object.assign([], { mines: 0 });
                    for (let nearbyCell of nearbyCells) {
                        if (flat[nearbyCell].isOpen == false) {
                            nearbyClosedCellsCount++;
                            if (flat[nearbyCell].isFlag)
                                nearbyFlaggedCellsCount++;
                            else
                                nearbyUnflaggedCells.push(nearbyCell);
                        }
                    }
                    if (nearbyUnflaggedCells.length > 0) {
                        if (flat[i].mines == nearbyFlaggedCellsCount) //all nearby cells are fine (except for the flagged cells) > open them
                         {
                            hintPositions.push(Object.assign([...nearbyCells, i], { safe: true }));
                            accurateHintPositions.push(Object.assign(nearbyUnflaggedCells, { safe: true }));
                        }
                        if (flat[i].mines == nearbyClosedCellsCount) //all nearby closed cells are mines > flag them all
                         {
                            hintPositions.push(Object.assign([...nearbyCells, i], { safe: false }));
                            accurateHintPositions.push(Object.assign(nearbyUnflaggedCells, { safe: false }));
                        }
                        if (flat[i].mines > nearbyFlaggedCellsCount) //all nearby not flagged cells have some mines > phantom flagging
                         {
                            if (matrixIncludesArr(allLinkedGroups, nearbyUnflaggedCells) == false) {
                                nearbyUnflaggedCells.mines = flat[i].mines - nearbyFlaggedCellsCount;
                                allLinkedGroups.push(nearbyUnflaggedCells);
                            }
                        }
                    }
                }
            }
        }
        let shiftUpdates = true;
        while (shiftUpdates) //adding & shifting linked groups
         {
            shiftUpdates = false;
            for (let i of importantCells) {
                let linkedGroupsSum = Object.assign([], { mines: 0 });
                let nearbyClosedCells = [];
                let nearbyFlaggedCellsCount = 0;
                for (let nearbyCell of this.#getNearbyCellsIndex(i)) {
                    if (flat[nearbyCell].isFlag)
                        nearbyFlaggedCellsCount++;
                    else if (flat[nearbyCell].isOpen == false)
                        nearbyClosedCells.push(nearbyCell);
                }
                for (let linkedGroup of allLinkedGroups) {
                    if (arrIncludesEveryItemOfArr(nearbyClosedCells, linkedGroup) && nearbyClosedCells.length != linkedGroup.length) {
                        let shiftLinkedGroup = Object.assign(nearbyClosedCells.filter(cell => linkedGroup.includes(cell) == false), //shifting
                        { mines: flat[i].mines - linkedGroup.mines - nearbyFlaggedCellsCount });
                        if (shiftLinkedGroup.length > 0 && shiftLinkedGroup.mines > 0 && matrixIncludesArr(allLinkedGroups, shiftLinkedGroup) == false) {
                            allLinkedGroups.push(shiftLinkedGroup);
                            shiftUpdates = true;
                        }
                        if (arrIncludesSomeItemOfArr(linkedGroupsSum, linkedGroup) == false) {
                            linkedGroupsSum.mines += linkedGroup.mines;
                            linkedGroupsSum.push(...linkedGroup);
                        }
                    }
                }
                if (linkedGroupsSum.mines > 0 && matrixIncludesArr(allLinkedGroups, linkedGroupsSum) == false) {
                    allLinkedGroups.push(linkedGroupsSum);
                    shiftUpdates = true;
                }
            }
        }
        for (let i of importantCells) //2nd try: using phantom bombs
         {
            let nearbyCells = this.#getNearbyCellsIndex(i);
            for (let linkedGroup of allLinkedGroups) {
                if (arrIncludesSomeItemOfArr(linkedGroup, nearbyCells)) {
                    let nearbyFlaggedCellsCount = 0, nearbyUnknownCells = [], pgCenterNearbyCells = [];
                    for (let nearbyCell of nearbyCells) {
                        let tempNearbyCells = this.#getNearbyCellsIndex(nearbyCell);
                        if (linkedGroup.every(x => tempNearbyCells.includes(x)) && flat[nearbyCell].isOpen) {
                            pgCenterNearbyCells.push(...tempNearbyCells);
                        }
                        if (flat[nearbyCell].isFlag)
                            nearbyFlaggedCellsCount++;
                        else if (flat[nearbyCell].isOpen == false && linkedGroup.includes(nearbyCell) == false) {
                            nearbyUnknownCells.push(nearbyCell);
                        }
                    }
                    if (nearbyUnknownCells.length > 0) {
                        let linkedGroupUncontainedCellsCount = linkedGroup.filter(x => nearbyCells.includes(x) == false).length;
                        if (flat[i].mines == nearbyFlaggedCellsCount + linkedGroup.mines + nearbyUnknownCells.length) //all unknown cells are mines > flag them all
                         {
                            hintPositions.push(Object.assign([...new Set([...nearbyCells, ...pgCenterNearbyCells, i])], { safe: false }));
                            accurateHintPositions.push(Object.assign(nearbyUnknownCells, { safe: false }));
                        }
                        else if (flat[i].mines == nearbyFlaggedCellsCount + linkedGroup.mines - linkedGroupUncontainedCellsCount) //all unknown cells are clear > open them
                         {
                            nearbyUnknownCells = nearbyUnknownCells.filter(x => flat[x].isFlag == false);
                            if (nearbyUnknownCells.length > 0) {
                                hintPositions.push(Object.assign([...new Set([...nearbyCells, ...pgCenterNearbyCells, i])], { safe: true }));
                                accurateHintPositions.push(Object.assign(nearbyUnknownCells, { safe: true }));
                            }
                        }
                    }
                }
            }
        }
        let flagsCount = 0, minesCount = 0;
        for (let cell of flat) {
            if (cell.isFlag)
                flagsCount++;
            if (cell.isMine)
                minesCount++;
        }
        if (flagsCount == minesCount) //3th try: using remaining flags count
         {
            let closedCells = [];
            for (let i = 0; i < flat.length; i++) {
                if (flat[i].isOpen == false && flat[i].isFlag == false) {
                    closedCells.push(i);
                }
            }
            if (closedCells.length > 0) {
                hintPositions.push(Object.assign(closedCells, { safe: true }));
                accurateHintPositions.push(Object.assign(closedCells, { safe: true }));
            }
        }
        else {
            for (let linkedGroup of allLinkedGroups)
                linkedGroup.sort();
            allLinkedGroups.sort();
            let linkedGroupsSum = Object.assign([], { mines: 0 });
            for (let linkedGroup of allLinkedGroups) {
                if (arrIncludesSomeItemOfArr(linkedGroupsSum, linkedGroup) == false) //adding
                 {
                    linkedGroupsSum.mines += linkedGroup.mines;
                    linkedGroupsSum.push(...linkedGroup);
                }
            }
            allLinkedGroups.push(linkedGroupsSum);
            for (let linkedGroup of allLinkedGroups) {
                if (linkedGroup.mines == minesCount - flagsCount) {
                    let safeCells = [];
                    for (let i = 0; i < flat.length; i++) {
                        if (flat[i].isOpen == false && flat[i].isFlag == false && linkedGroup.includes(i) == false) {
                            safeCells.push(i);
                        }
                    }
                    if (safeCells.length > 0) {
                        hintPositions.push(Object.assign(safeCells, { safe: true }));
                        accurateHintPositions.push(Object.assign(safeCells, { safe: true }));
                    }
                }
            }
        }
        let hints = (accurateHint ? accurateHintPositions : hintPositions) ?? [];
        let hintCells = [];
        for (let i = 0; i < hints.length; i++) {
            hintCells[i] = Object.assign([], { safe: hints[i].safe });
            for (let index of hints[i]) {
                hintCells[i].push(this.cellAt(this.#indexToPosition(index)));
            }
        }
        return hintCells;
    }
    #getNearbyCellsIndex(index, includeSelf = false) {
        let nearbyCells = [];
        let [row, col] = this.#indexToPosition(index);
        let columns = this.cols;
        let isNotFirstCol = col > 0;
        let isNotLastCol = col < columns - 1;
        if (row > 0) //if cell isn't on first row
         {
            if (isNotFirstCol)
                nearbyCells.push(index - columns - 1);
            nearbyCells.push(index - columns);
            if (isNotLastCol)
                nearbyCells.push(index - columns + 1);
        }
        if (isNotFirstCol)
            nearbyCells.push(index - 1);
        if (includeSelf)
            nearbyCells.push(index);
        if (isNotLastCol)
            nearbyCells.push(index + 1);
        if (row < this.rows - 1) //if cell isn't on last row
         {
            if (isNotFirstCol)
                nearbyCells.push(index + columns - 1);
            nearbyCells.push(index + columns);
            if (isNotLastCol)
                nearbyCells.push(index + columns + 1);
        }
        return nearbyCells;
    }
    #getEmptyZoneIndex(index, includeFlags = false) {
        let flat = this.concatenate();
        let emptyZone = new Set([index]);
        for (let emptyCell of emptyZone) {
            if (flat[emptyCell].mines == 0) {
                for (let nearbyCell of this.#getNearbyCellsIndex(emptyCell)) {
                    if (includeFlags || flat[nearbyCell].isFlag == false) {
                        emptyZone.add(nearbyCell);
                    }
                }
            }
        }
        return [...emptyZone];
    }
    /**
     * Finds the position of the cells directly around a given cell.
     * @param {Position} position The position of the desired cell "[row, col]".
     * @param {number} position.row The row of the desired cell.
     * @param {number} position.col The column of the desired cell.
     * @param {boolean} includeSelf If true, also include the position of the given cell.
     * @returns {Cell[]} An Array containing the cells directly around the given one.
     * @throws If the cell position is invalid.
     */
    getNearbyCells([row, col], includeSelf = false) {
        [row, col] = this.#validatePosition(row, col);
        let nearbyCells = [];
        if (this[row - 1]?.[col - 1])
            nearbyCells.push(this[row - 1][col - 1]);
        if (this[row - 1]?.[col])
            nearbyCells.push(this[row - 1][col]);
        if (this[row - 1]?.[col + 1])
            nearbyCells.push(this[row - 1][col + 1]);
        if (this[row]?.[col - 1])
            nearbyCells.push(this[row][col - 1]);
        if (includeSelf)
            nearbyCells.push(this[row][col]);
        if (this[row]?.[col + 1])
            nearbyCells.push(this[row][col + 1]);
        if (this[row + 1]?.[col - 1])
            nearbyCells.push(this[row + 1][col - 1]);
        if (this[row + 1]?.[col])
            nearbyCells.push(this[row + 1][col]);
        if (this[row + 1]?.[col + 1])
            nearbyCells.push(this[row + 1][col + 1]);
        return nearbyCells;
    }
    #validatePosition(...position) {
        let [row, col] = [].concat(...position);
        try {
            row = Math.trunc(Math.abs(+row));
            col = Math.trunc(Math.abs(+col));
            if (isNaN(row) || isNaN(col))
                throw 0;
        }
        catch {
            throw new Error("Position is invalid");
        }
        if (row < 0 || row > this.rows - 1)
            throw new Error(`Row position is undefined (${row})`);
        if (col < 0 || col > this.cols - 1)
            throw new Error(`Column position is undefined (${col})`);
        return [row, col];
    }
    /**
     * Shorthand for getting a cell by doing "minefield.cellAt(position)" instead of "minefield[ position[0] ][ position[1] ]".
     * @param {Position | [Position]} position The position of the desired cell to start from. Row and column can be either in an array or passed as-is. If given only one value, it is assumed that that value is the index of the concatenated minefield.
     * @returns {Cell} The cell object at the given position.
     */
    cellAt(...position) {
        position = [].concat(...position);
        if (position.length == 1)
            position = this.#indexToPosition(position[0]);
        return this[position[0]][position[1]];
    }
    #indexToPosition(index) {
        return [Math.floor(index / this.cols), index % this.cols];
    }
    #positionToIndex([row, col]) {
        return row * this.cols + col;
    }
    /**
     * @returns {boolean} a Boolean value that indicates whether the game is new (before the first move).
     */
    isNew() {
        for (let row of this) {
            for (let cell of row) {
                if (cell.isOpen)
                    return false;
            }
        }
        return true;
    }
    /**
     * @returns {boolean} a Boolean value that indicates whether the game is going on (after the first move, before game over).
     */
    isGoingOn() {
        let foundClosedEmpty = false;
        let foundOpen = false;
        for (let row of this) {
            for (let cell of row) {
                if (cell.isOpen) {
                    if (cell.isMine)
                        return false;
                    foundOpen = true;
                }
                else if (cell.isOpen == false && cell.isMine == false)
                    foundClosedEmpty = true;
            }
        }
        return foundOpen && foundClosedEmpty;
    }
    /**
     * @returns {boolean} a Boolean value that indicates whether the game is over (both cleared or lost).
     */
    isOver() {
        let foundClosedEmpty = false;
        for (let row of this) {
            for (let cell of row) {
                if (cell.isOpen == false && cell.isMine == false)
                    foundClosedEmpty = true;
                else if (cell.isOpen && cell.isMine)
                    return true;
            }
        }
        return foundClosedEmpty == false;
    }
    /**
     * @returns {boolean} a Boolean value that indicates whether the minefield has been cleared (no mines opened).
     */
    isCleared() {
        for (let row of this) {
            for (let cell of row) {
                if (cell.isOpen == cell.isMine)
                    return false;
            }
        }
        return true;
    }
    /**
     * @returns {boolean} a Boolean value that indicates whether a mine has been opened in the current minefield.
     */
    isLost() {
        for (let row of this) {
            for (let cell of row) {
                if (cell.isOpen && cell.isMine)
                    return true;
            }
        }
        return false;
    }
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
    visualize({ unicode = false, positions = false, color = false, highlight = [], uncover = false, log = true } = {}) {
        const EMPTY = unicode ? "·" : "0";
        const CLOSED = unicode ? "■" : "?";
        const FLAG = unicode ? "►" : "F";
        const MINE = unicode ? "*" : "X";
        const CORNER = unicode ? "×" : "x";
        const VERTICAL = unicode ? "│" : "|";
        const HORIZONTAL = unicode ? "─" : "—";
        const INTERSECTION = unicode ? "┼" : "|";
        const COLORS = {
            END: "\x1b[0m",
            ROW: {
                blackbg: "\x1b[40m",
                bright: "\x1b[1m",
            },
            COL: {
                redfg: "\x1b[31m",
                greenfg: "\x1b[32m",
                yellowfg: "\x1b[33m",
                bluefg: "\x1b[34m",
                magentafg: "\x1b[35m",
                cyanfg: "\x1b[36m",
            },
            HIGHLIGHT: "\x1b[7m"
        };
        function atBackground(n) {
            let colors = Object.values(COLORS.ROW);
            let choice = colors[n % colors.length];
            return choice ?? "";
        }
        function atForeground(n) {
            let colors = Object.values(COLORS.COL);
            let choice = colors[n % colors.length];
            return choice ?? "";
        }
        const MAXROWCHARS = positions ? Math.ceil(Math.log10(this.rows)) : 1;
        const MAXCOLCHARS = positions ? Math.ceil(Math.log10(this.cols)) : 1;
        let text = "";
        if (positions) {
            text += " ".repeat(MAXROWCHARS - 1) + CORNER + " " + VERTICAL + " "; //FIX
            for (let i = 0; i < this.cols; i++) {
                if (color)
                    text += atForeground(i);
                text += i.toString().padStart(i == 0 ? 1 : MAXCOLCHARS);
                if (color)
                    text += COLORS.END;
                text += " ";
            }
            text += "\n" + HORIZONTAL.repeat(MAXROWCHARS + 1) + INTERSECTION + HORIZONTAL.repeat(this.cols * (MAXCOLCHARS + 1));
            text += "\n";
        }
        for (let i = 0; i < this.rows; i++) {
            if (color)
                text += atBackground(i);
            if (positions)
                text += i.toString().padStart(MAXROWCHARS) + " " + VERTICAL + " ";
            for (let j = 0; j < this.cols; j++) {
                let char = "", cell = this[i][j];
                if (cell.isOpen == false && uncover == false) {
                    if (cell.isFlag)
                        char += FLAG;
                    else
                        char += CLOSED;
                }
                else if (cell.isMine == true)
                    char += MINE;
                else if (cell.mines == 0)
                    char += EMPTY;
                else
                    char += cell.mines;
                if (color)
                    text += atBackground(i) + atForeground(j);
                if (matrixIncludesArr(highlight, [i, j])) {
                    text += COLORS.HIGHLIGHT + char + COLORS.END;
                    if (color)
                        text += atBackground(i) + atForeground(j);
                }
                else {
                    text += char;
                }
                if (j != this.cols - 1)
                    text += " ".padStart(MAXCOLCHARS);
                else
                    text += " ";
                if (color)
                    text += COLORS.END;
            }
            ;
            text += "\n";
        }
        if (color)
            text += COLORS.END;
        if (log)
            console.log(text);
        return text;
    }
    /**
     * @returns {number} The number of rows of the current minefield.
     */
    get rows() {
        return this.length;
    }
    /**
     * Either removes rows from the minefield or adds empty ones.
     *
     * Then, resets the nearby mines number for every cell.
     * @param {number} rows The number of target rows.
     * @returns The number of rows has been changed.
     */
    set rows(rows) {
        rows = parseIntRange(rows, 1);
        if (rows !== this.rows) {
            if (rows < this.rows) {
                while (rows < this.rows)
                    this.pop();
            }
            else {
                for (let i = this.rows; i < rows; i++) {
                    this[i] = [];
                    for (let j = 0; j < this.cols; j++) {
                        this[i][j] = {
                            mines: 0,
                            isMine: false,
                            isOpen: false,
                            isFlag: false,
                            row: i,
                            col: j,
                            pos: [i, j],
                        };
                    }
                }
            }
            this.resetMines();
        }
    }
    /**
     * @returns {number} The number of columns of the current minefield.
     */
    get cols() {
        return this[0].length;
    }
    /**
     * Either removes columns from the minefield or adds empty ones.
     *
     * Then, resets the nearby mines number for every cell.
     * @param {number} cols The number of target columns.
     * @returns The number of columns has been changed.
     */
    set cols(cols) {
        cols = parseIntRange(cols, 1);
        if (cols !== this.cols) {
            if (cols < this.cols) {
                for (let i = 0; i < this.rows; i++) {
                    while (cols < this[i].length)
                        this[i].pop();
                }
            }
            else {
                let prevCols = this.cols;
                for (let i = 0; i < this.rows; i++) {
                    for (let j = prevCols; j < cols; j++) {
                        this[i][j] = {
                            mines: 0,
                            isMine: false,
                            isOpen: false,
                            isFlag: false,
                            row: i,
                            col: j,
                            pos: [i, j],
                        };
                    }
                }
            }
            this.resetMines();
        }
    }
    /**
     * @returns {number} The number of cells in the current minefield.
     */
    get cells() {
        return this.cols * this.rows;
    }
    /**
     * Loops over the minefield to find any instance of a mine.
     *
     * Because of this, it's recommended to cache this value.
     * @returns {number} The number of mines in the current minefield.
     */
    get mines() {
        let minesCount = 0;
        for (let row of this) {
            for (let cell of row) {
                if (cell.isMine)
                    minesCount++;
            }
        }
        return minesCount;
    }
    /**
     * Either removes random mines from the minefield or adds other ones at random positions.
     *
     * Then, resets the nearby mines number for every cell.
     * @param {number} mines The number of target mines.
     * @returns The number of mines has been changed.
     */
    set mines(mines) {
        mines = parseIntRange(mines, 0, this.cells);
        let prevMines = this.mines;
        if (mines !== prevMines) {
            let interestCells = this.concatenate();
            if (mines < prevMines)
                interestCells = interestCells.filter(cell => cell.isMine);
            else
                interestCells = interestCells.filter(cell => cell.isMine == false);
            let diff = Math.abs(prevMines - mines);
            for (let i = 0; i < diff; i++) {
                let j = Math.floor(Math.random() * interestCells.length);
                let cell = interestCells.splice(j, 1)[0];
                cell.isMine = !cell.isMine;
            }
            this.resetMines();
        }
    }
    /**
     * Loops over the minefield to find any instance of a flagged cell.
     *
     * Because of this, it's recommended to cache this value.
     * @returns {number} The number of flagged cells in the current minefield.
     */
    get flags() {
        let flagsCount = 0;
        for (let row of this) {
            for (let cell of row) {
                if (cell.isFlag)
                    flagsCount++;
            }
        }
        return flagsCount;
    }
}
function matrixIncludesArr(matrix, target) {
    return matrix.some(arr => arraysAreEqual(arr, target));
}
function arrIncludesEveryItemOfArr(arr1, arr2) {
    return arr2.every(el => arr1.includes(el));
}
function arrIncludesSomeItemOfArr(arr1, arr2) {
    return arr2.some(x => arr1.includes(x));
}
function arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false;
    for (let i = arr1.length; i--;) {
        if (arr1[i] !== arr2[i])
            return false;
    }
    return true;
}
function parseIntRange(int, min = -Infinity, max = Infinity) {
    int = parseInt(int.toString(), 10);
    if (isNaN(int))
        throw new Error("Parameter is not an Integer");
    if (int < min)
        return min;
    if (int > max)
        return max;
    return int;
}
module.exports = Minefield;
