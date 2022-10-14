"use strict"

// enemy count / parameters
const ENEMY_COLS = 11;  // number of columns of invaders
const ENEMY_ROWS = 5;   // number of rows of invaders
const FREE_COLS = 11;   // number of columns of free space for the invaders to move in

// all dimensions specified in columns/rows
const ENEMY_WIDTH = 4;  
const ENEMY_HEIGHT = ENEMY_WIDTH;
const ENEMY_VERTICAL_SPACING = ENEMY_HEIGHT; 
const ENEMY_HORIZONTAL_SPACING = ENEMY_WIDTH;
const PLAYER_HEIGHT = 2;
const PLAYER_WIDTH = 6;

// total number of columns on the board, useful for calculating cell size in pixels
// we don't calculate the number of rows, just stick the player at the bottom of the screen
const NUM_COLS = (ENEMY_COLS * (ENEMY_WIDTH + ENEMY_HORIZONTAL_SPACING)) + FREE_COLS;

const PLAYER_MOVE_DX = 10; // how much to move the player each key event

/* Rendering Globals */ 
let Canvas = undefined;
let Context = undefined;
let LastRender = undefined; // used to calculate time passed between updates
let ShowBoundingBoxes = false; // draws bounding boxes for game objects
let CellSize = 0;

/* Game assets */
let AlienImg = undefined; 
let PlayerImg = undefined;

/* Game Logic Globals */
let Enemies = [];
let DirectionMultiplier = 1; // 1 is right, -1 is left
let Player = undefined;
let Paused = false;

/* Geometry utility classes */
class Point {
    x;
    y;

    constructor(newX, newY) {
        this.x = newX;
        this.y = newY;
    }
}

class Bounds {
    location;
    width;
    height;

    constructor(location, width, height) {
        this.location = location;
        this.width = width;
        this.height = height;
    }

    intersects(other) {
        return (
            // left edge of this left of other right edge
            this.location.x <= other.location.x + other.width
            // right edge of this to the right of other left edge
            && this.location.x + this.width >= other.location.x
            // top of this is above the other bottom edge
            && this.location.y <= other.location.y + other.height
            // bottom edge of this is below other top edge
            && this.location.y + this.height >= other.location.y
            );
    }
}

/* class GameObject 
Generic class for an object in the game that supports geometric helpers and knows
how to render itself in the canvas.
*/

class GameObject {
    bounds;

    constructor(bounds) {
        this.bounds = bounds;
    }
    
    //if moving would move the object outside the bounds of the canvas returns true
    isMoveOutOfCanvas(dx, dy) {
        return (this.bounds.location.x + dx < 0
            || this.bounds.location.x + dx + this.bounds.width > Canvas.width
            || this.bounds.location.y + dy < 0 
            || this.bounds.location.y + dy + this.bounds.height > Canvas.height);
    }

    move(dx, dy) {
        this.bounds.location.x += dx;
        this.bounds.location.y += dy;

        return true;
    }

    render() {
        if (ShowBoundingBoxes) {
            Context.beginPath();
            Context.rect(this.bounds.location.x, this.bounds.location.y, this.bounds.width, this.bounds.height);
            Context.strokeStyle = "#FF0000";
            Context.stroke();
        }
    }
}

class Alien extends GameObject {
    constructor(startLocation){
        super(new Bounds(
            startLocation, 
            ENEMY_WIDTH * CellSize, 
            ENEMY_HEIGHT * CellSize
            ));
    }

    render() {
        super.render();
        Context.drawImage(AlienImg, 
            this.bounds.location.x, this.bounds.location.y, 
            Math.floor(CellSize * ENEMY_WIDTH), Math.floor(CellSize * ENEMY_HEIGHT));
    }
}

class PlayerShip extends GameObject {
    lives = 1;

    constructor(startLocation) {
        super(new Bounds(
            startLocation,
            PLAYER_WIDTH * CellSize,
            PLAYER_HEIGHT * CellSize
        ));
    }

    render() {
        super.render();
        Context.drawImage(PlayerImg, 
            this.bounds.location.x, this.bounds.location.y, 
            this.bounds.width, this.bounds.height);
    }
}
/*
funciton init()
Sets up the rendering context and game board
*/
function init() {
    Canvas = document.getElementById("canvas");
    Context = Canvas.getContext("2d");
    CellSize = Canvas.width / NUM_COLS;
    AlienImg = document.getElementById("alien");
    PlayerImg = document.getElementById("player");

    document.addEventListener('keydown', handleKeypress, false);

    console.log("Creating game board...")
    for (let i = 0; i < ENEMY_ROWS; i++) {
        let row = [];    
            for (let j = 0; j < ENEMY_COLS; j++) {
                row.push(new Alien(new Point(
                    j * (ENEMY_WIDTH + ENEMY_HORIZONTAL_SPACING) * CellSize,
                    i * (ENEMY_HEIGHT + ENEMY_VERTICAL_SPACING) * CellSize
                    )));
            }
    
        Enemies.push(row);
    }    

    Player = new PlayerShip(new Point(0, Canvas.height - (PLAYER_HEIGHT * CellSize)));
}

/*
funciton update(dt)
Takes the amount of time time that's passed since last render and updates the game state accordingly
*/
function update(dt) {
    let dx = dt/100 * CellSize * DirectionMultiplier;
    let dy = 0;

    let firstRow = Enemies[0];
    let enemyToBoundsCheck = DirectionMultiplier == 1 ? firstRow[firstRow.length - 1] : firstRow[0];
    if (enemyToBoundsCheck.isMoveOutOfCanvas(dx, 0)) {
        // if the enemy move would put it out of the canvas, change directions
        // and bump a row down
        DirectionMultiplier *= -1;
        dy = CellSize; // 
    }

    for (let row of Enemies) {
        for (let enemy of row) {
            (enemy.move(dx, dy));
            if (enemy.bounds.intersects(Player.bounds)) {
                Player.lives -= 1;
                console.log("Enemy hit player, new lives %d", Player.lives);
                setPaused(true);
            }
        }
    } 
}

function render() {
    Context.clearRect(0,0, Canvas.width, Canvas.height);
    for (let row of Enemies) {
        for (let enemy of row) {
            enemy.render();
        }
    }
    Player.render();
}

function renderLoop(timestamp) {
    if (LastRender == undefined) LastRender = timestamp;
    var dt = timestamp - LastRender;
  
    if (!Paused) {
        update(dt)
        render();
        LastRender = timestamp;
        window.requestAnimationFrame(renderLoop)
    }
  }

function setPaused(paused) {
    Paused = paused;
    if (!paused) {
        // we have to clear LastRender so the animation doesn't jump when rendering resumes
        LastRender = undefined; 
        window.requestAnimationFrame(renderLoop);
    }
}

function handleKeypress(event) {
    let key = event.key;
    switch (key) {
        case "ArrowRight":
            Player.move(PLAYER_MOVE_DX, 0);
            break;
        case "ArrowLeft":
            Player.move(-1 * PLAYER_MOVE_DX, 0);
            break;
        case "p":
            setPaused(!Paused);
            break;
        default:
            console.log("Other keypress: " + key);
            break;
    }
}

function main() {
    console.log('Main called');
    init();
    window.requestAnimationFrame(renderLoop);
}