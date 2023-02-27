(function() {
    'use strict';

    const INIT_SCORE = 5*60*1000; // 5' to ms
    const RECORDS_NAME = 'mm_puzzle';
    const INPUT_ID = 'user-name';

    /**
     * Puzzle namespace
     * @namespace
     */
    const puzzle = window.puzzle = {
        /**
         * Puzzle size (it'll always be square)
         * @type {Number} 
         */
        length: undefined,
        
        /**
         * Puzzle grid. 2D array containing all the tiles + empty space
         * @type {Array}  
         */
        grid: undefined,

        /**
         * Stores coordinates of last empty space
         * @type {Array}  
         */
        lastEmpty: undefined,

        /**
         * Move counter
         * @type {Number}  
         */
        moves: 0,

        /**
         * Time elapsed
         * @type {Array}  
         */
        time: 0,

        /**
         * Starting score.
         * @type {Number}  
         */
        score: INIT_SCORE,

        /**
         * Final score scaled
         * @type {Number}  
         */
        finalScore: undefined,

        /**
         * A given number to substract from the score 
         * for each move the user performs
         * @type {Number}  
         */
        scoreStep: 10,

        timerInterval: undefined,
        refreshInterval: undefined,
        hasStarted: false,

        /**
         * Starts the puzzle app
         * @function init
         * @memberof puzzle
         * @param  {number} length - Grid length (it will be always square)
         */
        init: function(length) {
            this.length = length > 2 ? length : 3; // minimum grid
            this.uiHelper.init(this.length);
            this.setupGrid();
            this.shuffleGrid();
        },

        /**
         * Generates the puzzle grid
         */
        setupGrid: function() {
            let tileCounter = 1;
            this.grid = Array.from(Array(this.length)).map((v,y) => {
                return Array.from(Array(this.length)).map((v,x) => {
                    // drop the last one
                    if(y === this.length-1 && x === this.length-1) {
                        this.lastEmpty = [x,y];
                        return null;
                    }
                    const tile = this.setupTile([x,y], tileCounter);
                    tileCounter++;
                    return tile;
                })
            });
        },

        /**
         * Generates the puzzle tile for the given coordinate
         * @param {Array} coords - x & y grid coordinates
         * @param {Number} tileCounter - Number that shows the user friendly order within the grid
         * @returns {HTMLElement} - puzzle tile
         */
        setupTile: function(coords, tileCounter) {
            const tile = this.uiHelper.createTile(coords, tileCounter);
            tile.onclick = this.move.bind(this);

            return tile;
        },

        /**
         * Moves the tile to the empty space whenever it's possible
         * @param {Event} e - Event object
         */
        move: function(e) {
            const currentX = parseInt(e.currentTarget.dataset.currentCoords.split(',')[0]);
            const currentY = parseInt(e.currentTarget.dataset.currentCoords.split(',')[1]);
            
            const isUp = currentX === this.lastEmpty[0] && currentY-1 === this.lastEmpty[1];
            const isDown = currentX === this.lastEmpty[0] && currentY+1 === this.lastEmpty[1];
            const isLeft = currentX-1 === this.lastEmpty[0] && currentY === this.lastEmpty[1];
            const isRight = currentX+1 === this.lastEmpty[0] && currentY === this.lastEmpty[1];

            const isMovable = isUp || isDown || isLeft || isRight;

            if(isMovable) {
                this.swap([currentX,currentY], this.lastEmpty);
                this.moves++;
                this.score -= this.scoreStep;
                this.uiHelper.updateMoves(this.moves);
                this.checkGameStatus();

                !this.hasStarted && this.startTimer();
            }
        },

        /**
         * Changes places in the grid between two given coordinates
         * @param {Array} from - Coordinates array
         * @param {Array} to - Coordinates array
         */
        swap: function(from, to) {
            const fromX = from[0];
            const fromY = from[1];
            const toX = to[0];
            const toY = to[1];

            const tempTo = this.grid[toY][toX];
            this.grid[toY][toX] = this.grid[fromY][fromX];
            this.grid[fromY][fromX] = tempTo;
            
            this.grid[toY][toX] && this.uiHelper.updateTile(this.grid[toY][toX], to);
            this.grid[fromY][fromX] && this.uiHelper.updateTile(this.grid[fromY][fromX], from);

            this.lastEmpty = !tempTo ? from : this.lastEmpty;
        },

        /**
         * Checks whether the puzzle is solved or not
         */
        checkGameStatus: function() {
            let isSolved = false;
            let keepChecking = true;
            for(let y = 0; y < this.grid.length; y++) {
                for(let x = 0; x < this.grid[y].length; x++) {
                    const tile = this.grid[y][x];
                    if(keepChecking) {
                        keepChecking = tile && tile.dataset.currentCoords === tile.dataset.finalCoords;
                    } else {
                        isSolved = false;
                        break;
                    }
                    isSolved = true;
                }
            }
            isSolved && this.finishGame();
        },

        /**
         * Calculates score and lets the user know the game has finished
         */
        finishGame: function() {
            clearInterval(this.timerInterval);
            clearInterval(this.refreshInterval);
            this.finalScore = parseInt(this.scaleToRange(this.score, [0,INIT_SCORE], [0,100]));
            const records = JSON.parse(window.localStorage.getItem(RECORDS_NAME));
            this.uiHelper.finishGame(this.finalScore, this.time, this.moves, records);
        },

        /**
         * Shuffles the puzzle
         */
        shuffleGrid: function() {        
            for(let y = this.grid.length-1; y > 0; y--) {
                for(let x = this.grid[y].length-1; x > 0; x--) {
                    // skip last tile so the empty space remains there
                    if(x === this.length-1 && y === this.length-1) continue;
                    const randomCoord = this.getRandomCoord([x,y]);
                    this.swap([x,y], randomCoord);
                }
            }
            this.validatePuzzle();
        },

        /**
         * Checks whether the puzzle is solvable or not and fixes it if applicable
         */
        validatePuzzle: function() {
            const inversions = this.grid.flat().reduce((accumulator, tile, i, flatGrid) => {
                for(let k = i+1; k < flatGrid.length-1; k++) {
                    const currentTile = parseInt(tile.dataset.tileNumber);
                    const targetTile = parseInt(flatGrid[k].dataset.tileNumber);
                    if(currentTile > targetTile) {
                        accumulator++;
                    }
                }
                return accumulator;
            },0)
            if(inversions % 2 != 0) {
                this.swap([0,0],[1,0]);
            }
        },

        /**
         * Starts counting time elapsed and score
         */
        startTimer: function() {
            this.hasStarted = true;
            this.timerInterval = setInterval(() => {
                this.time += 10;
                this.score = this.score <= 0 ? 0 : this.score - 10;
            }, 10);
            this.startDisplay();
        },

        /**
         * Starts interval to refresh ui with time elapsed and score
         */
        startDisplay: function() {
            this.uiHelper.updateStats(this.time, this.score);
            if(!this.refreshInterval) {               
                this.refreshInterval = setInterval(() => {
                    this.startDisplay();
                }, 1000) // 1 sec
            }
        },

        /**
         * Generates an array with random coordinates based on a given limit
         * @param {Array} limit - Max coordinates to include
         * @returns {Array} - Coordinates array
         */
        getRandomCoord: function(limit) {
            const y = this.getRandomNumber(limit[1]);
            const xLimit = y === limit[1] ? limit[0] : this.length-1;
            const x = this.getRandomNumber(xLimit);
            return [x, y];
        },

        /**
         * Generates random number
         * @param {Number} max - Max limit (included)
         * @returns {Number} - random number
         */
        getRandomNumber: function(max) {
            return Math.floor(Math.random() * Math.floor(max+1));
        },

        /**
         * Scales a number using 2 given ranges.
         * @param {Number} value - Number to scale
         * @param {Array} inputRange - Input range
         * @param {Array} outputRange - Output range
         * @returns {Number} - Scaled number
         */
        scaleToRange: function (value, inputRange, outputRange) { 
            return (value - inputRange[0]) * (outputRange[1] - outputRange[0]) / (inputRange[1] - inputRange[0]) + outputRange[0];
        },

        /**
         * Saves score into localstorage
         */
        saveScore: function(e) {
            let records = JSON.parse(window.localStorage.getItem(RECORDS_NAME)) || [];
            const input = window.document.getElementById(INPUT_ID);
            const recordObj = {name: input.value, score: `${this.finalScore}/100`};
            records.push(recordObj);
            
            input.parentElement.style.display = 'none';
            
            window.localStorage.setItem(RECORDS_NAME,  JSON.stringify(records));
            this.uiHelper.updateSavedScores(recordObj);
        }
    }

    window.onload = function() {
        // change this to increase/decrease difficulty
        const puzzleLength = 3;
        puzzle.init(puzzleLength);
    }
})()
