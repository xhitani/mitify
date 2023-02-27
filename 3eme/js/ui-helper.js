(function() {
    'use strict';

    const PUZZLE_ID = 'puzzle';
    const TILE_CLASS = 'Tile';
    const TILE_TAG_CLASS = 'Tile-tag';
    const FINAL_SCREEN_CLASS = 'FinalScreen';
    const FINAL_SCREEN_OPEN_CLASS = 'FinalScreen--open';
    const USER_STATS_CLASS = 'UserStats';
    const SAVED_SCORES_ID = 'saved-scores';
    const SCORE = 0;
    const TIME = 1;
    const MOVES = 2;
    
    const puzzle = window.puzzle;

    puzzle.uiHelper = {
        /**
         * Tile size
         * @type {Number} 
         */
        tileSize: undefined,

        /**
         * Puzzle grid. 2D array containing all the tiles + empty space
         * @type {HTMLElement} 
         */
        puzzleEl: undefined,

        /**
         * Setups config values to calculate grid coordinates
         * @param  {Number} gridLength - Grid length
         */
        init:function(gridLength) {
            this.puzzleEl = window.document.getElementById(PUZZLE_ID);
            this.tileSize = this.puzzleEl.offsetWidth / gridLength;
        },

        /**
         * Creates an html element representing a tile in the puzzle  
         * @param  {Array} coords - x & y coordinates in order to set up the image
         * @param {Number} tileCounter - Number that shows the user friendly order within the grid
         * @returns {HTMLElement} - Puzzle tile dom element
         */
        createTile: function(coords, tileCounter) {
            const xOffset = coords[0] * this.tileSize;
            const yOffset = coords[1] * this.tileSize;

            const tile = window.document.createElement('div');
            tile.className = TILE_CLASS;
            tile.style.width = `${this.tileSize}px`;
            tile.style.height = `${this.tileSize}px`;
            tile.style.backgroundPosition = `${-xOffset}px ${-yOffset}px`;
            // init position
            tile.style.top = `${yOffset}px`;
            tile.style.left = `${xOffset}px`;

            tile.dataset.currentCoords = coords.join(',');
            tile.dataset.finalCoords = coords.join(',');
            tile.dataset.tileNumber = tileCounter;

            tile.innerHTML = `<span class="${TILE_TAG_CLASS}">${tileCounter}</span>`;

            this.puzzleEl.appendChild(tile);
            return tile;
        },

        /**
         * Updates the tile position in the puzzle according to the given coordinates
         * @param  {HTMLElement} tile - Puzzle tile
         * @param  {Array} coords - Coordinates array
         */
        updateTile: function(tile, coords) {
            tile.dataset.currentCoords = coords.join(',');

            const xOffset = coords[0] * this.tileSize;
            const yOffset = coords[1] * this.tileSize;

            tile.style.top = `${yOffset}px`;
            tile.style.left = `${xOffset}px`;
        },

        /**
         * Updates the user stats
         * @param {Number} time - Time elapsed in ms
         * @param {Number} score - Current score
         */
        updateStats: function(time, score) {
            const statsContainers = window.document.querySelectorAll(`.${USER_STATS_CLASS} dd`);
            statsContainers[TIME].innerHTML = this.convertToHms(time);
            statsContainers[SCORE].innerHTML = score;
        },

        /**
         * Updates the moves counter to show the moves made by the user
         * @param {Number} moves - Tile moves 
         */
        updateMoves: function(moves) {
            const statsContainers = window.document.querySelectorAll(`.${USER_STATS_CLASS} dd`);
            statsContainers[MOVES].innerHTML = moves; 
        },

        /**
         * Converts ms to h:m:s
         * @param {Number} moves - Tile moves 
         * @returns {String} 
         */
        convertToHms: function(time) {
            const date = new Date(null);
            date.setSeconds(time/1000);

            return `${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`;
        },

        /**
         * Shows the final screen whenever the user wins
         * @param {Number} score - Scaled score
         * @param {Number} time - Elapsed time in ms
         * @param {Number} moves - Moves performed by the user
         * @param {object} records - Games saved by the user
         */
        finishGame: function(score, time, moves, records) {
            const screen = window.document.getElementsByClassName(FINAL_SCREEN_CLASS)[0];
            const statsContainers = screen.querySelectorAll('dd');
            statsContainers[TIME].innerHTML = this.convertToHms(time);
            statsContainers[SCORE].innerHTML = `${score}/100`;
            statsContainers[MOVES].innerHTML = moves;
            screen.classList.add(FINAL_SCREEN_OPEN_CLASS);
            
            records && this.addSavedScores(records);
        },

        /**
         * Adds the saved records to the users stats screen
         * @param {Array} records - Array of objects containing saved data
         */
        addSavedScores: function(records) {
            const savedScores = window.document.getElementById(SAVED_SCORES_ID);
            records.map((record) => {
                const recordEl = window.document.createElement('div'); 
                recordEl.innerHTML = `${record.name}: ${record.score}`;
                savedScores.appendChild(recordEl);
            });
        },

        /**
         * Updates saved records
         * @param {object} record - record object {name: '', score: ''}
         */
        updateSavedScores: function(record) {
            const savedScores = window.document.getElementById(SAVED_SCORES_ID);
            const recordEl = window.document.createElement('div'); 
            recordEl.innerHTML = `${record.name}: ${record.score}`;
            savedScores.appendChild(recordEl);
        }
    }
})();
