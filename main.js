document.addEventListener("DOMContentLoaded", () => {
  const board = document.querySelector("#board");
  const modalContainer = document.querySelector("#modal-container");
  const modalMessage = document.querySelector("#modal-message");
  const resetButton = document.querySelector("#reset");
  const boardSizeSelect = document.querySelector("#board-size");
  const player1ColorSelect = document.querySelector("#player1-color");
  const player2ColorSelect = document.querySelector("#player2-color");

  resetButton.addEventListener("click", () => {
    modalContainer.style.display = "none";
    initializeBoard();
  });

  let boardWidth = 7; // Kích thước mặc định
  let boardHeight = 6;

  const RED_TURN = 1;
  const YELLOW_TURN = 2;

  let pieces = [];
  let playerTurn = RED_TURN;
  let hoverColumn = -1;
  let animating = false;
  let isUpdate = false; // Cờ kiểm soát cập nhật tự động

  // Hàm cập nhật màu cho người chơi qua CSS custom property
  const updatePlayerColor = (playerSelect, propertyName, colors) => {
    const color = playerSelect.value;
    let newColor = colors[color] || "";
    document.documentElement.style.setProperty(propertyName, newColor);
  };

  // Sự kiện thay đổi màu cho Player 1
  player1ColorSelect.addEventListener("change", () => {
    if (isUpdate) return;
    const color1 = player1ColorSelect.value;
    const color2 = player2ColorSelect.value;

    // Nếu trùng màu, tự động thay đổi màu của player 2
    if (color1 === color2) {
      isUpdate = true;
      for (const option of player2ColorSelect.options) {
        if (option.value !== color1) {
          player2ColorSelect.value = option.value;
          break;
        }
      }
      isUpdate = false;
      updatePlayerColor(player2ColorSelect, "--player2-color", {
        red: "rgba(235, 16, 16, 0.916)",
        yellow: "rgba(242, 255, 0, 0.933)",
      });
    }
    updatePlayerColor(player1ColorSelect, "--player1-color", {
      red: "rgba(235, 16, 16, 0.916)",
      yellow: "rgba(242, 255, 0, 0.933)",
    });
  });

  // Sự kiện thay đổi màu cho Player 2
  player2ColorSelect.addEventListener("change", () => {
    if (isUpdate) return;
    const color1 = player1ColorSelect.value;
    const color2 = player2ColorSelect.value;

    // Nếu trùng màu, tự động thay đổi màu của player 1
    if (color1 === color2) {
      isUpdate = true;
      for (const option of player1ColorSelect.options) {
        if (option.value !== color2) {
          player1ColorSelect.value = option.value;
          break;
        }
      }
      isUpdate = false;
      updatePlayerColor(player1ColorSelect, "--player1-color", {
        red: "rgba(235, 16, 16, 0.916)",
        yellow: "rgba(242, 255, 0, 0.933)",
      });
    }
    updatePlayerColor(player2ColorSelect, "--player2-color", {
      red: "rgba(235, 16, 16, 0.916)",
      yellow: "rgba(242, 255, 0, 0.933)",
    });
  });

  // Khởi tạo lại board: xoá nội dung cũ và tạo mảng pieces mới
  function initializeBoard() {
    board.innerHTML = ""; // Xoá board cũ
    pieces = new Array(boardWidth * boardHeight).fill(0);

    for (let i = 0; i < boardWidth * boardHeight; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      board.appendChild(cell);

      cell.addEventListener("mouseenter", () =>
        onMouseEnteredColumn(i % boardWidth)
      );
      cell.addEventListener("click", () => {
        if (!animating) onColumnClicked(i % boardWidth);
      });
    }
  }

  // Khởi tạo board theo kích thước mặc định
  if (boardSizeSelect && board) {
    const boardSize = boardSizeSelect.value;
    const [w, h] = boardSize.split("x").map(Number);
    if (!isNaN(w) && !isNaN(h)) {
      boardWidth = w;
      boardHeight = h;
      board.style.setProperty("--width", `${w * 10}vmin`);
      board.style.setProperty("--height", `${h * 10}vmin`);
      board.style.gridTemplateColumns = `repeat(${w}, 1fr)`;
      board.style.gridTemplateRows = `repeat(${h}, 1fr)`;
      initializeBoard();
    } else {
      console.error("Invalid board size:", boardSize);
    }

    boardSizeSelect.addEventListener("change", () => {
      const boardSize = boardSizeSelect.value;
      const [w, h] = boardSize.split("x").map(Number);
      if (!isNaN(w) && !isNaN(h)) {
        boardWidth = w;
        boardHeight = h;
        board.style.setProperty("--width", `${w * 10}vmin`);
        board.style.setProperty("--height", `${h * 10}vmin`);
        board.style.gridTemplateColumns = `repeat(${w}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${h}, 1fr)`;
        initializeBoard();
      } else {
        console.error("Invalid board size:", boardSize);
      }
    });
  } else {
    console.error("#board-size or #board not found in the document.");
  }

  function onColumnClicked(column) {
    // Tìm hàng trống cuối cùng của cột đã chọn (từ dưới lên)
    const columnCells = pieces.filter(
      (_, index) => index % boardWidth === column
    );
    const availableRow = columnCells.lastIndexOf(0);
    if (availableRow === -1) return;

    // Đánh dấu nước đi của người chơi hiện tại
    pieces[availableRow * boardWidth + column] = playerTurn;
    const cell = board.children[availableRow * boardWidth + column];
    const piece = document.createElement("div");
    piece.className = "piece";
    piece.dataset.placed = "true";
    piece.dataset.player = playerTurn;
    cell.appendChild(piece);

    // Xử lý animation: tính toán khoảng cách rơi của quân cờ dựa trên vị trí hover
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
  }

  function checkGameWinOrDraw() {
    animating = false;
    // Kiểm tra hòa: board không còn ô trống nào
    if (!pieces.includes(0)) {
      modalContainer.style.display = "block";
      modalMessage.textContent = "Draw";
      return;
    }

    // Kiểm tra chiến thắng của người chơi hiện tại
    if (hasPlayerWon(playerTurn)) {
      modalContainer.style.display = "block";
      const winnerColor =
        playerTurn === RED_TURN
          ? player1ColorSelect.value
          : player2ColorSelect.value;
      modalMessage.textContent = `${
        winnerColor.charAt(0).toUpperCase() + winnerColor.slice(1)
      } WON!`;
      modalMessage.dataset.winner = playerTurn;
    }

    // Chuyển lượt chơi và cập nhật quân hover
    playerTurn = playerTurn === RED_TURN ? YELLOW_TURN : RED_TURN;
    updateHover();
  }

  function updateHover() {
    removeUnplacedPiece();
    // Nếu ô đầu của cột hover trống, tạo quân hover
    if (pieces[hoverColumn] === 0) {
      const cell = board.children[hoverColumn];
      const piece = document.createElement("div");
      piece.className = "piece";
      piece.dataset.placed = "false";
      piece.dataset.player = playerTurn;
      cell.appendChild(piece);
    }
  }

  function removeUnplacedPiece() {
    const unplacedPiece = document.querySelector("[data-placed='false']");
    if (unplacedPiece) {
      unplacedPiece.parentElement.removeChild(unplacedPiece);
    }
  }

  function onMouseEnteredColumn(column) {
    hoverColumn = column;
    if (!animating) updateHover();
  }

  function hasPlayerWon(player) {
    // Kiểm tra 4 hướng: ngang, dọc, chéo xuống phải, chéo xuống trái
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
  }
});
