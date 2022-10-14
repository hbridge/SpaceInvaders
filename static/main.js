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

const PLAYER_MOVE_DX = 10;

let Canvas = undefined;
let Context = undefined;
let CellSize = 0;

let AlienImg = undefined;
let PlayerImg = undefined;

let ShowBoundingBoxes = false;

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

function handleKeypress(event) {
    var name = event.key;
    //var code = event.code;
    //console.log(`Key pressed ${name} \r\n Key code value: ${code}`);
    switch (name) {
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
            console.log("Other keypress: " + name);
            break;
    }
}


let Enemies = [];
let Player = undefined;
let Paused = false;

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
                    j * (ENEMY_WIDTH + ENEMY_SPACING) * CellSize,
                    i * (ENEMY_HEIGHT + ENEMY_SPACING) * CellSize
                    )));
            }
    
        Enemies.push(row);
    }    

    Player = new PlayerShip(new Point(0, Canvas.height - (PLAYER_HEIGHT * CellSize)));
}

let DirectionMultiplier = 1; // 1 is right, -1 is left
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

let lastRender = undefined;
function renderLoop(timestamp) {
    if (lastRender == undefined) lastRender = timestamp;
    var progress = timestamp - lastRender;
  
    if (!Paused) {
        update(progress)
        render();
        lastRender = timestamp;
        window.requestAnimationFrame(renderLoop)
    }
  }

function setPaused(paused) {
    Paused = paused;
    if (!paused) {
        // we have to clear lastRender so the animation doesn't jump when rendering resumes
        lastRender = undefined; 
        window.requestAnimationFrame(renderLoop);
    }
}

function main() {
    console.log('Main called');
    init();
    window.requestAnimationFrame(renderLoop);
}