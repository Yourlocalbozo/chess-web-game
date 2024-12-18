const board = document.getElementById("board");
const currentTurnDisplay = document.getElementById("current-turn");
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

        // Zet uitvoeren
        targetSquare.appendChild(draggedPiece);
        sourceSquare.innerHTML = "";

        // Controleer of de koning nu in schaak staat
        if (isKingInCheck(currentTurn.toLowerCase())) {
            alert("Je kunt deze zet niet doen; je staat schaak!");
            sourceSquare.appendChild(draggedPiece);
            if (originalPiece) targetSquare.appendChild(originalPiece);
            return;
        }

        // Zet geldig, wissel beurt
        currentTurn = currentTurn === "White" ? "Black" : "White";
        currentTurnDisplay.textContent = currentTurn;

        // Controleer op schaak of schaakmat
        if (isKingInCheck(currentTurn.toLowerCase())) {
            if (!hasLegalMoves(currentTurn.toLowerCase())) {
                alert(`Schaakmat! ${currentTurn === "White" ? "Zwart" : "Wit"} wint!`);
            } else {
                alert("Schaak!");
            }
        }
    } else {
        alert("Ongeldige zet!");
    }
}

// Controleer geldige zetten (basisbewegingen voor stukken)
function isValidMove(type, sourceRow, sourceCol, targetRow, targetCol) {
    const rowDiff = Math.abs(targetRow - sourceRow);
    const colDiff = Math.abs(targetCol - sourceCol);

    switch (type) {
        case "pawn":
            const direction = draggedPiece.dataset.color === "white" ? 1 : -1;
            
            // Eerste zet kan twee vakjes vooruit
            if (draggedPiece.dataset.color === "white" && sourceRow === 6 && targetRow - sourceRow === 2 && colDiff === 0) {
                // Controleer of beide vakjes leeg zijn
                const middleSquare = document.querySelector(`[data-row="${sourceRow + direction}"][data-col="${sourceCol}"]`);
                const targetSquare = document.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`);
                if (!middleSquare.firstChild && !targetSquare.firstChild) {
                    return true;
                }
                return false;
            } else if (draggedPiece.dataset.color === "black" && sourceRow === 1 && targetRow - sourceRow === -2 && colDiff === 0) {
                // Controleer of beide vakjes leeg zijn voor zwart
                const middleSquare = document.querySelector(`[data-row="${sourceRow + direction}"][data-col="${sourceCol}"]`);
                const targetSquare = document.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`);
                if (!middleSquare.firstChild && !targetSquare.firstChild) {
                    return true;
                }
                return false;
            }
            
            // Normale zet één vakje vooruit
            if (colDiff === 0 && targetRow - sourceRow === direction) {
                const targetSquare = document.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`);
                if (!targetSquare.firstChild) { // Het vakje is leeg
                    return true;
                }
                return false;
            }
            
            // Slaan van vijandelijke stukken diagonaal
            if (colDiff === 1 && rowDiff === 1 && targetRow - sourceRow === direction) {
                const targetSquare = document.querySelector(`[data-row="${targetRow}"][data-col="${targetCol}"]`);
                const targetPiece = targetSquare.firstChild;
                return targetPiece && targetPiece.dataset.color !== draggedPiece.dataset.color; // Alleen slaan als het stuk van de tegenstander is
            }
            return false;

        case "rook":
            // Rook kan alleen verticaal of horizontaal bewegen
            if (rowDiff === 0 || colDiff === 0) {
                // Controleer of er geen stukken in de weg staan
                if (isPathClear(sourceRow, sourceCol, targetRow, targetCol)) {
                    return true;
                }
            }
            return false;

        case "knight":
            // Paard beweegt in een L-vorm (2x2 vakjes)
            return rowDiff * colDiff === 2;

        case "bishop":
            // Loper beweegt diagonaal
            if (rowDiff === colDiff) {
                if (isPathClear(sourceRow, sourceCol, targetRow, targetCol)) {
                    return true;
                }
            }
            return false;

        case "queen":
            // Dames kunnen zowel horizontaal, verticaal als diagonaal bewegen
            if (rowDiff === 0 || colDiff === 0 || rowDiff === colDiff) {
                if (isPathClear(sourceRow, sourceCol, targetRow, targetCol)) {
                    return true;
                }
            }
            return false;

        case "king":
            // Koning beweegt 1 vakje in elke richting
            return rowDiff <= 1 && colDiff <= 1;

        default:
            return false;
    }
}

function isKingInCheck(color) {
    const opponentColor = color === "white" ? "black" : "white";
    let kingSquare = null;

    document.querySelectorAll(".square").forEach(square => {
        const piece = square.firstChild;
        if (piece && piece.dataset.type === "king" && piece.dataset.color === color) {
            kingSquare = square;
        }
    });

    for (let square of document.querySelectorAll(".square")) {
        const piece = square.firstChild;
        if (piece && piece.dataset.color === opponentColor) {
            if (isValidMove(piece.dataset.type, parseInt(square.dataset.row), parseInt(square.dataset.col), parseInt(kingSquare.dataset.row), parseInt(kingSquare.dataset.col))) {
                return true;
            }
        }
    }
    return false;
}

function hasLegalMoves(color) {
    for (let square of document.querySelectorAll(".square")) {
        const piece = square.firstChild;
        if (piece && piece.dataset.color === color) {
            for (let targetSquare of document.querySelectorAll(".square")) {
                if (isValidMove(piece.dataset.type, parseInt(square.dataset.row), parseInt(square.dataset.col), parseInt(targetSquare.dataset.row), parseInt(targetSquare.dataset.col))) {
                    return true;
                }
            }
        }
    }
    return false;
}

createBoard();
