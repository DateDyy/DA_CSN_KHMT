const board = document.querySelector("#board");
const modalContainer = document.querySelector("#modal-container");
const modalMessage = document.querySelector("#modal-message");
const resetButton = document.querySelector("#reset");
const boardSizeSelect = document.querySelector("#board-size");

resetButton.onclick = () => {
  location.reload();
};

let boardWidth = 7; // Kích thước bảng mặc định
let boardHeight = 6; // Kích thước bảng mặc định

const RED_TURN = 1;
const YELLOW_TURN = 2;

let pieces = [];

let playerTurn = RED_TURN; // 1 - red, 2 - yellow
let hoverColumn = -1;
let animating = false;

// Hàm khởi tạo lại board theo kích thước mới
function initializeBoard() {
  // // Xóa nội dung board hiện tại
  // board.innerHTML = "";
  // Khởi tạo mảng pieces với số phần tử = boardWidth * boardHeight, tất cả đều bằng 0
  pieces = new Array(boardWidth * boardHeight).fill(0);

  // // Reset trạng thái game
  // playerTurn = RED_TURN;
  // hoverColumn = -1;
  // animating = false;

  // Tạo các ô trên board
  for (let i = 0; i < boardWidth * boardHeight; i++) {
    let cell = document.createElement("div");
    cell.className = "cell";
    board.appendChild(cell);

    // Xác định cột của ô hiện tại
    let col = i % boardWidth;
    cell.onmouseenter = () => onMouseEnteredColumn(col);
    cell.onclick = () => {
      if (!animating) {
        onColumnClicked(col);
      }
    };
  }
}

// Khởi tạo board theo giá trị select mặc định
if (boardSizeSelect && board) {
  const boardSize = boardSizeSelect.value;
  let [w, h] = boardSize.split("x").map(Number);
  if (!isNaN(w) && !isNaN(h)) {
    boardWidth = w;
    boardHeight = h;
    board.style.setProperty("--width", `${w * 10}vmin`);
    board.style.setProperty("--height", `${h * 10}vmin`);
    initializeBoard();
  } else {
    console.error("Invalid board size:", boardSize);
  }

  // Khi người dùng thay đổi kích thước board
  boardSizeSelect.onchange = () => {
    const boardSize = boardSizeSelect.value;
    let [w, h] = boardSize.split("x").map(Number);
    if (!isNaN(w) && !isNaN(h)) {
      boardWidth = w;
      boardHeight = h;
      board.style.setProperty("--width", `${w * 10}vmin`);
      board.style.setProperty("--height", `${h * 10}vmin`);
      initializeBoard();
    } else {
      console.error("Invalid board size:", boardSize);
    }
  };
} else {
  console.error("#board-size or #board not found in the document.");
}

function onColumnClicked(column) {
  // Tìm hàng trống ở cột được chọn, từ dưới lên trên
  let availableRow = -1;
  for (let row = boardHeight - 1; row >= 0; row--) {
    if (pieces[row * boardWidth + column] === 0) {
      availableRow = row;
      break;
    }
  }
  if (availableRow === -1) {
    // Cột đã đầy
    return;
  }

  // Đánh dấu nước đi của người chơi hiện tại
  pieces[availableRow * boardWidth + column] = playerTurn;
  let cell = board.children[availableRow * boardWidth + column];
  let piece = document.createElement("div");
  piece.className = "piece";
  piece.dataset.placed = true;
  piece.dataset.player = playerTurn;
  cell.appendChild(piece);

  // Xử lý animation nếu có phần tử "unplaced" (hiệu ứng khi hover)
  let unplacedPiece = document.querySelector("[data-placed='false']");
  if (unplacedPiece) {
    let unplacedY = unplacedPiece.getBoundingClientRect().y;
    let placedY = piece.getBoundingClientRect().y;
    let yDiff = unplacedY - placedY;

    animating = true;
    removeUnplacedPiece();
    let animation = piece.animate(
      [
        { transform: `translateY(${yDiff}px)`, offset: 0 },
        { transform: `translateY(0px)`, offset: 0.6 },
        { transform: `translateY(${yDiff / 20}px)`, offset: 0.8 },
        { transform: `translateY(0px)`, offset: 0.95 },
      ],
      {
        duration: 400,
        easing: "linear",
        iterations: 1,
      }
    );
    animation.addEventListener("finish", checkGameWinOrDraw);
  } else {
    checkGameWinOrDraw();
  }
}

function checkGameWinOrDraw() {
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
    modalMessage.textContent = `${
      playerTurn === RED_TURN ? "Red" : "Yellow"
    } WON!`;
    modalMessage.dataset.winner = playerTurn;
    return;
  }

  // Chuyển lượt chơi
  playerTurn = playerTurn === RED_TURN ? YELLOW_TURN : RED_TURN;
  updateHover();
}

function updateHover() {
  removeUnplacedPiece();
  // Hiển thị quân "hover" ở ô đầu tiên của cột (giả sử board được xếp theo hàng từ trên xuống)
  if (hoverColumn >= 0 && pieces[hoverColumn] === 0) {
    let cell = board.children[hoverColumn];
    let piece = document.createElement("div");
    piece.className = "piece";
    piece.dataset.placed = false;
    piece.dataset.player = playerTurn;
    cell.appendChild(piece);
  }
}

function removeUnplacedPiece() {
  let unplacedPiece = document.querySelector("[data-placed='false']");
  if (unplacedPiece) {
    unplacedPiece.parentElement.removeChild(unplacedPiece);
  }
}

function onMouseEnteredColumn(column) {
  hoverColumn = column;
  if (!animating) {
    updateHover();
  }
}

function hasPlayerWon(player) {
  // Duyệt qua tất cả các ô để kiểm tra 4 quân liên tiếp theo 4 hướng:
  // ngang, dọc, chéo xuống phải và chéo xuống trái.
  for (let row = 0; row < boardHeight; row++) {
    for (let col = 0; col < boardWidth; col++) {
      let index = row * boardWidth + col;
      if (pieces[index] !== player) continue;

      // Ngang (Horizontal)
      if (col <= boardWidth - 4) {
        if (
          pieces[row * boardWidth + (col + 1)] === player &&
          pieces[row * boardWidth + (col + 2)] === player &&
          pieces[row * boardWidth + (col + 3)] === player
        ) {
          return true;
        }
      }

      // Dọc (Vertical)
      if (row <= boardHeight - 4) {
        if (
          pieces[(row + 1) * boardWidth + col] === player &&
          pieces[(row + 2) * boardWidth + col] === player &&
          pieces[(row + 3) * boardWidth + col] === player
        ) {
          return true;
        }
      }

      // Chéo xuống phải (Diagonal down-right)
      if (col <= boardWidth - 4 && row <= boardHeight - 4) {
        if (
          pieces[(row + 1) * boardWidth + (col + 1)] === player &&
          pieces[(row + 2) * boardWidth + (col + 2)] === player &&
          pieces[(row + 3) * boardWidth + (col + 3)] === player
        ) {
          return true;
        }
      }

      // Chéo xuống trái (Diagonal down-left)
      if (col >= 3 && row <= boardHeight - 4) {
        if (
          pieces[(row + 1) * boardWidth + (col - 1)] === player &&
          pieces[(row + 2) * boardWidth + (col - 2)] === player &&
          pieces[(row + 3) * boardWidth + (col - 3)] === player
        ) {
          return true;
        }
      }
    }
  }
  return false;
}
