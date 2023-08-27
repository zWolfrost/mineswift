# mineswift
An efficient node.js Minesweeper engine with zero dependencies that can be used to easily create minefields and play without having to code any logic.

Some of the most notable capabilities:
- Lots of useful logic methods such as "**open**" and "**getHints**" ([see below their use](#minefield-object-methods));
- Minefield **Auto-Solving Algorithm** (useful when wanting to make no-guess minefields);
- **Current minefield state** methods (**isGoingOn**, **isOver** etc.);

&nbsp;
## How to use
```js
const Minefield = require("mineswift")

let minefield = new Minefield(4, 6, {mines: 5});
//default mines number is "floor(rows*cols/5)"
```
Creates a minefield with 4 rows, 6 columns and 5 mines, which is a 2D-Array with row-major layout, that contains:
- [0...3]               - The minefield rows.
- [0...3][0...5]        - The minefield cells of the row, on their column position. [see below their properties](#minefield-cell-properties).

&nbsp;
```js
while (minefield.isSolvableFrom([2, 3]) == false) {
    minefield.randomize()
}
```
Randomizes the minefield until it finds one that is solvable without guessing, starting from the cell at row "2" and column "3"

&nbsp;
```js
minefield.open([2, 3])
```
Opens the cell at row "2" and column "3" and may open nearby cells following the minesweeper game rules (like what would happen if the cell doesn't have any mines nearby).

&nbsp;
```js
if (minefield.isLost()) {
    console.log("you lost!!")
}
```
Returns a Boolean value that indicates whether a mine has been opened in the current minefield (as in the game has been lost).

&nbsp;
```js
minefield.visualize()
// ? ? ? ? ? ?
// ? ? 3 2 1 ?
// ? ? 2 0 1 ?
// ? ? 1 0 1 ?

minefield.visualize({uncover: true})
// 1 2 X X 1 0
// 1 X 3 2 1 0
// 2 2 2 0 1 1
// 1 X 1 0 1 X
```
Returns (and logs by default) a visually clear string of the minefield, useful for debugging.


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
*Note that the methods are fully documented in the JSDOC methods comments.*

*Also, the Minefield class extends the Array class, so you can also use the array default methods.*

| Method            | Description
|:-:                |:-
| **new Minefield** | Creates a new minefield with the given rows, columns and mines number (and randomizes them).
| randomize         | Replaces the Minefield object with a new Minefield object with the same rows, columns and mines number.
| reset             | Closes all cells and removes all flags from the minefield.
| resetMines        | Resets the nearby-mines number for each cell in the current minefield.
| simplify          | Returns a Number-Only 2D array version of the minefield.
| concatenate       | Returns a version of the minefield where all the rows are concatenated in a single array. Useful for iterating each cell quickly.
| open              | Opens a given cell and may open nearby ones following the minesweeper game rules.
| isSolvableFrom    | Returns a Boolean value that indicates whether the minefield is solvable from a given cell (by not guessing).
| getHints          | Checks the minefield to find hints about its state.
| getNearbyCells    | Finds the position of the cells directly around a given cell.
| cellAt            | Shorthand for getting a cell by doing `minefield.cellAt(position)` instead of `minefield[ position[0] ][ position[1] ]`.
| isNew             | Returns a Boolean value that indicates whether the game is new (before the first move).
| isGoingOn         | Returns a Boolean value that indicates whether the game is going on (after the first move, before game over).
| isOver            | Returns a Boolean value that indicates whether the game is over (both cleared or lost).
| isCleared         | Returns a Boolean value that indicates whether the minefield has been cleared (no mines opened).
| isLost            | Returns a Boolean value that indicates whether a mine has been opened in the current minefield.
| visualize         | Creates a visually clear string of the minefield, useful for debugging.
| rows              | (getter) The number of rows of the current minefield.
| rows              | (setter) Either removes rows from the minefield or adds empty ones.
| cols              | (getter) The number of columns of the current minefield.
| cols              | (setter) Either removes columns from the minefield or adds empty ones.
| cells             | (getter) The number of cells in the current minefield.
| mines             | (getter) The number of mines in the current minefield.
| mines             | (setter) Either removes random mines from the minefield or adds other ones at random positions.
| flags             | (getter) The number of flagged cells in the current minefield.

&nbsp;
## Changelog & Breaking Changes
**Watch out for this section if you wish to migrate to a different version.** <br>

- **v1.1.0**:
<br>- Added "positions" and "color" options in the "visualize" method.
<br>- Added evaluation and error handling for the position parameter.
<br>- Fixed a bug where the "isSolvableFrom" method would crash if the chosen cell had 1 or more mines around.
<br>- Fixed a bug where the number of mines would become very unbalanced as the board became more "rectangular".
<br>- Fixed a bug where the "open" method would return the same cell as updated multiple times.

- **v1.2.0**:
<br>- Added "randomize" method.
<br>- Added "unicode" and "highlight" options in the "visualize" method.
<br>- The "isSolvableFrom" method will return false if the chosen cell is a mine, instead of moving it in the upper left corner (like the "open" method does when "firstMove" is true).
<br>- Further optimized the "isSolvableFrom" method.

- **v1.3.0**:
<br>- Added "reset" method.
<br>- Added "rows", "cols" and "mines" setters.
<br>- Further improved and optimized the "isSolvableFrom" and "getHints" methods.
<br>- Fixed bug in the "visualize" method where the column positions would slightly shift the right.

- **v1.4.0**
<br>- If you pass an array of positions to the "mines" option of the Minefield constructor, the mines will now be set in those positions.
<br>- Further optimized the "isSolvableFrom" and "getHints" methods.
<br>- Fixed a bug where creating a Minefield with 0 mines would still randomize the cells.
  - **v1.4.1**
  <br>- Added examples to the "[How to use](#how-to-use)" section.
  <br>- JSDOC clarifications.

&nbsp;
## Found a bug and/or need help?
Please [open an issue](https://github.com/zWolfrost/mineswift/issues) on Github to request a change, report a bug or ask for help about something and i will gladly look into it.

If you like this library, consider giving it a star on [Github](https://github.com/zWolfrost/mineswift). It means a lot :)