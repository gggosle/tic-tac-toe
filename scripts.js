"use strict";

class Player {
    constructor(symbol) {
        this.wins = 0;
        this.symbol = symbol;
    }

    toString() {
        return this.symbol;
    }
}

class CellDir {
    constructor(r, c) {
        this.r = Number(r);
        this.c = Number(c);
    }
}

const board = document.querySelector('.board');

const info__turn = document.querySelector('.info__turn');
const info__score = document.querySelector('.info__score');
const playerX = new Player('X');
const playerO = new Player('O');
const defaultBoardWinValue = "3";
const cellsKey = 'cells';
const occurrencesNumKey = 'occurrencesNum';
const boardSizeKey = 'boardSize';
const currentPlayerKey = 'currentPlayer';
const playerXWinsKey = 'XWins';
const playerOWinsKey = 'OWins';


let screenWidth;
let screenHeight;
let boardSize;
let boardGridStyle;
let occurrencesNum;
let cells;
let currentPlayer;

resetGame();

function addCells(cells) {
    cells.forEach((row) => {
        row.forEach((cell) => {
            board.appendChild(cell);
        });
    });
}

function createCells(){
    let cells = [];

    for (let i = 0; i < boardSize; i++) {
        cells.push([]);
        for (let j = 0; j < boardSize; j++) {
            const cell = createCell();
            cell.setAttribute('row', i);
            cell.setAttribute('column', j);
            cells[i].push(cell);
        }
    }

    insertSavedCellContents(cells);

    return cells;
}

function insertSavedCellContents(cells) {
    const savedCellsContent = JSON.parse(localStorage.getItem(cellsKey));

    if(localStorage.getItem(cellsKey)) {
        cells.forEach((row, rowIndex) => {
            row.forEach((cell, cellIndex) => {
                const index = rowIndex * row.length + cellIndex;
                cell.textContent = savedCellsContent[index];
            });
        });
    }
}

function createCell() {
    const cell = document.createElement('div');

    cell.classList.add('board__cell');
    cell.addEventListener('click', handleCellClick);

    return cell;
}

function handleCellClick(event) {
    const cell = event.target;
    const cellRowIndex = cell.getAttribute('row');
    const cellColumnIndex = cell.getAttribute('column');
    if (isContent(cell)) return;

    currentPlayer.currentCellDir = new CellDir(cellRowIndex, cellColumnIndex);

    cell.textContent = currentPlayer;
    setTimeout(() => {
        handleGameResult();
        toggleCurrentPlayer();
    })
}

function handleGameResult() {
    if (isWinner(currentPlayer)) {
        win(currentPlayer);
    } else if (isBoardFull()) {
        alert("It's a draw!");
    }
}

function win(player) {
    alert(`Player ${player} wins!`);
    player.wins++;
    resetGame();
}

function resetGame() {
    if (isGameInProgress()) {
        getGameSave();
        cells = createCells();
        removeCellsFromLocal();
        handleGameResult();
    }
    else {
        startAnew();
        cells = createCells();
    }

    board.innerHTML = '';
    addCells(cells);
    updateSize();
    showScore();
    showTurn();
}

function startAnew() {
    setBoardSize();
    setOccurrencesNum();
    currentPlayer = playerO;
}

function updateSize() {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    const cellSize = calculateCellSize(boardSize);
    const fontSize = calculateFontSize(cellSize);
    const sizeUnit = getSizeUnitForCell();

    boardGridStyle = `repeat(${boardSize}, ${cellSize + sizeUnit})`;
    board.style.gridTemplateColumns = boardGridStyle;
    board.style.gridTemplateRows = boardGridStyle;

    cells.forEach((row) => {
        row.forEach((cell) => {
            cell.style.fontSize = fontSize + sizeUnit;
        })
    })
}

function setBoardSize() {
    let invalid = true;

    while (invalid) {
        boardSize = Number(prompt("Game board size, please: ", defaultBoardWinValue));
        if (boardSize >= 3 && boardSize <= 100) {
            invalid = false;
        }
    }
}

function setOccurrencesNum() {
    let invalid = true;

    while (invalid) {
        occurrencesNum = Number(prompt("How many cells to win?", defaultBoardWinValue));
        if (occurrencesNum >= 3 && occurrencesNum <= boardSize) {
            invalid = false;
        }
    }
}

function calculateCellSize(boardSize) {
    const relativeSize = Math.min(screenWidth, screenHeight);
    const maxCellSize = relativeSize / (Number(boardSize) + 1);
    return 100 * maxCellSize / relativeSize;
}

function getSizeUnitForCell() {
    return screenWidth > screenHeight ? 'vh' : 'vw';
}

function calculateFontSize(cellSize) {
    return cellSize * 90 / 100;
}

function toggleCurrentPlayer() {
    currentPlayer = currentPlayer === playerO ? playerX : playerO;
    showTurn()
}

function showTurn() {
    info__turn.innerHTML = `Turn: ${currentPlayer}`;
}

function showScore() {
    info__score.innerHTML = `Player X: ${playerX.wins}, Player O: ${playerO.wins}`;
}

function isWinner(player) {
    const rowCombos = [[0, 1], [0, -1]];
    const columnCombos = [[1, 0], [-1, 0]];
    const diagCombos = [[1, 1], [-1, -1]];
    const antiDiagCombos = [[1, -1], [-1, 1]];
    const allCombos = [rowCombos, columnCombos, diagCombos, antiDiagCombos];
    let count = 1;

    if (!player.currentCellDir) {
        return false;
    }

    return allCombos.some((combo) => {
        combo.forEach((template) => {
            const cell =  Object.assign({}, player.currentCellDir,{ symbol: player.symbol });

            count += checkInTheDirectionOf(template, cell, 0);
        });

        if (count >= occurrencesNum) {
            return true;
        }
        else {
            count = 1;
        }
    });
}

function checkInTheDirectionOf(template, cell, count) {
    //TODO can make it shorter with for loop in a place of recursion; :(
    const newRowIndex = cell.r + template[0];
    const newColumnIndex = cell.c + template[1];
    const cellExists = !!(cells[newRowIndex] && cells[newRowIndex][newColumnIndex]);
    const countSatisfies = count === occurrencesNum - 1;

    cell.r = newRowIndex;
    cell.c = newColumnIndex;

    if (cellExists && isContentEqual(cells[newRowIndex][newColumnIndex], cell.symbol) && !countSatisfies) {
        return checkInTheDirectionOf(template, cell, count + 1);
    }

    return count;
}

function isBoardFull() {
    return cells.every(cell => !isContent(cell));
}

function isContent(cell) {
    return cell.textContent !== '';
}

function isContentEqual(cell, str) {
    return cell.textContent === str;
}

function getGameSave() {
    const playerSymbol = localStorage.getItem(currentPlayerKey);

    currentPlayer = getPlayerBySymbol(playerSymbol);
    occurrencesNum = localStorage.getItem(occurrencesNumKey);
    boardSize = localStorage.getItem(boardSizeKey);
    playerX.wins = localStorage.getItem(playerXWinsKey);
    playerO.wins = localStorage.getItem(playerOWinsKey);
}

function getPlayerBySymbol(symbol) {
    return symbol === 'X' ? playerX : playerO;
}

function saveGame() {
    localStorage.setItem(cellsKey, JSON.stringify(getCellsContent()));
    localStorage.setItem(occurrencesNumKey, occurrencesNum);
    localStorage.setItem(boardSizeKey, boardSize);
    localStorage.setItem(currentPlayerKey, currentPlayer);
    localStorage.setItem(playerXWinsKey, playerX.wins);
    localStorage.setItem(playerOWinsKey, playerO.wins);
}

function removeCellsFromLocal() {
    localStorage.removeItem(cellsKey);
}

function isGameInProgress() {
    return !!localStorage.getItem(cellsKey);
}

function getCellsContent() {
    const cellsContent = [];

    cells.forEach((row) => {
        row.forEach((cell) => {
            cellsContent.push(cell.textContent);
        })
    })

    return cellsContent;
}

window.addEventListener("beforeunload", saveGame);
window.addEventListener("resize", updateSize);

