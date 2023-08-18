# mineswift
An efficient node.js Minesweeper engine with zero dependencies that can be used to easily create minefields and play without having to code any logic.

Some of the most notable capabilities:
- Lots of useful logic methods such as "**open**" and "**getHints**" ([see below their use](#minefield-object-methods));
- Minefield **Auto-Solving Algorithm** (useful when wanting to make no-guess minefields);
- **Current minefield state** methods (**isGoingOn**, **isOver** etc.);

&nbsp;
## How to use
```
const Minefield = require("mineswift")

let minefield = new Minefield(4, 6, {mines: 3});
```

Creates a minefield with 4 rows, 6 columns and 3 mines, which is a 2D-Array with row-major layout, that contains:
- [0...3]               - The minefield cell rows.
- [0...3][0...5]        - The minefield cells of the row, on their column. [see below their properties](#minefield-cell-properties).

&nbsp;
## Minefield Cell Properties
| Property | Description
|:-:       |:-
| mines    | The number of mines present around a cell.
| isMine   | Whether a cell is a mine.
| isOpen   | Whether a cell is revealed.
| isFlag   | Whether a cell is flagged.
| row      | The row position of the cell.
| col      | The column position of the cell.
| pos      | An array of the row and column of the cell.

&nbsp;
## Minefield Object Methods
*Note that the methods are fully documented in the JSDOC methods comments*

| Method            | Description
|:-:                |:-
| **new Minefield** | Creates a new minefield with the given rows, columns and mines number (and randomizes them).
| simplify          | Returns a Number-Only 2D array version of the minefield.
| concatenate       | Returns a version of the minefield where all the rows are concatenated in a single array. Useful for looping each cell quickly.
| resetMines        | Resets the nearby-mines number for each cell in the current minefield.
| open              | Opens a given cell and may open nearby ones following the minesweeper game rules.
| isSolvableFrom    | Returns a Boolean value that indicates whether the minefield is solvable from a given cell (by not guessing).
| getHints          | Checks the minefield to find hints about its state.
| cellAt            | Shorthand for getting a cell by doing `minefield.cellAt(position)` instead of `minefield[ position[0] ][ position[1] ]`.
| getNearbyCells    | Finds the position of the cells directly around a given cell.
| isNew             | Returns a Boolean value that indicates whether the game is new (before the first move).
| isGoingOn         | Returns a Boolean value that indicates whether the game is going on (after the first move, before game over).
| isOver            | Returns a Boolean value that indicates whether the game is over (both cleared or lost).
| isCleared         | Returns a Boolean value that indicates whether the minefield has been cleared (no mines opened).
| isLost            | Returns a Boolean value that indicates whether a mine has been opened in the current minefield.
| visualize         | Creates a visually clear string of the minefield, useful for debugging.
| rows              | (getter) The number of rows of the current minefield.
| cols              | (getter) The number of columns of the current minefield.
| cells             | (getter) The number of cells in the current minefield.
| mines             | (getter) The number of mines in the current minefield.
| flags             | (getter) The number of flagged cells in the current minefield.


&nbsp;
## Found a bug and/or need help?
Please [open an issue](https://github.com/zWolfrost/mineswift/issues) on Github to request a change, report a bug or ask for help about something and i will gladly look into it.

If you like this library, consider giving it a star on [Github](https://github.com/zWolfrost/mineswift). It means a lot :)