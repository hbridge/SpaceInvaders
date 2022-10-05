"use strict"

const ENEMY_COLS = 11;
const ENEMY_ROWS = 5;
const FREE_COLS = 11;
const ENEMY_WIDTH = 4;
const ENEMY_HEIGHT = ENEMY_WIDTH;
const ENEMY_SPACING = ENEMY_WIDTH;
const VERTICAL_SPACE_FACTOR = 2;
const PLAYER_HEIGHT = 2;
const PLAYER_WIDTH = 6;
const PLAYER_SENTINEL = "A";

const NUM_COLS = (ENEMY_COLS * (ENEMY_WIDTH + ENEMY_SPACING)) + FREE_COLS;
const NUM_ROWS = (ENEMY_ROWS * (ENEMY_HEIGHT + ENEMY_SPACING)) * VERTICAL_SPACE_FACTOR;

let GameBoard = [];

function initGameBoard() {
    console.log("Creating game board...")
    GameBoard = [];
    for (let i = 0; i < NUM_ROWS; i++) {
        let row = [];
        if (i % (ENEMY_HEIGHT + ENEMY_SPACING) == 0 &&
            i / (ENEMY_HEIGHT + ENEMY_SPACING) < ENEMY_ROWS) {
            for (let j = 0; j < NUM_COLS; j++) {
                if (j % (ENEMY_WIDTH + ENEMY_SPACING) == 0) {
                    row.push(i/(ENEMY_WIDTH + ENEMY_SPACING) + 1); // differentiate between types of enemy
                } else {
                    row.push(0);
                }
            }
        } else if (i >= NUM_ROWS - PLAYER_HEIGHT) { // the last 2 rows are for the player
            for (let j = 0; j < NUM_COLS; j++) {
                if (j < PLAYER_WIDTH) {
                    row.push(PLAYER_SENTINEL);
                } else {
                    row.push(0);
                }
            }
        } else {
            //we're in between rows, just push a row of zeroes
            for (let j = 0; j < NUM_COLS; j++) row.push(0);
        }
        
        GameBoard.push(row);
    }    
}

function boardToString(board, transform = undefined) {
    let result = "";
    for (let i = 0; i < board.length; i++) {
        const row = board[i];
        for (let j = 0; j < row.length; j++) {
            let toPrint = board[i][j];
            if (transform) toPrint = transform(board[i][j]);
            result += (toPrint);
        }
        result += ("\n");
    }
    return result;
}

function main() {
    console.log('Main called');
    initGameBoard();
    document.getElementById("board").innerText = boardToString(GameBoard);
}