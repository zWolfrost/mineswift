"use strict"

/**
 * A 2D-Array, with row-major layout (rows, then columns) containing the minefield cells and their properties:
 *
 * @prop {Array}   rows                    - The minefield cell rows.
 * @prop {Array}   rows[].cols             - The minefield cells of the row, on their column.
 * @prop {Number}  rows[].cols[].mines     - The number of mines present around a cell.
 * @prop {Boolean} rows[].cols[].isMine    - Whether a cell is a mine.
 * @prop {Boolean} rows[].cols[].isOpen    - Whether a cell is revealed.
 * @prop {Boolean} rows[].cols[].isFlag    - Whether a cell is flagged.
 * @prop {Number}  rows[].cols[].row       - The row position of the cell.
 * @prop {Number}  rows[].cols[].col       - The column position of the cell.
 * @prop {Array<Number>} rows[].cols[].pos - An array of the row and column of the cell.
 */
class Minefield extends Array
{
   /**
    * Creates a new minefield with the given rows, columns and mines number (and randomizes them).
    *
    * Remember that the number of rows is the height of the minefield, while the number of columns is the width.
    * @param {Number} rows The number of rows of the minefield (1-based).
    * @param {Number} cols The number of columns of the minefield (1-based).
    * @param {Object} opts Optional settings.
    * @param {Number} opts.mines The number of total mines (default: width*height/5).
    * @param {Function} opts.rng A function that returns a random decimal number between 0 and 1 (default: {@link Math.random}).
    * @returns {Minefield} A new Minefield object.
    */
   constructor(rows, cols, { mines = Math.floor(rows*cols/5), rng = Math.random } = {})
   {
      super();

      //Assign properties to cells and add mines
      for (let i=0; i<rows; i++)
      {
         this[i] = []

         for (let j=0; j<cols; j++)
         {
            this[i][j] = {
               mines: 0,
               isMine: i*rows+j < mines,
               isOpen: false,
               isFlag: false
            };
         }
      }

      //Durstenfeld shuffle algorithm
      for (let i=(this.rows*this.cols)-1; i>0; i--)
      {
         let j = Math.floor(rng() * (i+1));

         let [row, col] = this.#indexToPosition(i);
         let [row2, col2] = this.#indexToPosition(j);

         [ this[row][col], this[row2][col2] ] = [ this[row2][col2], this[row][col] ];
      }

      //Calculate nearby mines number for each cell
      for (let i=0; i<this.rows; i++)
      {
         for (let j=0; j<this.cols; j++)
         {
            this[i][j].row = i
            this[i][j].col = j
            this[i][j].pos = [i, j]

            if (this[i][j].isMine)
            {
               this.getNearbyCells([i, j], true).forEach(cell => cell.mines++)
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
    * @returns {Array< Array<Number> >} A Number-Only array containing the numbers with meanings explained above.
    */
   simplify()
   {
      let simplified = [];

      for (let i=0; i<this.rows; i++)
      {
         simplified.push([]);

         for (let j=0; j<this.cols; j++)
         {
            let cell = this[i][j];

            simplified[i].push(cell.isMine ? -1 : cell.mines);
         }
      }

      return simplified;
   }

   /**
    * Returns a version of the minefield where all the rows are concatenated in a single array. Useful for looping each cell quickly.
    *
    * WARNING! This array will keep the reference of every cell, so modifying this array will also modify the ones of the actual minefield.
    * @returns {Array} The concatenated minefield rows.
    */
   concatenate()
   {
      return [].concat(...this)
   }


   /**
    * Calculates and assigns the nearby number of mines of each cell.
    * @returns The nearby number of mines for each cell has been calculated.
    */
   resetMines()
   {
      for (let row of this)
      {
         for (let cell of row)
         {
            cell.mines = 0
         }
      }

      for (let i=0; i<this.rows; i++)
      {
         for (let j=0; j<this.cols; j++)
         {
            if (this[i][j].isMine)
            {
               this.getNearbyCells([i, j], true).forEach(cell => cell.mines++)
            }
         }
      }
   }


   /**
    * Opens a given cell and may open nearby ones following the minesweeper game rules.
    * @param {Array<Number>} position The position of the cell to open "[row, col]".
    * @param {Object} opts Optional settings.
    * @param {Boolean} opts.firstMove If true, and a bomb is opened, it will be moved in another cell starting from 0 (default: {@link isNew()}).
    * @param {Boolean} opts.nearbyOpening Allows the opening of nearby cells if the given cell is already open and its nearby mines number matches the number of nearby flagged cells.
    * @param {Boolean} opts.nearbyFlagging Allows the flagging of nearby cells if the given cell is already open and its nearby mines number matches the number of nearby closed cells.
    * @returns {Array<Array>>} An array containing arrays with the coordinates of the updated cells.
    */
   open([row, col], {firstMove=this.isNew(), nearbyOpening=false, nearbyFlagging=false} = {})
   {
      let flat = [].concat(...this);
      let index = this.#positionToIndex([row, col])
      let updatedCells = [];

      let flatOpenEmptyZone = (index) =>
      {
         for (let emptyCell of this.#getEmptyZoneIndex(index))
         {
            flat[emptyCell].isOpen = true;
            updatedCells.push(flat[emptyCell]);
         }
      }

      if (flat[index].isOpen == false)
      {
         if (flat[index].isMine && firstMove)
         {
            flat[index].isMine = false;

            for (let nearbyCell of this.#getNearbyCellsIndex(index, true))
            {
               flat[nearbyCell].mines--
            }

            for (let i=0; i < flat.length; i++)
            {
               if (flat[i].isMine == false && i != index)
               {
                  flat[i].isMine = true;

                  for (let nearbyCell of this.#getNearbyCellsIndex(i, true))
                  {
                     flat[nearbyCell].mines++
                  }

                  break;
               }
            }
         }

         flatOpenEmptyZone(index)
      }
      else if (flat[index].mines != 0 && (nearbyOpening || nearbyFlagging))
      {
         let closedCells = 0, flaggedCells = 0, unflaggedCells = [];

         for (let nearbyCell of this.#getNearbyCellsIndex(index))
         {
            if (flat[nearbyCell].isOpen == false)
            {
               closedCells++;

               if (flat[nearbyCell].isFlag) flaggedCells++;
               else unflaggedCells.push(nearbyCell);
            }
         }

         if (flat[index].mines == flaggedCells && nearbyOpening)
         {
            for (let unflaggedCell of unflaggedCells)
            {
               flatOpenEmptyZone(unflaggedCell);
            }
         }
         else if (flat[index].mines == closedCells && nearbyFlagging)
         {
            for (let unflaggedCell of unflaggedCells)
            {
               flat[unflaggedCell].isFlag = true;
               updatedCells.push(flat[unflaggedCell]);
            }
         }
      }

      //if (updatedCells.length >= 2 && updatedCells[0] == updatedCells[1]) updatedCells.shift();

      return updatedCells
   }

   /**
    * Checks if a minefield is solvable from a given cell (by not guessing).
    *
    * WARNING! This method gets resource-intensive the more the minefield is big.
    * @param {Array<Number>} position The position of the cell to start from "[row, col]".
    * @param {Number} position.row The row of the cell to start from.
    * @param {Number} position.col The column of the cell to start from.
    * @param {Boolean} restore Whether to restore the Minefield to all cells closed at the end.
    * @returns {Boolean} Whether the minefield is solvable from a given cell (by not guessing).
    */
   isSolvableFrom([row, col], restore=true)
   {
      let flat = [].concat(...this);

      let firstOpening = this.open([row, col])
      if (firstOpening.length <= 1)
      {
         if (restore) this.cellAt(firstOpening[0]).isOpen = false;
         return false;
      }


      let updates = true;

      while (updates)
      {
         let phantomGroups = [];
         updates = false;

         let importantCells = new Set();

         for (let i=0; i<flat.length; i++)
         {
            if (flat[i].isOpen == false && flat[i].isFlag == false)
            {
               for (let nearbyCell of this.#getNearbyCellsIndex(i))
               {
                  if (flat[nearbyCell].isOpen == true)
                  {
                     importantCells.add(nearbyCell);
                  }
               }
            }
         }

         importantCells = [...importantCells];


         for (let i of importantCells) //1st try: open cells using flags
         {
            if (flat[i].mines == 0) //all nearby cells are fine
            {
               for (let emptyCell of this.#getEmptyZoneIndex(i))
               {
                  if (flat[emptyCell].isOpen == false)
                  {
                     flat[emptyCell].isOpen = true;
                     updates = true;
                  }
               }
            }
            else
            {
               let closedCells = 0, flaggedCells = 0, unflaggedCells = [];

               for (let nearbyCell of this.#getNearbyCellsIndex(i))
               {
                  if (flat[nearbyCell].isOpen == false)
                  {
                     closedCells++;

                     if (flat[nearbyCell].isFlag) flaggedCells++;
                     else unflaggedCells.push(nearbyCell);
                  }
               }

               if (unflaggedCells.length > 0)
               {
                  if (flat[i].mines == flaggedCells) //all nearby cells are fine (except for the flagged cells) > open them
                  {
                     for (let x of unflaggedCells) flat[x].isOpen = true;
                     updates = true
                  }

                  if (flat[i].mines == closedCells) //all nearby closed cells are mines > flag them all
                  {
                     for (let x of unflaggedCells) flat[x].isFlag = true;
                     updates = true;
                  }

                  if (flat[i].mines > flaggedCells) //all nearby not flagged cells have some mines > phantom flagging
                  {
                     let tempPhantomGroup = unflaggedCells.sort();

                     tempPhantomGroup.mines = flat[i].mines - flaggedCells

                     if (matrixIncludesArr(phantomGroups, tempPhantomGroup) == false)
                     {
                        phantomGroups.push(tempPhantomGroup);
                     }
                  }
               }
            }
         }

         if (updates == false) //2nd try: open cells using phantom bombs
         {
            let shiftUpdates = true;

            while (shiftUpdates) //shifting & adding phantom bombs
            {
               shiftUpdates = false;

               for (let i of importantCells)
               {
                  let phantomGroupSum = [];
                  phantomGroupSum.mines = 0

                  let closedCells = [];
                  let flaggedCells = 0;

                  for (let nearbyCell of this.#getNearbyCellsIndex(i))
                  {
                     if (flat[nearbyCell].isFlag) flaggedCells++;
                     else if (flat[nearbyCell].isOpen == false) closedCells.push(nearbyCell);
                  }

                  for (let phantomGroup of phantomGroups)
                  {
                     if (phantomGroup.every(x => closedCells.includes(x)) && closedCells.length != phantomGroup.length)
                     {
                        let shift = closedCells.filter(x => phantomGroup.includes(x) == false).sort();
                        let shiftMines = flat[i].mines - phantomGroup.mines - flaggedCells;

                        let shiftPhantomGroup = shift;
                        shiftPhantomGroup.mines = shiftMines

                        if (shift.length > 0 && shiftMines > 0 && matrixIncludesArr(phantomGroups, shiftPhantomGroup) == false)
                        {
                           let push = true;

                           for (let phantomGroup of phantomGroups)
                           {
                              if (phantomGroup.every(x => shiftPhantomGroup.includes(x)))
                              {
                                 push = false;
                                 break;
                              }
                           }

                           if (push)
                           {
                              phantomGroups.push(shiftPhantomGroup)
                              shiftUpdates = true;
                           }
                        }

                        if (phantomGroup.some(x => phantomGroupSum.includes(x)) == false)
                        {
                           phantomGroupSum.mines += phantomGroup.mines;
                           phantomGroupSum.push(...phantomGroup);
                        }
                     }
                  }

                  if (phantomGroupSum.mines > 0 && matrixIncludesArr(phantomGroups, phantomGroupSum) == false)
                  {
                     phantomGroups.push(phantomGroupSum);
                     shiftUpdates = true;
                  }
               }
            }


            for (let i of importantCells) //open cells using phantom bombs
            {
               let nearbyCells = this.#getNearbyCellsIndex(i);

               for (let phantomGroup of phantomGroups)
               {
                  if (nearbyCells.some(x => phantomGroup.includes(x)))
                  {
                     let phantomGroupUncontainedCells = phantomGroup.filter(x => nearbyCells.includes(x) == false).length;

                     let flaggedCells = 0, unknownCells = [];

                     for (let nearbyCell of nearbyCells)
                     {
                        if (flat[nearbyCell].isFlag) flaggedCells++;
                        else if (flat[nearbyCell].isOpen == false && phantomGroup.includes(nearbyCell) == false)
                        {
                           unknownCells.push(nearbyCell);
                        }
                     }

                     if (unknownCells.length > 0)
                     {
                        if (flat[i].mines == flaggedCells + phantomGroup.mines + unknownCells.length) //all unknown cells are mines > flag them all
                        {
                           for (let x of unknownCells) flat[x].isFlag = true;
                           updates = true;
                        }
                        if (flat[i].mines == flaggedCells + phantomGroup.mines - phantomGroupUncontainedCells && updates == false) //all unknown cells are clear > open them
                        {
                           for (let x of unknownCells)
                           {
                              if (flat[x].isFlag == false)
                              {
                                 flat[x].isOpen = true;
                                 updates = true;
                              }
                           }
                        }
                     }
                  }
               }
            }


            if (updates == false) //3th try: open cells using remaining flags count
            {
               if (this.flags == this.mines)
               {
                  for (let i=0; i<flat.length; i++)
                  {
                     if (flat[i].isOpen == false && flat[i].isFlag == false)
                     {
                        flat[i].isOpen = true;
                     }
                  }
               }
               else
               {
                  phantomGroups.sort()
                  let remainingPhantomGroups = [];
                  remainingPhantomGroups.mines = 0

                  for (let phantomGroup of phantomGroups)
                  {
                     if (phantomGroup.some(x => JSON.stringify(remainingPhantomGroups).includes(x)) == false)
                     {
                        remainingPhantomGroups.mines += phantomGroup.mines;
                        remainingPhantomGroups.push(...phantomGroup);
                     }
                  }

                  if (remainingPhantomGroups.mines == this.mines - this.flags)
                  {
                     for (let i=0; i < flat.length; i++)
                     {
                        if (flat[i].isOpen == false && flat[i].isFlag == false && remainingPhantomGroups.includes(i) == false)
                        {
                           flat[i].isOpen = true;
                           updates = true;
                        }
                     }
                  }
               }
            }
         }
      }


      let isSolvable = false;
      if (this.isCleared()) isSolvable = true;

      if (restore)
      {
         for (let i=0; i < flat.length; i++)
         {
            flat[i].isOpen = false;
            flat[i].isFlag = false;
         }
      }

      return isSolvable;
   }
   /**
    * Checks the minefield to find hints about its state.
    * @param {Boolean} accurateHint If false, the function will also return the nearby cells around the hint. If true, it will only return the exact cells to open/flag.
    * @returns {Array<Array>} An array of arrays of hint cells, along with a property "safe" which indicates if the hint cells are safe to open or mines to flag.
    * @example minefield.getHint(true, false)
    * //[ [{...}, {...}, safe: true], [{...}, {...}, safe: false] ]
    */
   getHints(accurateHint=false)
   {
      let flat = [].concat(...this);

      let hintPositions = [];
      let accurateHintPositions = [];

      let phantomGroups = [];
      let importantCells = new Set();

      for (let i=0; i<flat.length; i++)
      {
         if (flat[i].isOpen == false && flat[i].isFlag == false)
         {
            for (let nearbyCell of this.#getNearbyCellsIndex(i))
            {
               if (flat[nearbyCell].isOpen == true)
               {
                  importantCells.add(nearbyCell);
               }
            }
         }
      }

      importantCells = [...importantCells];


      for (let i of importantCells) //1st try: using flags
      {
         if (flat[i].isOpen)
         {
            if (flat[i].mines == 0) //all nearby cells are fine
            {
               let nearbyCells = this.#getNearbyCellsIndex(i);
               let closedCells = nearbyCells.filter(x => flat[x].isOpen == false)

               if (closedCells.length > 0)
               {
                  hintPositions.push([...nearbyCells, i])
                  hintPositions.at(-1).safe = true
                  accurateHintPositions.push(closedCells);
                  accurateHintPositions.at(-1).safe = true
               }
            }
            else
            {
               let nearbyCells = this.#getNearbyCellsIndex(i);

               let closedCells = 0, flaggedCells = 0, unflaggedCells = [];

               for (let nearbyCell of this.#getNearbyCellsIndex(i))
               {
                  if (flat[nearbyCell].isOpen == false)
                  {
                     closedCells++;

                     if (flat[nearbyCell].isFlag) flaggedCells++;
                     else unflaggedCells.push(nearbyCell);
                  }
               }

               if (unflaggedCells.length > 0)
               {
                  if (flat[i].mines == flaggedCells) //all nearby cells are fine (except for the flagged cells) > open them
                  {
                     hintPositions.push([...nearbyCells, i])
                     hintPositions.at(-1).safe = true
                     accurateHintPositions.push(unflaggedCells);
                     accurateHintPositions.at(-1).safe = true
                  }

                  if (flat[i].mines == closedCells) //all nearby closed cells are mines > flag them all
                  {
                     hintPositions.push([...nearbyCells, i])
                     hintPositions.at(-1).safe = false
                     accurateHintPositions.push(unflaggedCells);
                     accurateHintPositions.at(-1).safe = false
                  }

                  if (flat[i].mines > flaggedCells) //all nearby not flagged cells have some mines > phantom flagging
                  {
                     let tempPhantomGroup = unflaggedCells.sort();

                     tempPhantomGroup.mines = flat[i].mines - flaggedCells

                     if (matrixIncludesArr(phantomGroups, tempPhantomGroup) == false)
                     {
                        phantomGroups.push(tempPhantomGroup);
                     }
                  }
               }
            }
         }
      }

      let shiftUpdates = true;
      while (shiftUpdates) //phantom bombs shifting
      {
         shiftUpdates = false;

         for (let i of importantCells)
         {
            let phantomGroupSum = [];
            phantomGroupSum.mines = 0

            let closedCells = [];
            let flaggedCells = 0;

            for (let nearbyCell of this.#getNearbyCellsIndex(i))
            {
               if (flat[nearbyCell].isFlag) flaggedCells++;
               else if (flat[nearbyCell].isOpen == false) closedCells.push(nearbyCell);
            }

            for (let phantomGroup of phantomGroups)
            {
               if (phantomGroup.every(x => closedCells.includes(x)) && closedCells.length != phantomGroup.length)
               {
                  let shift = closedCells.filter(x => phantomGroup.includes(x) == false).sort();
                  let shiftMines = flat[i].mines - phantomGroup.mines - flaggedCells;

                  let shiftPhantomGroup = shift;
                  shiftPhantomGroup.mines = shiftMines

                  if (shift.length > 0 && shiftMines > 0 && matrixIncludesArr(phantomGroups, shiftPhantomGroup) == false)
                  {
                     let push = true;

                     for (let phantomGroup of phantomGroups)
                     {
                        if (phantomGroup.every(x => shiftPhantomGroup.includes(x)))
                        {
                           push = false;
                           break;
                        }
                     }

                     if (push)
                     {
                        phantomGroups.push(shiftPhantomGroup)
                        shiftUpdates = true;
                     }
                  }

                  if (phantomGroup.some(x => phantomGroupSum.includes(x)) == false)
                  {
                     phantomGroupSum.mines += phantomGroup.mines;
                     phantomGroupSum.push(...phantomGroup);
                  }
               }
            }

            if (phantomGroupSum.mines > 0 && matrixIncludesArr(phantomGroups, phantomGroupSum) == false)
            {
               phantomGroups.push(phantomGroupSum);
               shiftUpdates = true;
            }
         }
      }

      for (let i of importantCells) //2nd try: using phantom bombs
      {
         let nearbyCells = this.#getNearbyCellsIndex(i);

         for (let phantomGroup of phantomGroups)
         {
            if (nearbyCells.some(x => phantomGroup.includes(x)))
            {
               let phantomGroupUncontainedCells = phantomGroup.filter(x => nearbyCells.includes(x) == false).length;

               let flaggedCells = 0, unknownCells = [], pgCenterNearbyCells = [];

               for (let nearbyCell of nearbyCells)
               {
                  let tempNearbyCells = this.#getNearbyCellsIndex(nearbyCell);

                  if (phantomGroup.every(x => tempNearbyCells.includes(x)) && flat[nearbyCell].isOpen)
                  {
                     pgCenterNearbyCells.push(...tempNearbyCells);
                  }

                  if (flat[nearbyCell].isFlag) flaggedCells++;
                  else if (flat[nearbyCell].isOpen == false && phantomGroup.includes(nearbyCell) == false)
                  {
                     unknownCells.push(nearbyCell);
                  }
               }

               if (unknownCells.length > 0)
               {
                  if (flat[i].mines == flaggedCells + phantomGroup.mines + unknownCells.length) //all unknown cells are mines > flag them all
                  {
                     hintPositions.push([...new Set([...nearbyCells, ...pgCenterNearbyCells, i])]);
                     hintPositions.at(-1).safe = false
                     accurateHintPositions.push(unknownCells);
                     accurateHintPositions.at(-1).safe = false
                  }
                  else if (flat[i].mines == flaggedCells + phantomGroup.mines - phantomGroupUncontainedCells) //all unknown cells are clear > open them
                  {
                     unknownCells = unknownCells.filter(x => flat[x].isFlag == false);

                     if (unknownCells.length > 0)
                     {
                        hintPositions.push([...new Set([...nearbyCells, ...pgCenterNearbyCells, i])]);
                        hintPositions.at(-1).safe = true
                        accurateHintPositions.push(unknownCells);
                        accurateHintPositions.at(-1).safe = true
                     }
                  }
               }
            }
         }
      }

      if (this.flags == this.mines) //3th try: using remaining flags count
      {
         let closedCells = [];

         for (let i=0; i < flat.length; i++)
         {
            if (flat[i].isOpen == false && flat[i].isFlag == false)
            {
               closedCells.push(i);
            }
         }

         if (closedCells.length > 0)
         {
            hintPositions.push(closedCells);
            hintPositions.at(-1).safe = true
            accurateHintPositions.push(closedCells);
            accurateHintPositions.at(-1).safe = true
         }
      }
      else
      {
         phantomGroups.sort()
         let remainingPhantomGroups = [];
         remainingPhantomGroups.mines = 0

         for (let phantomGroup of phantomGroups)
         {
            if (phantomGroup.some(x => JSON.stringify(remainingPhantomGroups).includes(x)) == false)
            {
               remainingPhantomGroups.mines += phantomGroup.mines;
               remainingPhantomGroups.push(...phantomGroup);
            }
         }

         if (remainingPhantomGroups.mines == this.mines - this.flags)
         {
            let safeCells = [];

            for (let i=0; i < flat.length; i++)
            {
               if (flat[i].isOpen == false && flat[i].isFlag == false && remainingPhantomGroups.includes(i) == false)
               {
                  safeCells.push(i);
               }
            }

            if (safeCells.length > 0)
            {
               hintPositions.push(safeCells);
               hintPositions.at(-1).safe = true
               accurateHintPositions.push(safeCells);
               accurateHintPositions.at(-1).safe = true
            }
         }
      }

      let hints = (accurateHint ? accurateHintPositions : hintPositions) ?? [];

      for (let hint of hints)
      {
         for (let i=0; i<hint.length; i++)
         {
            hint[i] = this.cellAt(this.#indexToPosition(hint[i]))
         }
      }

      return hints
   }

   #getNearbyCellsIndex(index, includeSelf=false)
   {
      let nearbyCells = [];

      let [row, col] = this.#indexToPosition(index)

      let isNotFirstRow = row > 0;
      let isNotLastRow = row < this.rows-1;


      if (includeSelf  ) nearbyCells.push(index)                 //center

      if (isNotFirstRow) nearbyCells.push(index-this.cols);      //up
      if (isNotLastRow ) nearbyCells.push(index+this.cols);      //down

      if (col > 0) //if cell isn't on first column
      {
         nearbyCells.push(index-1);                               //left

         if (isNotFirstRow) nearbyCells.push(index-this.cols-1); //up left
         if (isNotLastRow ) nearbyCells.push(index+this.cols-1); //down left
      }

      if (col < this.cols-1) //if cell isn't on last column
      {
         nearbyCells.push(index+1);                               //right

         if (isNotFirstRow) nearbyCells.push(index-this.cols+1); //up right
         if (isNotLastRow ) nearbyCells.push(index+this.cols+1); //down right
      }

      return nearbyCells;
   }
   #getEmptyZoneIndex(index, includeFlags=false)
   {
      let flat = [].concat(...this)
      let emptyZone = new Set([index]);

      for (let emptyCell of emptyZone)
      {
         if (flat[emptyCell].mines == 0)
         {
            for (let nearbyCell of this.#getNearbyCellsIndex(emptyCell))
            {
               if (includeFlags || flat[nearbyCell].isFlag == false)
               {
                  emptyZone.add(nearbyCell)
               }
            }
         }
      }

      return [...emptyZone]
   }

   #indexToPosition(index)
   {
      return [Math.floor(index / this.cols), index % this.cols]
   }
   #positionToIndex([row, col])
   {
      return row*this.cols + col
   }


   /**
    * Shorthand for getting a cell by doing "minefield.cellAt(position)" instead of "minefield[ position[0] ][ position[1] ]".
    * @param {Array<Number>} position The position of the desired cell to start from. Row and column can be either in an array or passed as-is.
    * @returns {Object} The cell object at the given position.
    */
   cellAt(...position)
   {
      position = position.flat()
      return this[position[0]][position[1]]
   }
   /**
    * Finds the position of the cells directly around a given cell.
    * @param {Array<Number>} position The position of the desired cell "[row, col]".
    * @param {Number} position.row The row of the desired cell.
    * @param {Number} position.col The column of the desired cell.
    * @param {Boolean} includeSelf If true, also include the position of the given cell.
    * @returns {Array} An Array containing the cells directly around the given one.
    */
   getNearbyCells([row, col], includeSelf=false)
   {
      let nearbyCells = [];

      if (this[row-1]?.[col-1]) nearbyCells.push( this[row-1][col-1] )
      if (this[row-1]?.[col])   nearbyCells.push( this[row-1][col]   )
      if (this[row-1]?.[col+1]) nearbyCells.push( this[row-1][col+1] )

      if (this[row]?.[col-1])   nearbyCells.push( this[row][col-1]   )
      if (includeSelf)          nearbyCells.push( this[row][col]     )
      if (this[row]?.[col+1])   nearbyCells.push( this[row][col+1]   )

      if (this[row+1]?.[col-1]) nearbyCells.push( this[row+1][col-1] )
      if (this[row+1]?.[col])   nearbyCells.push( this[row+1][col]   )
      if (this[row+1]?.[col+1]) nearbyCells.push( this[row+1][col+1] )

      return nearbyCells;
   }


   /**
    * @returns {Boolean} a Boolean value that indicates whether the game is new (before the first move).
    */
   isNew()
   {
      for (let row of this)
      {
         for (let cell of row)
         {
            if (cell.isOpen) return false;
         }
      }

      return true
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether the game is going on (after the first move, before game over).
    */
   isGoingOn()
   {
      let foundClosedEmpty = false;
      let foundOpen = false;

      for (let row of this)
      {
         for (let cell of row)
         {
            if (cell.isOpen && cell.isMine) return false;

            if (cell.isOpen) foundOpen = true;
            else if (cell.isOpen == false && cell.isMine == false) foundClosedEmpty = true;
         }
      }

      return foundOpen && foundClosedEmpty
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether the game is over (both cleared or lost).
    */
   isOver()
   {
      let foundClosedEmpty = false;

      for (let row of this)
      {
         for (let cell of row)
         {
            if (cell.isOpen == false && cell.isMine == false) foundClosedEmpty = true;
            else if (cell.isOpen && cell.isMine) return true;
         }
      }

      return foundClosedEmpty == false;
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether the minefield has been cleared (no mines opened).
    */
   isCleared()
   {
      for (let row of this)
      {
         for (let cell of row)
         {
            if (cell.isOpen == false && cell.isMine == false) return false;
            if (cell.isOpen && cell.isMine) return false;
         }
      }

      return true;
   }
   /**
    * @returns {Boolean} a Boolean value that indicates whether a mine has been opened in the current minefield.
    */
   isLost()
   {
      for (let row of this)
      {
         for (let cell of row)
         {
            if (cell.isOpen && cell.isMine) return true
         }
      }

      return false;
   }


   /**
    * Creates and logs by default a visually clear string of the minefield, useful for debugging. Legend:
    *
    *  - ?: Unknown cells (neither open or flagged)
    *  - F: Flagged cells
    *  - [0-8]: An open cell, with its nearby mines number
    *  - X: An open mine
    *
    * @param {Object} opts Optional settings.
    * @param {Boolean} opts.uncover Whether to show every cell as if they were open.
    * @param {Boolean} opts.log Whether to log the visualization.
    * @returns {String} The visualization string.
    */
   visualize({uncover=false, log=true} = {})
   {
      let text = "";

      for (let i=0; i<this.rows; i++)
      {
         for (let j=0; j<this.cols; j++)
         {
            let char = "", cell = this[i][j];

            if (cell.isOpen == false && uncover == false)
            {
               if (cell.isFlag) char += "F";
               else char += "?";
            }
            else if (cell.isMine == true) char += "X";
            else char += cell.mines;

            if (j == this.cols-1) text += char + "\n";
            else text += char + " ";
         };
      }

      if (log) console.log(text)

      return text;
   }


   /**
    * @returns {Number} The number of rows of the current minefield.
    */
   get rows()
   {
      return this.length
   }
   /**
    * @returns {Number} The number of columns of the current minefield.
    */
   get cols()
   {
      return this[0].length
   }

   /**
    * @returns {Number} The number of cells in the current minefield.
    */
   get cells()
   {
      return this.cols * this.rows
   }
   /**
    * @returns {Number} The number of mines in the current minefield.
    */
   get mines()
   {
      let minesCount = 0

      for (let row of this)
      {
         for (let cell of row)
         {
            if (cell.isMine) minesCount++
         }
      }

      return minesCount
   }
   /**
    * @returns {Number} The number of flagged cells in the current minefield.
    */
   get flags()
   {
      let flagsCount = 0;

      for (let row of this)
      {
         for (let cell of row)
         {
            if (cell.isFlag) flagsCount++;
         }
      }

      return flagsCount;
   }
}


function matrixIncludesArr(matrix, target)
{
   return matrix.some(arr => arraysEqual(arr, target))
}
function arraysEqual(arr1, arr2)
{
   if (arr1.length !== arr2.length) return false;

   for (let i=arr1.length; i--;)
   {
      if (arr1[i] !== arr2[i]) return false;
   }

   return true;
}


module.exports = Minefield