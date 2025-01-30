const defaults = {};
defaults.rowSize = 30;
defaults.colSize = 24;
defaults.playerPos = [2, 3];
defaults.snakePos = JSON.stringify([
    [
        [defaults.colSize - 3, defaults.rowSize - 4],
        [defaults.colSize - 3, defaults.rowSize - 5],
    ],
    [
        [2, defaults.rowSize - 4],
        [2, defaults.rowSize - 5],
    ],
]);

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const tileSize = 24;
canvas.width = defaults.rowSize * tileSize;
canvas.height = defaults.colSize * tileSize;

const playerChar = "ῧ";
const snakeHeadChar = "ϔ";
const snakeTailChar = "*";
const tokenChar = "#";
const blankChar = " ";
const wallChar = "█";

let gameState = 0;
let gameTick = 0;
let rowSize = defaults.rowSize;
let colSize = defaults.colSize;

let heldDir = [false, false, false, false];

let playerPos = defaults.playerPos;
let snakePos = JSON.parse(defaults.snakePos);
let tokenPos = [];
let tokensCollected = 0;

let tickTimer = null;
let board = [];
updateBoard();
drawBoard();

function reset() {
    clearTimeout(tickTimer);

    gameState = 0;
    gameTick = 0;
    rowSize = defaults.rowSize;
    colSize = defaults.colSize;

    playerPos = defaults.playerPos;
    snakePos = JSON.parse(defaults.snakePos);
    tokenPos = [];
    tokensCollected = 0;

    document.getElementById("game-over-text").innerHTML = "";

    updateBoard();
    drawBoard();

    document.getElementById("start").click();
}

function tick() {
    if (tokenPos.length === 0) spawnToken();

    if (gameTick % 1 === 0) {
        if (heldDir[0]) handleStep(playerPos, [playerPos[0] - 1, playerPos[1]]);
        else if (heldDir[1])
            handleStep(playerPos, [playerPos[0], playerPos[1] + 1]);
        else if (heldDir[2])
            handleStep(playerPos, [playerPos[0] + 1, playerPos[1]]);
        else if (heldDir[3])
            handleStep(playerPos, [playerPos[0], playerPos[1] - 1]);
    }

    if (gameTick % 1 === 0) {
        moveSnakes();
    }

    drawBoard();

    gameTick++;
    if (gameState === 1) tickTimer = setTimeout(tick, 33);
    if (gameState === 2) {
        drawBoard();
        document.getElementById("game-over-text").innerHTML =
            "GAME OVER  Tokens Collected: " + tokensCollected;
    }
}

function updateBoard() {
    let b = [];

    for (let y = 0; y < colSize; y++) {
        //fill
        b[y] = [];
        for (let x = 0; x < rowSize; x++) {
            if (y === 0 || y === colSize - 1 || x === 0 || x === rowSize - 1) {
                //boarder
                b[y][x] = wallChar;
            } else {
                b[y][x] = blankChar;
            }
            if (gameState === 2) {
                b[y][x] = wallChar;
            }
        }
    }

    b[playerPos[0]][playerPos[1]] = playerChar;
    if (tokenPos.length !== 0) b[tokenPos[0]][tokenPos[1]] = tokenChar;

    for (let snakeIndex = 0; snakeIndex < snakePos.length; snakeIndex++) {
        for (
            let snakePart = 0;
            snakePart < snakePos[snakeIndex].length;
            snakePart++
        ) {
            if (snakePart === snakePos[snakeIndex].length - 1) {
                b[snakePos[snakeIndex][snakePart][0]][
                    snakePos[snakeIndex][snakePart][1]
                ] = snakeHeadChar;
            } else {
                b[snakePos[snakeIndex][snakePart][0]][
                    snakePos[snakeIndex][snakePart][1]
                ] = snakeTailChar;
            }
        }
    }

    board = b;
}

function drawBoard() {
    //display
    /* TEXT BASED
    boardHTML = ""

    for (let y = 0; y < rowSize; y++) {
        for (let x = 0; x < colSize; x++) {
        boardHTML += b[y][x]
        }
        boardHTML += "<br>"
    }
    document.getElementById("board").innerHTML = boardHTML
    */

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.font = "20px Arial";

    let tileX = 0;
    let tileY = 0;

    for (let y = 0; y < colSize; y++) {
        for (let x = 0; x < rowSize; x++) {
            if (board[y][x] === blankChar && (x + y) % 2 === 0) {
                ctx.fillStyle = "#f1f1f1";
                ctx.fillRect(tileX, tileY, tileSize, tileSize);
            }

            let txt = "";
            if (board[y][x] === wallChar) txt = "🔲";
            if (board[y][x] === playerChar) txt = "😂";
            if (board[y][x] === snakeHeadChar) txt = "🐉";
            if (board[y][x] === snakeTailChar) txt = "🔥";
            if (board[y][x] === tokenChar) txt = "👑";

            ctx.fillText(
                txt,
                tileX + tileSize / 2 - ctx.measureText(txt).width / 2,
                tileY + tileSize / 2 + 7
            );
            tileX += tileSize;
        }
        tileX = 0;
        tileY += tileSize;
    }
}

//controls
document.addEventListener("keydown", function (event) {
    if (event.key === "ArrowUp") heldDir[0] = true;
    if (event.key === "ArrowRight") heldDir[1] = true;
    if (event.key === "ArrowDown") heldDir[2] = true;
    if (event.key === "ArrowLeft") heldDir[3] = true;
});
document.addEventListener("keyup", function (event) {
    if (event.key === "ArrowUp") heldDir[0] = false;
    if (event.key === "ArrowRight") heldDir[1] = false;
    if (event.key === "ArrowDown") heldDir[2] = false;
    if (event.key === "ArrowLeft") heldDir[3] = false;
});

document.getElementById("start").addEventListener("click", function (event) {
    if (gameState === 0) {
        gameState = 1;
        tick();
    }
});
document.getElementById("stop").addEventListener("click", function (event) {
    if (gameState === 1) gameState = 0;
});
document.getElementById("reset").addEventListener("click", function (event) {
    reset();
});

function handleStep(currentPos, stepPos) {
    if (board[stepPos[0]][stepPos[1]] === blankChar) {
        board[currentPos[0]][currentPos[1]] = blankChar;
        playerPos = stepPos;
        updateBoard();
    } else if (
        board[stepPos[0]][stepPos[1]] === snakeHeadChar ||
        board[stepPos[0]][stepPos[1]] === snakeTailChar
    ) {
        gameState = 2;
    } else if (board[stepPos[0]][stepPos[1]] === tokenChar) {
        tokensCollected++;
        tokenPos = [];
        elongateSnakes();
    }
}

function moveSnakes() {
    //for (let snakeIndex = 0; snakeIndex < snakePos.length; snakeIndex++) {
    let snakeIndex = Math.floor(Math.random() * snakePos.length);
    let headPos = snakePos[snakeIndex][snakePos[snakeIndex].length - 1];
    let playerDir = [false, false, false, false];
    if (playerPos[0] < headPos[0]) playerDir[0] = true;
    if (playerPos[1] > headPos[1]) playerDir[1] = true;
    if (playerPos[0] > headPos[0]) playerDir[2] = true;
    if (playerPos[1] < headPos[1]) playerDir[3] = true;

    let validPlayerDirs = [];

    if (getValidPos(charPosNearby(headPos, playerChar)).length > 0) {
        gameState = 2;
    } else {
        let blankCharPosNearby = charPosNearby(headPos, blankChar);
        for (let i = 0; i < playerDir.length; i++) {
            if (playerDir[i])
                if (blankCharPosNearby[i] !== null)
                    validPlayerDirs.push(blankCharPosNearby[i]);
        }

        if (validPlayerDirs.length > 0) {
            shiftSnake(snakePos[snakeIndex], getRandomElement(validPlayerDirs));
        } else {
            let validDirs = getValidPos(charPosNearby(headPos, blankChar));
            if (validDirs.length > 0)
                shiftSnake(snakePos[snakeIndex], getRandomElement(validDirs));
        }
    }
    updateBoard();
    //}

    function shiftSnake(snake, pos) {
        snake.push([pos[0], pos[1]]);
        snake.splice(0, 1);
    }
}

function spawnToken() {
    let newTokenPos = [
        Math.floor(Math.random() * (colSize - 2)) + 1,
        Math.floor(Math.random() * (rowSize - 2)) + 1,
    ];
    if (board[newTokenPos[0]][newTokenPos[1]] === blankChar) {
        tokenPos = newTokenPos;
        updateBoard();
    }
}

function elongateSnakes() {
    for (let snakeIndex = 0; snakeIndex < snakePos.length; snakeIndex++) {
        let tailPos = snakePos[snakeIndex][0];
        let validDirs = getValidPos(charPosNearby(tailPos, blankChar));

        if (validDirs.length > 0)
            snakePos[snakeIndex].unshift(getRandomElement(validDirs));
    }
    updateBoard();
}

function charPosNearby(pos, char) {
    let nearbyPos = [null, null, null, null];
    if (board[pos[0] - 1][pos[1]] === char) nearbyPos[0] = [pos[0] - 1, pos[1]]; //north
    if (board[pos[0]][pos[1] + 1] === char) nearbyPos[1] = [pos[0], pos[1] + 1]; //east
    if (board[pos[0] + 1][pos[1]] === char) nearbyPos[2] = [pos[0] + 1, pos[1]]; //south
    if (board[pos[0]][pos[1] - 1] === char) nearbyPos[3] = [pos[0], pos[1] - 1]; //west
    return nearbyPos;
}

function getValidPos(nearbyPos) {
    let validPos = [];
    for (let i = 0; i < nearbyPos.length; i++) {
        if (nearbyPos[i] !== null) validPos.push(nearbyPos[i]);
    }
    return validPos;
}

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
