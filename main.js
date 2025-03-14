document.addEventListener("DOMContentLoaded", () => {
  const board = document.querySelector("#board");
  const modalContainer = document.querySelector("#modal-container");
  const modalMessage = document.querySelector("#modal-message");
  const resetButton = document.querySelector("#reset");
  const boardSizeSelect = document.querySelector("#board-size");
  const player1ColorSelect = document.querySelector("#player1-color");
  const player2ColorSelect = document.querySelector("#player2-color");

  // Kích thước board mặc định (số cột x số hàng)
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

  // Hàm cấu hình kích thước board và khởi tạo lại board
  // Ở đây thay vì thay đổi kích thước tổng của board, chúng ta cập nhật số cột và số hàng qua biến CSS
  const setBoardDimensions = (sizeStr) => {
    const [w, h] = sizeStr.split("x").map(Number);
    if (isNaN(w) || isNaN(h)) {
      console.error("Invalid board size:", sizeStr);
      return;
    }
    boardWidth = w;
    boardHeight = h;

    // Cập nhật biến CSS cho số cột và số hàng (đặt trên :root)
    document.documentElement.style.setProperty("--board-cols", w);
    document.documentElement.style.setProperty("--board-rows", h);

    // Cập nhật cấu trúc grid: sử dụng 'auto' để mỗi ô giữ kích thước cố định (theo CSS, ví dụ --cell-size)
    board.style.gridTemplateColumns = `repeat(${w}, auto)`;
    board.style.gridTemplateRows = `repeat(${h}, auto)`;

    initializeBoard();
  };

  resetButton.addEventListener("click", () => {
    modalContainer.style.display = "none";
    initializeBoard();
  });

  // Hàm khởi tạo lại board: reset mảng pieces và tạo cell mới
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
  };

  // Tìm hàng trống cuối cùng (từ dưới lên) trong cột đã chọn
  const getAvailableRowInColumn = (column) => {
    for (let row = boardHeight - 1; row >= 0; row--) {
      if (pieces[row * boardWidth + column] === 0) {
        return row;
      }
    }
    return -1;
  };

  const onColumnClicked = (column) => {
    const availableRow = getAvailableRowInColumn(column);
    if (availableRow === -1) return; // Cột đầy

    pieces[availableRow * boardWidth + column] = playerTurn;
    const cell = board.children[availableRow * boardWidth + column];
    const piece = document.createElement("div");
    piece.className = "piece";
    piece.dataset.placed = "true";
    piece.dataset.player = playerTurn;
    cell.appendChild(piece);

    // Xử lý animation: tính khoảng cách rơi dựa trên vị trí quân cờ hover (nếu có)
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

  const checkGameWinOrDraw = () => {
    animating = false;
    // Kiểm tra hòa: không còn ô trống nào
    if (!pieces.includes(0)) {
      modalContainer.style.display = "block";
      modalMessage.textContent = "Draw";
      return;
    }
    // Kiểm tra chiến thắng của người chơi hiện tại
    if (hasPlayerWon(playerTurn)) {
      modalContainer.style.display = "block";
      const winnerColor =
        playerTurn === FIRST_TURN
          ? player1ColorSelect.value
          : player2ColorSelect.value;
      modalMessage.textContent =
        winnerColor.charAt(0).toUpperCase() + winnerColor.slice(1) + " WON!";
      modalMessage.dataset.winner = playerTurn;
      return;
    }
    // Chuyển lượt và cập nhật quân hover
    playerTurn = playerTurn === FIRST_TURN ? SECOND_TURN : FIRST_TURN;
    updateHover();
  };

  // Cập nhật quân hover trên ô đầu tiên của cột đang di chuột (nếu có ô trống)
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
    if (unplacedPiece && unplacedPiece.parentElement) {
      unplacedPiece.parentElement.removeChild(unplacedPiece);
    }
  };

  const onMouseEnteredColumn = (column) => {
    hoverColumn = column;
    if (!animating) updateHover();
  };

  // Kiểm tra điều kiện thắng (4 hướng: ngang, dọc, chéo xuống phải, chéo xuống trái)
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

  // Khởi tạo board dựa theo kích thước được chọn
  if (boardSizeSelect && board) {
    setBoardDimensions(boardSizeSelect.value);
    boardSizeSelect.addEventListener("change", () =>
      setBoardDimensions(boardSizeSelect.value)
    );
  } else {
    console.error("#board-size or #board not found in the document.");
  }
});
