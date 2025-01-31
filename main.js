const defaults = {};
defaults.rowSize = 30;
defaults.colSize = 24;
defaults.playerPos = [3, 3];
defaults.snakePos = JSON.stringify([
    [
        [defaults.colSize - 4, defaults.rowSize - 4],
        [defaults.colSize - 4, defaults.rowSize - 5],
    ],
    [
        [3, defaults.rowSize - 4],
        [3, defaults.rowSize - 5],
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

let autoReset = false;
let gameState = 0;
let gameTick = 0;
let rowSize = defaults.rowSize;
let colSize = defaults.colSize;

let heldDir = [false, false, false, false];

let playerPos = defaults.playerPos;
let snakePos = JSON.parse(defaults.snakePos);
let recentBites = [];
let recentDeaths = [];
let tokenPos = [];
let tokensCollected = 0;
let spawnedSnakes = 2;
let matchNum = 1;
let matchHistory = [];

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
    recentBites = [];
    recentDeaths = [];
    tokenPos = [];

    matchHistory.push([matchNum, tokensCollected, spawnedSnakes]);
    matchHistory.sort((a, b) => b[1] - a[1]);

    document.getElementById("match-history").innerHTML = "";
    matchHistory.forEach((match) => {
        document.getElementById("match-history").innerHTML +=
            "[" + match[0] + "] 👑: " + match[1] + " 🐉: " + match[2] + "<br>";
    });

    tokensCollected = 0;
    spawnedSnakes = 2;
    matchNum++;

    document.getElementById("game-over-text").innerHTML = "";

    updateBoard();
    drawBoard();

    document.getElementById("start-stop").click();
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
        addRecentDeath(playerPos);
        drawBoard();
        document.getElementById("game-over-text").innerHTML =
            "⚰️GAME OVER⚰️<br>Crowns👑: " +
            tokensCollected +
            "<br>Dragons🐉: " +
            spawnedSnakes;
        if (autoReset) {
            document.getElementById("auto-reset-icon").innerHTML = "🔄";
            setTimeout(() => {
                document.getElementById("auto-reset-icon").innerHTML = "";
                document.getElementById("reset").click();
            }, 2000);
        }
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
            if (board[y][x] === wallChar || (x + y) % 2 === 0) {
                ctx.fillStyle = "#e7eff1";
                ctx.fillRect(tileX, tileY, tileSize, tileSize);
            }

            let txt = "";
            if (board[y][x] === wallChar) txt = "🔲";
            if (board[y][x] === playerChar) txt = "🤴";
            if (board[y][x] === snakeHeadChar) txt = "🐉";
            if (board[y][x] === snakeTailChar) txt = "🔥";
            if (board[y][x] === tokenChar) txt = "👑";

            ctx.fillText(
                txt,
                tileX + tileSize / 2 - ctx.measureText(txt).width / 2,
                tileY + tileSize / 1.25
            );
            tileX += tileSize;
        }
        tileX = 0;
        tileY += tileSize;
    }

    //bites
    ctx.font = "27px Arial";
    txt = "💥";
    for (let bite = 0; bite < recentBites.length; bite++) {
        ctx.fillText(
            txt,
            recentBites[bite][1] * tileSize +
                (tileSize / 2 - ctx.measureText(txt).width / 2),
            recentBites[bite][0] * tileSize + tileSize / 1.15
        );
    }
    //deaths
    txt = "⚰️";
    for (let death = 0; death < recentDeaths.length; death++) {
        ctx.fillText(
            txt,
            recentDeaths[death][1] * tileSize +
                (tileSize / 2 - ctx.measureText(txt).width / 2),
            recentDeaths[death][0] * tileSize + tileSize / 1.15
        );
    }
}

//controls
document.addEventListener("keydown", function (event) {
    if (event.key === "w") heldDir[0] = true;
    if (event.key === "d") heldDir[1] = true;
    if (event.key === "s") heldDir[2] = true;
    if (event.key === "a") heldDir[3] = true;
    if (event.key === "r") document.getElementById("reset").click();
    if (event.key === "Escape") document.getElementById("start-stop").click();
});
document.addEventListener("keyup", function (event) {
    if (event.key === "w") heldDir[0] = false;
    if (event.key === "d") heldDir[1] = false;
    if (event.key === "s") heldDir[2] = false;
    if (event.key === "a") heldDir[3] = false;
});

document
    .getElementById("start-stop")
    .addEventListener("click", function (event) {
        if (gameState === 0) {
            gameState = 1;
            tick();
        } else if (gameState === 1) gameState = 0;
    });

document.getElementById("reset").addEventListener("click", function (event) {
    reset();
});
document
    .getElementById("auto-reset")
    .addEventListener("click", function (event) {
        if (autoReset) {
            document.getElementById("auto-reset").innerHTML = "Auto Reset: OFF";
            autoReset = false;
        } else {
            document.getElementById("auto-reset").innerHTML = "Auto Reset: ON";
            autoReset = true;
        }
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
    const snakeIndex = Math.floor(Math.random() * snakePos.length);
    const currentSnake = snakePos[snakeIndex];
    const headPos = currentSnake[currentSnake.length - 1];
    let playerDir = [false, false, false, false];
    if (playerPos[0] < headPos[0]) playerDir[0] = true;
    if (playerPos[1] > headPos[1]) playerDir[1] = true;
    if (playerPos[0] > headPos[0]) playerDir[2] = true;
    if (playerPos[1] < headPos[1]) playerDir[3] = true;

    let validPlayerDirPos = [];

    if (removeNulls(charPosNearby(headPos, playerChar)).length > 0) {
        gameState = 2; //near player end game
    } else {
        let blankCharPosNearby = charPosNearby(headPos, blankChar);
        for (let i = 0; i < playerDir.length; i++) {
            if (playerDir[i])
                if (blankCharPosNearby[i] !== null)
                    validPlayerDirPos.push(blankCharPosNearby[i]);
        }

        if (validPlayerDirPos.length > 0) {
            //move to blank towards player
            shiftSnake(currentSnake, getRandomElement(validPlayerDirPos));
        } else {
            let validBlankPos = removeNulls(charPosNearby(headPos, blankChar));
            let validSnakePos = removeNulls(
                charPosNearby(headPos, snakeTailChar)
                    .filter((pos) => !currentSnake.includes(pos))
                    .concat(charPosNearby(headPos, snakeHeadChar))
            );

            if (validSnakePos.length > 0 && Math.random() < 0.5) {
                let bitePos = getRandomElement(validSnakePos);
                biteSnake(snakeIndex, bitePos);
                shiftSnake(currentSnake, bitePos);
            } else if (validBlankPos.length > 0)
                //move to any blank
                shiftSnake(currentSnake, getRandomElement(validBlankPos));
        }
    }
    updateBoard();
    //}

    function biteSnake(bitingSnakeIndex, pos) {
        for (let snakeIndex = 0; snakeIndex < snakePos.length; snakeIndex++) {
            if (snakeIndex !== bitingSnakeIndex) {
                let currentSnake = snakePos[snakeIndex];
                let snakeLength = currentSnake.length;
                for (let snakePart = 0; snakePart < snakeLength; snakePart++) {
                    if (
                        currentSnake[snakePart][0] === pos[0] &&
                        currentSnake[snakePart][1] === pos[1]
                    ) {
                        if (snakePart === snakeLength - 1) {
                            //kill snake if head
                            addRecentDeath(currentSnake[snakePart]);
                            snakePos.splice(snakeIndex, 1);
                        } else {
                            let newSnake = currentSnake.splice(0, snakePart);
                            currentSnake.splice(0, 1);

                            if (currentSnake.length < 2) {
                                //original snake too short, kill
                                addRecentDeath(
                                    currentSnake[currentSnake.length - 1]
                                );
                                snakePos.splice(snakeIndex, 1);
                            }
                            if (newSnake.length > 1) {
                                // new snake
                                snakePos.push(newSnake.reverse());
                                spawnedSnakes++;
                            }
                        }
                        if (snakePos.length < 2) {
                            //always at least 2 snakes
                            let defaultSnakes = JSON.parse(defaults.snakePos);
                            snakePos.push(
                                defaultSnakes[
                                    Math.floor(
                                        Math.random() * defaultSnakes.length
                                    )
                                ]
                            );
                            spawnedSnakes++;
                        }
                        recentBites.push(pos);
                        setTimeout(() => {
                            recentBites.splice(0, 1);
                        }, 600);

                        snakePart = 999;
                        snakeIndex = 999;
                    }
                }
            }
        }
    }

    function shiftSnake(snake, pos) {
        snake.push([pos[0], pos[1]]);
        snake.splice(0, 1);
    }
}

function addRecentDeath(pos) {
    recentDeaths.push(pos);
    setTimeout(() => {
        recentDeaths.splice(0, 1);
    }, 600);
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
    for (let loops = 0; loops < 2; loops++) {
        for (let snakeIndex = 0; snakeIndex < snakePos.length; snakeIndex++) {
            let tailPos = snakePos[snakeIndex][0];
            let validDirs = removeNulls(charPosNearby(tailPos, blankChar));

            if (validDirs.length > 0)
                snakePos[snakeIndex].unshift(getRandomElement(validDirs));
        }
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

function removeNulls(arr) {
    let newArr = [];
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] !== null) newArr.push(arr[i]);
    }
    return newArr;
}

function getRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
