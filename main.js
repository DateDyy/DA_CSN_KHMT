// main.js
import { getBestMove as getHardMove } from "./Hard_bot.js";
import { getBestMove as getMediumMove } from "./Medium_bot.js";
import { getBestMove as getEasyMove } from "./Easy_bot.js";

document.addEventListener("DOMContentLoaded", () => {
  // ----- 1. CONSTANTS & CONFIGURATIONS -----
  const FIRST_TURN = 1;
  const SECOND_TURN = 2;

  // ----- 2. STATE VARIABLES -----
  // Game board dimensions
  let boardWidth = 7;
  let boardHeight = 6;

  // Game state
  let pieces = [];
  let playerTurn = FIRST_TURN;
  let hoverColumn = -1;
  let animating = false;
  let suggestionCount = 0;
  let suggestionLimit = 0;

  // ----- 3. DOM ELEMENTS -----
  const board = document.querySelector("#board");
  const modalContainer = document.querySelector("#modal-container");
  const modalMessage = document.querySelector("#modal-message");
  const resetButton = document.querySelector("#reset");
  const boardSizeSelect = document.querySelector("#board-size");
  const player1ColorSelect = document.querySelector("#player1-color");
  const player2ColorSelect = document.querySelector("#player2-color");
  const player1TypeSelect = document.querySelector("#player1-type");
  const player2TypeSelect = document.querySelector("#player2-type");
  const reviewButton = document.getElementById("review");
  const computerDifficultySelect = document.querySelector(
    "#computer-difficulty"
  );
  const suggestButton = document.getElementById("suggestButton");



        // Check horizontal win
        if (
          col <= boardWidth - 4 &&
          pieces[row * boardWidth + (col + 1)] === player &&
          pieces[row * boardWidth + (col + 2)] === player &&
          pieces[row * boardWidth + (col + 3)] === player
        ) {
          return [
            index,
            row * boardWidth + (col + 1),
            row * boardWidth + (col + 2),
            row * boardWidth + (col + 3),
          ];
        }

        // Check vertical win
        if (
          row <= boardHeight - 4 &&
          pieces[(row + 1) * boardWidth + col] === player &&
          pieces[(row + 2) * boardWidth + col] === player &&
          pieces[(row + 3) * boardWidth + col] === player
        ) {
          return [
            index,
            (row + 1) * boardWidth + col,
            (row + 2) * boardWidth + col,
            (row + 3) * boardWidth + col,
          ];
        }

        // Check diagonal (/)
        if (
          col <= boardWidth - 4 &&
          row <= boardHeight - 4 &&
          pieces[(row + 1) * boardWidth + (col + 1)] === player &&
          pieces[(row + 2) * boardWidth + (col + 2)] === player &&
          pieces[(row + 3) * boardWidth + (col + 3)] === player
        ) {
          return [
            index,
            (row + 1) * boardWidth + (col + 1),
            (row + 2) * boardWidth + (col + 2),
            (row + 3) * boardWidth + (col + 3),
          ];
        }

        // Check diagonal (\)
        if (
          col >= 3 &&
          row <= boardHeight - 4 &&
          pieces[(row + 1) * boardWidth + (col - 1)] === player &&
          pieces[(row + 2) * boardWidth + (col - 2)] === player &&
          pieces[(row + 3) * boardWidth + (col - 3)] === player
        ) {
          return [
            index,
            (row + 1) * boardWidth + (col - 1),
            (row + 2) * boardWidth + (col - 2),
            (row + 3) * boardWidth + (col - 3),
          ];
        }
      }
    }
    return null;
  };

  /**
   * Gets the type of the current player (human or computer)
   */
  function getCurrentPlayerType() {
    return playerTurn === FIRST_TURN
      ? player1TypeSelect.value.trim().toLowerCase()
      : player2TypeSelect.value.trim().toLowerCase();
  }

  /**
   * Handle game state after a move - check for win/draw, switch turns
   */
  const checkGameWinOrDraw = () => {
    animating = false;

    if (!pieces.includes(0)) {
      modalContainer.style.display = "block";
      modalMessage.textContent = "Draw";
      return;
    }

    const winningPositions = hasPlayerWon(playerTurn);

    if (winningPositions) {
      modalContainer.style.display = "block";
      const winnerColor =
        playerTurn === FIRST_TURN
          ? player1ColorSelect.value
          : player2ColorSelect.value;
      modalMessage.textContent = `Player ${playerTurn} WON!`;
      modalMessage.style.color = winnerColor;
      modalMessage.dataset.winner = playerTurn;

      // Highlight winning pieces
      winningPositions.forEach((index) => {
        const cell = board.children[index];
        cell.firstChild.classList.add("winning-piece");
      });

      return;
    }

    // Switch turns
    playerTurn = playerTurn === FIRST_TURN ? SECOND_TURN : FIRST_TURN;
    updateTurnNotification();
    checkAndMakeAIMove();
    updateHover();
  };

  // ----- 5. UI AND INTERACTION FUNCTIONS -----

  /**
   * Resets and initializes the game board
   */
  window.initializeBoard = () => {
    board.innerHTML = "";
    pieces = new Array(boardWidth * boardHeight).fill(0);
    playerTurn = FIRST_TURN;
    hoverColumn = -1;
    animating = false;
    suggestionCount = 0;

    // Update suggest button visibility
    updateSuggestButtonVisibility();

    for (let i = 0; i < boardWidth * boardHeight; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      board.appendChild(cell);
      const col = i % boardWidth;
      cell.addEventListener("mouseenter", () => onMouseEnteredColumn(col));
      cell.addEventListener("click", () => {
        if (getCurrentPlayerType() === "computer") return;
        if (!animating) onColumnClicked(col);
      });
    }
    updateTurnNotification();
    checkAndMakeAIMove();
  };

  /**
   * Updates the turn notification display
   */
  const updateTurnNotification = () => {
    if (!turnMessage || !playerIndicator) return;

    const playerNum = playerTurn === FIRST_TURN ? "1" : "2";
    playerIndicator.style.backgroundColor = `var(--player${playerNum}-color, ${
      playerNum === "1" ? "red" : "yellow"
    })`;
    turnMessage.style.color = `var(--player${playerNum}-color, ${
      playerNum === "1" ? "red" : "yellow"
    })`;

    turnMessage.textContent =
      getCurrentPlayerType() === "computer"
        ? "Computer's Thinking"
        : `Player ${playerNum}'s Turn`;
  };

  /**
   * Sets board dimensions based on selected size
   */
  const setBoardDimensions = (sizeStr) => {
    const [w, h] = sizeStr.split("x").map(Number);
    if (isNaN(w) || isNaN(h)) {
      console.error("Invalid board size:", sizeStr);
      return;
    }
    boardWidth = w;
    boardHeight = h;
    document.documentElement.style.setProperty("--board-cols", w);
    document.documentElement.style.setProperty("--board-rows", h);
    board.style.gridTemplateColumns = `repeat(${w}, auto)`;
    board.style.gridTemplateRows = `repeat(${h}, auto)`;
    initializeBoard();
  };

  /**
   * Update hover piece display
   */
  const updateHover = () => {
    removeUnplacedPiece();
    if (hoverColumn >= 0 && pieces[hoverColumn] === 0) {
      const cell = board.children[hoverColumn];
      const piece = document.createElement("div");
      piece.className = "piece";
      piece.dataset.placed = "false";
      piece.dataset.player = playerTurn;
      cell.appendChild(piece);
    }
  };

  /**
   * Remove the unplaced hover piece
   */
  const removeUnplacedPiece = () => {
    const unplacedPiece = document.querySelector("[data-placed='false']");
    unplacedPiece?.parentElement?.removeChild(unplacedPiece);
  };

  /**
   * Handle mouse entering a column
   */
  const onMouseEnteredColumn = (column) => {
    hoverColumn = column;
    if (!animating) updateHover();
  };

  /**
   * Handle column click
   */
  const onColumnClicked = (column) => {
    const availableRow = getAvailableRowInColumn(column);
    if (availableRow === -1) return;

    pieces[availableRow * boardWidth + column] = playerTurn;
    const cell = board.children[availableRow * boardWidth + column];
    const piece = document.createElement("div");
    piece.className = "piece";
    piece.dataset.placed = "true";
    piece.dataset.player = playerTurn;
    cell.appendChild(piece);

    const unplacedPiece = document.querySelector("[data-placed='false']");
    if (!unplacedPiece) {
      checkGameWinOrDraw();
      return;
    }

    const unplacedY = unplacedPiece.getBoundingClientRect().y;
    const placedY = piece.getBoundingClientRect().y;
    const yDiff = unplacedY - placedY;

    animating = true;
    removeUnplacedPiece();

    const animation = piece.animate(
      [
        { transform: `translateY(${yDiff}px)`, offset: 0 },
        { transform: "translateY(0px)", offset: 0.6 },
        { transform: `translateY(${yDiff / 20}px)`, offset: 0.8 },
        { transform: "translateY(0px)", offset: 0.95 },
      ],
      { duration: 400, easing: "linear", iterations: 1 }
    );
    animation.addEventListener("finish", checkGameWinOrDraw);
  };

  /**
   * Updates suggest button visibility based on player types
   */
  function updateSuggestButtonVisibility() {
    const player1Type = player1TypeSelect.value;
    const player2Type = player2TypeSelect.value;

    // Show suggest button if at least one player is computer
    if (player1Type === "computer" || player2Type === "computer") {
      suggestButton.style.visibility = "visible";
      // Reset suggestion count when player types change
      suggestionCount = 0;
    } else {
      // Hide suggest button if both players are human
      suggestButton.style.visibility = "hidden";
    }
  }

  // ----- 6. AI AND COMPUTER PLAYER FUNCTIONS -----

  /**
   * Suggests best move for human player
   */
  function suggestBestMove() {
    // Determine limit based on difficulty
    const difficulty = computerDifficultySelect.value;

    switch (difficulty) {
      case "easy":
        suggestionLimit = 4;
        break;
      case "medium":
        suggestionLimit = 2;
        break;
      case "hard":
        suggestionLimit = 1;
        break;
      default:
        suggestionLimit = 0;
    }

    if (suggestionCount >= suggestionLimit) {
      alert("Bạn đã sử dụng hết lượt gợi ý cho mức độ hiện tại.");
      return;
    }

    // Increment used suggestion count
    suggestionCount++;

    const board2D = convertPiecesTo2D(pieces, boardWidth, boardHeight);
    const suggestedColumn = getHardMove(board2D, 7);

    if (suggestedColumn < 0 || suggestedColumn >= boardWidth) return;

    for (let row = 0; row < boardHeight; row++) {
      const index = row * boardWidth + suggestedColumn;
      const cell = board.children[index];
      cell.classList.add("suggestion-blink");
    }

    setTimeout(() => {
      for (let row = 0; row < boardHeight; row++) {
        const index = row * boardWidth + suggestedColumn;
        const cell = board.children[index];
        cell.classList.remove("suggestion-blink");
      }
    }, 2000);
  }

  /**
   * Check if AI move is needed and execute it
   */
  const checkAndMakeAIMove = () => {
    if (getCurrentPlayerType() === "computer") {
      const difficulty = computerDifficultySelect.value;
      setTimeout(() => {
        if (difficulty === "easy") {
          makeEasyAIMove();
        } else if (difficulty === "medium") {
          makeMediumAIMove();
        } else if (difficulty === "hard") {
          makeHardAIMove();
        }
      }, 200);
    }
  };

  /**
   * Execute AI move (Easy difficulty)
   */
  const makeEasyAIMove = () => {
    const board2D = convertPiecesTo2D(pieces, boardWidth, boardHeight);
    const moveColumn = getEasyMove(board2D, 2);

    if (moveColumn >= 0 && moveColumn < boardWidth) {
      onColumnClicked(moveColumn);
    }
  };

  /**
   * Execute AI move (Medium difficulty)
   */
  const makeMediumAIMove = () => {
    const board2D = convertPiecesTo2D(pieces, boardWidth, boardHeight);
    const moveColumn = getMediumMove(board2D, 4);

    if (moveColumn >= 0 && moveColumn < boardWidth) {
      onColumnClicked(moveColumn);
    }
  };

  /**
   * Execute AI move (Hard difficulty)
   */
  const makeHardAIMove = () => {
    const board2D = convertPiecesTo2D(pieces, boardWidth, boardHeight);
    const moveColumn = getHardMove(board2D, 8);

    if (moveColumn >= 0 && moveColumn < boardWidth) {
      onColumnClicked(moveColumn);
    }
  };

  // ----- 7. EVENT HANDLERS -----

  // Game start handler
  document.getElementById("start-game").addEventListener("click", function () {
    document.getElementById("turn-notification").style.visibility = "visible";
    board.classList.remove("visibi");
    updateSuggestButtonVisibility();
    gameStarted = true;

    if (suggestButton.style.visibility === "visible") {
      suggestButton.addEventListener("click", suggestBestMove);
    }
  });

  // Close options handler
  document
    .getElementById("close-options")
    .addEventListener("click", function () {
      document.getElementById("turn-notification").style.visibility = "hidden";
      board.classList.add("visibi");
      initializeBoard();
    });

  // Review results handler
  reviewButton.addEventListener("click", () => {
    modalContainer.style.display = "none";
    board.classList.add("disabled");
    document.getElementById("turn-notification").style.visibility = "hidden";
  });

  // Reset game handler
  resetButton.addEventListener("click", () => {
    modalContainer.style.display = "none";
    initializeBoard();
    board.classList.remove("disabled");
    gameStarted = true;
  });

  // Board size change handler
  boardSizeSelect.addEventListener("change", () =>
    setBoardDimensions(boardSizeSelect.value)
  );

  // Player type change handlers
  player1TypeSelect.addEventListener("change", updateSuggestButtonVisibility);
  player2TypeSelect.addEventListener("change", updateSuggestButtonVisibility);

  // ----- 8. INITIALIZATION -----

  // Disable board initially
  board.classList.add("disabled");

  // Hide suggest button initially
  suggestButton.style.visibility = "hidden";

  // Initialize board with selected size
  if (boardSizeSelect && board) {
    setBoardDimensions(boardSizeSelect.value);
  } else {
    console.error("#board-size or #board not found in the document.");
  }
});
