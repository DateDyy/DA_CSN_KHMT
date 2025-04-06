// main.js
import { getBestMove as getHardMove } from "./Hard_bot.js";
import { getBestMove as getMediumMove } from "./Medium_bot.js";
import { getBestMove as getEasyMove } from "./Easy_bot.js";

document.addEventListener("DOMContentLoaded", () => {
  const board = document.querySelector("#board");
  const modalContainer = document.querySelector("#modal-container");
  const modalMessage = document.querySelector("#modal-message");
  const resetButton = document.querySelector("#reset");
  const boardSizeSelect = document.querySelector("#board-size");
  const player1ColorSelect = document.querySelector("#player1-color");
  const player2ColorSelect = document.querySelector("#player2-color");

  // Số cột và hàng mặc định của board
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

  // Cấu hình kích thước board dựa theo số cột và số hàng được chọn,
  // cập nhật các biến CSS để board tự động điều chỉnh grid
  const setBoardDimensions = (sizeStr) => {
    const [w, h] = sizeStr.split("x").map(Number);
    if (isNaN(w) || isNaN(h)) {
      console.error("Invalid board size:", sizeStr);
      return;
    }
    boardWidth = w;
    boardHeight = h;

    // Cập nhật biến CSS cho số cột và hàng
    document.documentElement.style.setProperty("--board-cols", w);
    document.documentElement.style.setProperty("--board-rows", h);

    // Cập nhật cấu trúc grid cho board (sử dụng 'auto' để giữ kích thước ô cố định)
    board.style.gridTemplateColumns = `repeat(${w}, auto)`;
    board.style.gridTemplateRows = `repeat(${h}, auto)`;

    initializeBoard();
  };

  resetButton.addEventListener("click", () => {
    modalContainer.style.display = "none";
    initializeBoard();
  });

  // Khởi tạo lại board: reset trạng thái, mảng pieces và tạo các ô mới
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
        if (!animating) onColumnClicked(col);
      });
    }
    updateTurnNotification();
  };

  // Cập nhật thông báo lượt chơi
  const updateTurnNotification = () => {
    const turnMessage = document.getElementById("turn-message");
    const playerIndicator = document.querySelector(".player-indicator");
    if (!turnMessage || !playerIndicator) return;

    const isPlayer1 = playerTurn === FIRST_TURN;
    const playerNum = isPlayer1 ? "1" : "2";

    playerIndicator.style.backgroundColor = `var(--player${playerNum}-color, ${
      playerNum === "1" ? "red" : "yellow"
    })`;

    // Fix: Use the CSS variable for text color
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
    if (getCurrentPlayerType() === "computer") {
      const difficulty = computerDifficultySelect.value;
      console.log(difficulty);
      setTimeout(() => {
        if (difficulty === "easy") {
          makeEasyAIMove(getEasyMove);
          // makeHardAIMove(getBestMoveHard);
        } else if (difficulty === "medium") {
          // makeNormalAIMove(getBestMoveNormal);
          makeNormalAIMove(getMediumMove);
        } else if (difficulty === "hard") {
          makeHardAIMove(getHardMove);
        }
      }, 200);
    }
  };

  const getAvailableRowInColumn = (column) => {
    for (let row = boardHeight - 1; row >= 0; row--) {
      if (pieces[row * boardWidth + column] === 0) return row;
    }
    return -1;
  };

  // Xử lý khi click vào cột
  const onColumnClicked = (column) => {
    const availableRow = getAvailableRowInColumn(column);
    if (availableRow === -1) return; // Cột đầy

    // Đánh dấu nước đi trong mảng pieces
    pieces[availableRow * boardWidth + column] = playerTurn;
    const cell = board.children[availableRow * boardWidth + column];
    const piece = document.createElement("div");
    piece.className = "piece";
    piece.dataset.placed = "true";
    piece.dataset.player = playerTurn;
    cell.appendChild(piece);

    // Xử lý animation nếu có quân cờ hover chưa đặt
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
      {
        duration: 400,
        easing: "linear",
        iterations: 1,
      }
    );
    animation.addEventListener("finish", checkGameWinOrDraw);
  };

  // Kiểm tra thắng/hòa và chuyển lượt chơi
  const checkGameWinOrDraw = () => {
    animating = false;
    // Hòa nếu không còn ô trống nào
    if (!pieces.includes(0)) {
      modalContainer.style.display = "block";
      modalMessage.textContent = "Draw";
      return;
    }
    // Kiểm tra chiến thắng
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
    // Chuyển lượt
    playerTurn = playerTurn === FIRST_TURN ? SECOND_TURN : FIRST_TURN;
    updateTurnNotification();
    updateHover();
  };

  // Cập nhật quân hover ở ô đầu tiên của cột đang di chuột
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

  // Loại bỏ quân hover chưa đặt
  const removeUnplacedPiece = () => {
    const unplacedPiece = document.querySelector("[data-placed='false']");
    unplacedPiece?.parentElement?.removeChild(unplacedPiece);
  };

  // Khi chuột di chuyển vào cột, cập nhật hover
  const onMouseEnteredColumn = (column) => {
    hoverColumn = column;
    if (!animating) updateHover();
  };

  // Kiểm tra điều kiện thắng (ngang, dọc, chéo)
  const hasPlayerWon = (player) => {
    for (let row = 0; row < boardHeight; row++) {
      for (let col = 0; col < boardWidth; col++) {
        const index = row * boardWidth + col;
        if (pieces[index] !== player) continue;

        // Ngang
        if (
          col <= boardWidth - 4 &&
          pieces[row * boardWidth + (col + 1)] === player &&
          pieces[row * boardWidth + (col + 2)] === player &&
          pieces[row * boardWidth + (col + 3)] === player
        ) {
          return true;
        }
        // Dọc
        if (
          row <= boardHeight - 4 &&
          pieces[(row + 1) * boardWidth + col] === player &&
          pieces[(row + 2) * boardWidth + col] === player &&
          pieces[(row + 3) * boardWidth + col] === player
        ) {
          return true;
        }
        // Chéo xuống phải
        if (
          col <= boardWidth - 4 &&
          row <= boardHeight - 4 &&
          pieces[(row + 1) * boardWidth + (col + 1)] === player &&
          pieces[(row + 2) * boardWidth + (col + 2)] === player &&
          pieces[(row + 3) * boardWidth + (col + 3)] === player
        ) {
          return true;
        }
        // Chéo xuống trái
        if (
          col >= 3 &&
          row <= boardHeight - 4 &&
          pieces[(row + 1) * boardWidth + (col - 1)] === player &&
          pieces[(row + 2) * boardWidth + (col - 2)] === player &&
          pieces[(row + 3) * boardWidth + (col - 3)] === player
        ) {
          return true;
        }
      }
    }
    return false;
  };
  const makeEasyAIMove = () => {
    // Chuyển board 1D sang 2D
    const board2D = convertPiecesTo2D(pieces, boardWidth, boardHeight);

    // Gọi bot cấp Easy (depth = 2)
    const moveColumn = getEasyMove(board2D, 2);

    // Thực hiện nước đi nếu hợp lệ
    if (moveColumn >= 0 && moveColumn < boardWidth) {
      onColumnClicked(moveColumn);
    }
  };

  // Hàm gọi AI cấp normal
  const makeNormalAIMove = () => {
    // Chuyển board 1D sang 2D để phù hợp với logic của normal_bot.js
    const board2D = convertPiecesTo2D(pieces, boardWidth, boardHeight);
    // Lấy cột nước đi tốt nhất từ bot normal (depth = 4 có thể thay đổi)
    const moveColumn = getMediumMove(board2D, 4);
    if (moveColumn >= 0 && moveColumn < boardWidth) {
      onColumnClicked(moveColumn);
    }
  };

  // Hàm gọi AI cấp hard
  const makeHardAIMove = () => {
    // Chuyển board 1D sang 2D để phù hợp với logic của bot_hard.js
    const board2D = convertPiecesTo2D(pieces, boardWidth, boardHeight);
    // Lấy cột nước đi tốt nhất từ bot_hard (depth = 5 có thể thay đổi)
    const moveColumn = getHardMove(board2D, 5);
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
