const board = document.getElementById("board");
const currentTurnDisplay = document.getElementById("current-turn");
const restartButton = document.getElementById("restart-button");
let draggedPiece = null;
let sourceSquare = null;
let currentTurn = "White";

// Stukken definiëren
const pieces = {
    white: { pawn: "♙", rook: "♖", knight: "♘", bishop: "♗", queen: "♕", king: "♔" },
    black: { pawn: "♟", rook: "♜", knight: "♞", bishop: "♝", queen: "♛", king: "♚" }
};

// Bord maken en stukken plaatsen
function createBoard() {
    board.innerHTML = ""; // Leeg het bord
    document.getElementById("captured-white").innerHTML = "Captured by White:";
    document.getElementById("captured-black").innerHTML = "Captured by Black:";

    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const square = document.createElement("div");
            square.classList.add("square", (row + col) % 2 === 0 ? "light" : "dark");
            square.dataset.row = row;
            square.dataset.col = col;

            square.addEventListener("dragover", handleDragOver);
            square.addEventListener("drop", handleDrop);

            board.appendChild(square);

            // Voeg stukken toe
            if (row === 1) addPiece(square, pieces.black.pawn, "black");
            if (row === 6) addPiece(square, pieces.white.pawn, "white");

            if (row === 0 || row === 7) {
                const pieceSet = row === 0 ? pieces.black : pieces.white;
                const color = row === 0 ? "black" : "white";
                if (col === 0 || col === 7) addPiece(square, pieceSet.rook, color);
                if (col === 1 || col === 6) addPiece(square, pieceSet.knight, color);
                if (col === 2 || col === 5) addPiece(square, pieceSet.bishop, color);
                if (col === 3) addPiece(square, pieceSet.queen, color);
                if (col === 4) addPiece(square, pieceSet.king, color);
            }
        }
    }
    currentTurn = "White";
    currentTurnDisplay.textContent = currentTurn;
}

function addPiece(square, symbol, color) {
    const piece = document.createElement("div");
    piece.textContent = symbol;
    piece.classList.add("piece");
    piece.dataset.color = color;
    piece.dataset.type = symbol === "♔" || symbol === "♚" ? "king" :
                        symbol === "♕" || symbol === "♛" ? "queen" :
                        symbol === "♖" || symbol === "♜" ? "rook" :
                        symbol === "♗" || symbol === "♝" ? "bishop" :
                        symbol === "♘" || symbol === "♞" ? "knight" :
                        "pawn";
    piece.draggable = true;

    piece.addEventListener("dragstart", handleDragStart);
    square.appendChild(piece);
}

// Drag-and-drop events
function handleDragStart(event) {
    draggedPiece = event.target;
    sourceSquare = draggedPiece.parentElement;

    // Controleer of het stuk bij de huidige beurt hoort
    if (draggedPiece.dataset.color !== currentTurn.toLowerCase()) {
        event.preventDefault();
        alert(`Het is de beurt van ${currentTurn}!`);
        draggedPiece = null;
        sourceSquare = null;
    }
}

function handleDragOver(event) {
    event.preventDefault();
}

function handleDrop(event) {
    const targetSquare = event.target.classList.contains("square") ? event.target : event.target.parentElement;

    const targetRow = parseInt(targetSquare.dataset.row);
    const targetCol = parseInt(targetSquare.dataset.col);
    const sourceRow = parseInt(sourceSquare.dataset.row);
    const sourceCol = parseInt(sourceSquare.dataset.col);

    const pieceType = draggedPiece.dataset.type;

    if (isValidMove(pieceType, sourceRow, sourceCol, targetRow, targetCol)) {
        const originalPiece = targetSquare.firstChild;

        // Controleer of er een stuk op het doelsquare staat
        if (originalPiece && originalPiece.dataset.color !== draggedPiece.dataset.color) {
            capturePiece(originalPiece); // Voeg geslagen stuk toe aan captures
            targetSquare.innerHTML = ""; // Verwijder geslagen stuk van het bord
        }

        // Zet uitvoeren
        targetSquare.appendChild(draggedPiece);
        sourceSquare.innerHTML = "";

        // Wissel beurt
        currentTurn = currentTurn === "White" ? "Black" : "White";
        currentTurnDisplay.textContent = currentTurn;

    } else {
        alert("Ongeldige zet!");
    }
}

// Controleer geldige zetten
function isValidMove(type, sourceRow, sourceCol, targetRow, targetCol) {
    const rowDiff = targetRow - sourceRow;
    const colDiff = targetCol - sourceCol;
    const targetSquare = getSquare(targetRow, targetCol);
    const targetPiece = targetSquare && targetSquare.firstChild;

    switch (type) {
        case "pawn":
            const direction = draggedPiece.dataset.color === "white" ? -1 : 1;
            const startRow = draggedPiece.dataset.color === "white" ? 6 : 1;

            if (
                colDiff === 0 && // Vooruit bewegen
                rowDiff === direction &&
                !targetPiece
            ) return true;

            if (
                colDiff === 0 &&
                rowDiff === 2 * direction &&
                sourceRow === startRow &&
                !targetPiece &&
                isSquareEmpty(sourceRow + direction, sourceCol)
            ) return true;

            if (
                Math.abs(colDiff) === 1 && // Diagonaal slaan
                rowDiff === direction &&
                targetPiece &&
                targetPiece.dataset.color !== draggedPiece.dataset.color
            ) return true;

            return false;

        case "rook":
            return (
                (rowDiff === 0 || colDiff === 0) &&
                !isPathBlocked(sourceRow, sourceCol, targetRow, targetCol)
            );
        case "knight":
            return (
                (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 1) ||
                (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 2)
            );
        case "bishop":
            return (
                Math.abs(rowDiff) === Math.abs(colDiff) &&
                !isPathBlocked(sourceRow, sourceCol, targetRow, targetCol)
            );
        case "queen":
            return (
                (rowDiff === 0 || colDiff === 0 || Math.abs(rowDiff) === Math.abs(colDiff)) &&
                !isPathBlocked(sourceRow, sourceCol, targetRow, targetCol)
            );
        case "king":
            return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;
        default:
            return false;
    }
}

// Helper functies
function isPathBlocked(sourceRow, sourceCol, targetRow, targetCol) {
    if (draggedPiece.dataset.type === "knight") return false;

    const rowStep = targetRow > sourceRow ? 1 : targetRow < sourceRow ? -1 : 0;
    const colStep = targetCol > sourceCol ? 1 : targetCol < sourceCol ? -1 : 0;

    let currentRow = sourceRow + rowStep;
    let currentCol = sourceCol + colStep;

    while (currentRow !== targetRow || currentCol !== targetCol) {
        if (!isSquareEmpty(currentRow, currentCol)) {
            return true;
        }
        currentRow += rowStep;
        currentCol += colStep;
    }
    return false;
}

function isSquareEmpty(row, col) {
    const square = getSquare(row, col);
    return square && !square.firstChild;
}

function getSquare(row, col) {
    return document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
}

// Capturesysteem
function capturePiece(piece) {
    const capturedContainer = piece.dataset.color === "white" 
        ? document.getElementById("captured-black") 
        : document.getElementById("captured-white");

    const capturedPiece = document.createElement("div");
    capturedPiece.textContent = piece.textContent;
    capturedPiece.classList.add("captured-piece");
    capturedContainer.appendChild(capturedPiece);
}

// Herstart het spel
function restartGame() {
    createBoard(); // Genereer het bord opnieuw
    currentTurn = "White"; // Reset de beurt naar wit
    currentTurnDisplay.textContent = currentTurn; // Update het display
}

// Event listener voor herstarten
restartButton.addEventListener("click", restartGame);

// Bord maken
createBoard();
