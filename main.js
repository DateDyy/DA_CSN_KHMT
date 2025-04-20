// main.js
import { getBestMove as getHardMove, getValidLocations as getValidLocations } from "./Hard_bot.js";
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
  const player1TypeSelect = document.querySelector("#player1-type");
  const player2TypeSelect = document.querySelector("#player2-type");
  const reviewButton = document.getElementById("review");
  const computerDifficultySelect = document.querySelector(
    "#computer-difficulty"
  );
  const suggestButton = document.getElementById("suggestButton");

  let suggestionCount = 0;
  let suggestionLimit = 0;

  function showSuggestionMessage(message) {
    const msgBox = document.getElementById("suggestionMessage");
    msgBox.textContent = message;
    msgBox.classList.add("show");

    setTimeout(() => {
      msgBox.classList.remove("show");
    }, 3000); // Hiển thị 3 giây rồi tự ẩn
  }

  function suggestBestMove() {
    // Xác định giới hạn theo độ khó
    const difficulty = computerDifficultySelect.value;

    switch (difficulty) {
      case "easy":
        suggestionLimit = 5;
        break;
      case "medium":
        suggestionLimit = 3;
        break;
      case "hard":
        suggestionLimit = 1;
        break;
      default:
        suggestionLimit = 0;
    }

    if (suggestionCount >= suggestionLimit) {
      showSuggestionMessage("⚠️ Bạn đã sử dụng hết lượt gợi ý!");
      return;
    }

    // Tăng số lượt đã dùng
    suggestionCount++;

    const board2D = convertPiecesTo2D(pieces, boardWidth, boardHeight);
    const suggestedColumn = getHardMove(board2D, 5);

    if (suggestedColumn < 0 || suggestedColumn >= boardWidth) return;

    // Tìm hàng trống cao nhất trong cột được gợi ý
    let targetRow = -1;
    for (let row = boardHeight - 1; row >= 0; row--) {
      if (board2D[row][suggestedColumn] === 0) {
        targetRow = row;
        break;
      }
    }

    if (targetRow === -1) return; // Không còn ô trống

    const index = targetRow * boardWidth + suggestedColumn;
    const cell = board.children[index];
    cell.classList.add("suggestion-blink");

    setTimeout(() => {
      cell.classList.remove("suggestion-blink");
    }, 2000);
  }

  let isGameRunning = false; //để kiểm soát khi nào được phép hiển thị nút gợi ý.

  function updateSuggestButtonVisibility() {
    const player1Type = player1TypeSelect.value;
    const player2Type = player2TypeSelect.value;

    if (
      isGameRunning &&
      (player1Type === "computer" || player2Type === "computer")
    ) {
      suggestButton.style.visibility = "visible";
      suggestionCount = 0;
    } else {
      suggestButton.style.visibility = "hidden";
    }
  }

  board.classList.add("disabled"); // Vô hiệu hóa bàn cờ ban đầu

  // Sự kiện khi bắt đầu trò chơi
  document.getElementById("start-game").addEventListener("click", function () {
    isGameRunning = true; // ✅ Bật trạng thái game
    document.getElementById("turn-notification").style.visibility = "visible";
    board.classList.remove("visibi"); // Vô hiệu hóa bàn cờ ban đầu
    updateSuggestButtonVisibility();
    if (suggestButton.style.visibility === "visible") {
      suggestButton.addEventListener("click", suggestBestMove);
    }
  });

  // Sự kiện khi đóng options
  document
    .getElementById("close-options")
    .addEventListener("click", function () {
      isGameRunning = false; //Tắt trạng thái game
      document.getElementById("turn-notification").style.visibility = "hidden";
      board.classList.add("visibi");
      suggestButton.style.visibility = "hidden";
      initializeBoard();
    });

  // Sự kiện khi click xem kết quả
  reviewButton.addEventListener("click", () => {
    modalContainer.style.display = "none"; // Ẩn bảng modal-container khi bấm Review results
    board.classList.add("disabled"); // Khóa bàn cờ
    document.getElementById("turn-notification").style.visibility = "hidden";
    suggestButton.style.visibility = "hidden";
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

  // Reset game khi bấm "Reset"
  resetButton.addEventListener("click", () => {
    modalContainer.style.display = "none";
    initializeBoard();
    board.classList.remove("disabled"); // Đảm bảo bàn cờ không bị vô hiệu hóa sau reset
    gameStarted = true; // Giữ trạng thái game đã bắt đầu
  });

  // Khởi tạo lại board: reset trạng thái, mảng pieces và tạo các ô mới
  window.initializeBoard = () => {
    board.innerHTML = "";
    pieces = new Array(boardWidth * boardHeight).fill(0);
    playerTurn = FIRST_TURN;
    hoverColumn = -1;
    animating = false;

    // Update suggest button visibility on board initialization
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
    if (getCurrentPlayerType() === "computer") {
      const difficulty = computerDifficultySelect.value;
      console.log(difficulty);
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

      // Thêm hiệu ứng nổi bật các quân cờ chiến thắng
      winningPositions.forEach((index) => {
        const cell = board.children[index];
        cell.firstChild.classList.add("winning-piece");
      });

      return;
    }
    // Chuyển lượt chơi
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

  //hàm kiểm tra chiến thắng
  const hasPlayerWon = (player) => {
    for (let row = 0; row < boardHeight; row++) {
      for (let col = 0; col < boardWidth; col++) {
        const index = row * boardWidth + col;
        if (pieces[index] !== player) continue;

        // Kiểm tra thắng theo hàng ngang
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

        // Kiểm tra thắng theo hàng dọc
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

        // Kiểm tra thắng theo đường chéo /
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

        // Kiểm tra thắng theo đường chéo \
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
  const makeMediumAIMove = () => {
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
  const board2D = convertPiecesTo2D(pieces, boardWidth, boardHeight);
  const validMoves = getValidLocations(board2D).length;
  const moveColumn = getHardMove(board2D, validMoves);
  
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

  // Add event listeners to player type selects
  player1TypeSelect.addEventListener("change", updateSuggestButtonVisibility);
  player2TypeSelect.addEventListener("change", updateSuggestButtonVisibility);

  // Make sure the suggest button is initially hidden when the page loads
  suggestButton.style.visibility = "hidden";

  // Initial check for suggest button visibility
  updateSuggestButtonVisibility();
});
