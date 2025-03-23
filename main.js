// main.js
import { getBestMove } from "./bot_hard.js";

document.addEventListener("DOMContentLoaded", () => {
  const board = document.querySelector("#board");
  const modalContainer = document.querySelector("#modal-container");
  const modalMessage = document.querySelector("#modal-message");
  const resetButton = document.querySelector("#reset");
  const boardSizeSelect = document.querySelector("#board-size");
  const player1ColorSelect = document.querySelector("#player1-color");
  const player2ColorSelect = document.querySelector("#player2-color");
  const player1TypeSelect = document.querySelector("#player1-type");
  const player2TypeSelect = document.querySelector("#player2-type");
  const computerDifficultySelect = document.querySelector(
    "#computer-difficulty"
  );

  board.classList.add("disabled"); // Vô hiệu hóa bàn cờ ban đầu
  document.getElementById("new-game").addEventListener("click", function () {
    // Hiển thị thông báo lượt chơi
    document.getElementById("turn-notification").style.visibility = "visible";
  });

  // Số cột và hàng mặc định
  let boardWidth = 7;
  let boardHeight = 6;

  // Hằng số lượt chơi
  const FIRST_TURN = 1;
  const SECOND_TURN = 2;

  // Trạng thái game
  let pieces = [];
  let playerTurn = FIRST_TURN;
  let hoverColumn = -1;
  let animating = false;

  // Chuyển đổi board 1D (pieces) sang board 2D
  function convertPiecesTo2D(pieces, boardWidth, boardHeight) {
    let board2D = [];
    for (let row = 0; row < boardHeight; row++) {
      let rowArr = [];
      for (let col = 0; col < boardWidth; col++) {
        rowArr.push(pieces[row * boardWidth + col]);
      }
      board2D.push(rowArr);
    }
    return board2D;
  }

  // Lấy kiểu người chơi hiện tại (human hoặc computer)
  function getCurrentPlayerType() {
    return playerTurn === FIRST_TURN
      ? player1TypeSelect.value.trim().toLowerCase()
      : player2TypeSelect.value.trim().toLowerCase();
  }

  // Cấu hình kích thước board và khởi tạo lại board
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

  resetButton.addEventListener("click", () => {
    modalContainer.style.display = "none";
    initializeBoard();
  });

  window.initializeBoard = () => {
    board.innerHTML = "";
    pieces = new Array(boardWidth * boardHeight).fill(0);
    playerTurn = FIRST_TURN;
    hoverColumn = -1;
    animating = false;

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

  // Cập nhật thông báo lượt chơi
  const updateTurnNotification = () => {
    const turnMessage = document.getElementById("turn-message");
    const playerIndicator = document.querySelector(".player-indicator");
    if (!turnMessage || !playerIndicator) return;
    const playerNum = playerTurn === FIRST_TURN ? "1" : "2";
    playerIndicator.style.backgroundColor = `var(--player${playerNum}-color, ${
      playerNum === "1" ? "red" : "yellow"
    })`;
    turnMessage.style.color = `var(--player${playerNum}-color, ${
      playerNum === "1" ? "red" : "yellow"
    })`;
    // Nếu lượt hiện tại thuộc kiểu computer, hiển thị thông báo "Máy tính đang suy nghĩ"
    if (getCurrentPlayerType() === "computer") {
      turnMessage.textContent = "Computer's Thinking";
    } else {
      turnMessage.textContent = `Player ${playerNum}'s Turn`;
    }
  };
  // Hàm kiểm tra và gọi nước đi AI nếu cần
  const checkAndMakeAIMove = () => {
    if (
      getCurrentPlayerType() === "computer" &&
      computerDifficultySelect.value === "hard"
    ) {
      setTimeout(makeHardAIMove, 200);
    }
  };

  const getAvailableRowInColumn = (column) => {
    for (let row = boardHeight - 1; row >= 0; row--) {
      if (pieces[row * boardWidth + column] === 0) return row;
    }
    return -1;
  };

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

  const checkGameWinOrDraw = () => {
    animating = false;
    if (!pieces.includes(0)) {
      modalContainer.style.display = "block";
      modalMessage.textContent = "Draw";
      return;
    }
    if (hasPlayerWon(playerTurn)) {
      modalContainer.style.display = "block";
      const winnerColor =
        playerTurn === FIRST_TURN
          ? player1ColorSelect.value
          : player2ColorSelect.value;
      modalMessage.textContent = `Player ${playerTurn} WON!`;
      modalMessage.style.color = winnerColor;
      modalMessage.dataset.winner = playerTurn;
      return;
    }
    playerTurn = playerTurn === FIRST_TURN ? SECOND_TURN : FIRST_TURN;
    updateTurnNotification();
    checkAndMakeAIMove();
    updateHover();
  };

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

  const removeUnplacedPiece = () => {
    const unplacedPiece = document.querySelector("[data-placed='false']");
    unplacedPiece?.parentElement?.removeChild(unplacedPiece);
  };

  const onMouseEnteredColumn = (column) => {
    hoverColumn = column;
    if (!animating) updateHover();
  };

  const hasPlayerWon = (player) => {
    for (let row = 0; row < boardHeight; row++) {
      for (let col = 0; col < boardWidth; col++) {
        const index = row * boardWidth + col;
        if (pieces[index] !== player) continue;
        if (
          col <= boardWidth - 4 &&
          pieces[row * boardWidth + (col + 1)] === player &&
          pieces[row * boardWidth + (col + 2)] === player &&
          pieces[row * boardWidth + (col + 3)] === player
        )
          return true;
        if (
          row <= boardHeight - 4 &&
          pieces[(row + 1) * boardWidth + col] === player &&
          pieces[(row + 2) * boardWidth + col] === player &&
          pieces[(row + 3) * boardWidth + col] === player
        )
          return true;
        if (
          col <= boardWidth - 4 &&
          row <= boardHeight - 4 &&
          pieces[(row + 1) * boardWidth + (col + 1)] === player &&
          pieces[(row + 2) * boardWidth + (col + 2)] === player &&
          pieces[(row + 3) * boardWidth + (col + 3)] === player
        )
          return true;
        if (
          col >= 3 &&
          row <= boardHeight - 4 &&
          pieces[(row + 1) * boardWidth + (col - 1)] === player &&
          pieces[(row + 2) * boardWidth + (col - 2)] === player &&
          pieces[(row + 3) * boardWidth + (col - 3)] === player
        )
          return true;
      }
    }
    return false;
  };

  // Hàm gọi AI cấp hard
  const makeHardAIMove = () => {
    // Chuyển board 1D sang 2D để phù hợp với logic của bot_hard.js
    const board2D = convertPiecesTo2D(pieces, boardWidth, boardHeight);
    // Lấy cột nước đi tốt nhất từ bot_hard (depth = 5 có thể thay đổi)
    const moveColumn = getBestMove(board2D, 7);
    if (moveColumn >= 0 && moveColumn < boardWidth) {
      onColumnClicked(moveColumn);
    }
  };

  // Khởi tạo board và cấu hình board theo lựa chọn
  if (boardSizeSelect && board) {
    setBoardDimensions(boardSizeSelect.value);
    boardSizeSelect.addEventListener("change", () =>
      setBoardDimensions(boardSizeSelect.value)
    );
  } else {
    console.error("#board-size or #board not found in the document.");
  }
});
