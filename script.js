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

        // Controleer promotie
        if (pieceType === "pawn") {
            const promotionRow = draggedPiece.dataset.color === "white" ? 0 : 7;
            if (targetRow === promotionRow) {
                promotePawn(draggedPiece);
            }
        }

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

// Controleer geldige zetten
function isValidMove(type, sourceRow, sourceCol, targetRow, targetCol) {
    const rowDiff = targetRow - sourceRow;
    const colDiff = Math.abs(targetCol - sourceCol);

    switch (type) {
        case "pawn":
            const direction = draggedPiece.dataset.color === "white" ? -1 : 1; // Wit naar boven, zwart naar beneden

            // Voorwaartse beweging
            if (colDiff === 0) {
                if (rowDiff === direction && isSquareEmpty(targetRow, targetCol)) {
                    return true; // Eén vakje naar voren
                }
                if (
                    rowDiff === 2 * direction && 
                    isSquareEmpty(targetRow, targetCol) &&
                    isSquareEmpty(sourceRow + direction, sourceCol) &&
                    ((draggedPiece.dataset.color === "white" && sourceRow === 6) || 
                     (draggedPiece.dataset.color === "black" && sourceRow === 1))
                ) {
                    return true; // Twee vakjes naar voren (alleen vanaf startpositie)
                }
            }

            // Diagonaal slaan
            if (colDiff === 1 && rowDiff === direction) {
                const targetPiece = getPieceAt(targetRow, targetCol);
                if (targetPiece && targetPiece.dataset.color !== draggedPiece.dataset.color) {
                    return true; // Slaan
                }
            }

            return false; // Alle andere gevallen
        case "rook":
            return rowDiff === 0 || colDiff === 0;
        case "knight":
            return rowDiff * colDiff === 2;
        case "bishop":
            return Math.abs(rowDiff) === Math.abs(colDiff);
        case "queen":
            return rowDiff === 0 || colDiff === 0 || Math.abs(rowDiff) === Math.abs(colDiff);
        case "king":
            return Math.abs(rowDiff) <= 1 && Math.abs(colDiff) <= 1;
        default:
            return false;
    }
}

// Helper functies
function isSquareEmpty(row, col) {
    const square = getSquare(row, col);
    return square && !square.firstChild;
}

function getSquare(row, col) {
    return document.querySelector(`.square[data-row="${row}"][data-col="${col}"]`);
}

function getPieceAt(row, col) {
    const square = getSquare(row, col);
    return square ? square.firstChild : null;
}

function promotePawn(pawn) {
    const choice = prompt("Promoveer je pion! Kies: queen, rook, knight, bishop", "queen");
    const validChoices = ["queen", "rook", "knight", "bishop"];
    const selectedPiece = validChoices.includes(choice) ? choice : "queen";

    const newSymbol = pieces[pawn.dataset.color][selectedPiece];
    pawn.textContent = newSymbol;
    pawn.dataset.type = selectedPiece;
}

// Schaak en schaakmatcontrole
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

// Bord maken
createBoard();
