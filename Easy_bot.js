// easy_bot.js

const EMPTY = 0;
const PLAYER = 1; // Người chơi
const AI = 2; // Bot

// Sao chép bàn cờ
function copyBoard(board) {
  return board.map((row) => row.slice());
}

// Kiểm tra nước đi hợp lệ
function isValidMove(board, col) {
  return board[0][col] === EMPTY;
}

// Thực hiện nước đi
function makeMove(board, col, piece) {
  const newBoard = copyBoard(board);
  for (let row = board.length - 1; row >= 0; row--) {
    if (newBoard[row][col] === EMPTY) {
      newBoard[row][col] = piece;
      break;
    }
  }
  return newBoard;
}

// Kiểm tra chiến thắng
function winningMove(board, piece) {
  const rows = board.length;
  const cols = board[0].length;
  
  // Kiểm tra hàng ngang
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 3; c++) {
      if (
        board[r][c] === piece &&
        board[r][c + 1] === piece &&
        board[r][c + 2] === piece &&
        board[r][c + 3] === piece
      ) {
        return true;
      }
    }
  }
  // Kiểm tra hàng dọc
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows - 3; r++) {
      if (
        board[r][c] === piece &&
        board[r + 1][c] === piece &&
        board[r + 2][c] === piece &&
        board[r + 3][c] === piece
      ) {
        return true;
      }
    }
  }
  // Kiểm tra đường chéo
  for (let r = 0; r < rows - 3; r++) {
    for (let c = 0; c < cols - 3; c++) {
      if (
        board[r][c] === piece &&
        board[r + 1][c + 1] === piece &&
        board[r + 2][c + 2] === piece &&
        board[r + 3][c + 3] === piece
      ) {
        return true;
      }
    }
    for (let c = 3; c < cols; c++) {
      if (
        board[r][c] === piece &&
        board[r + 1][c - 1] === piece &&
        board[r + 2][c - 2] === piece &&
        board[r + 3][c - 3] === piece
      ) {
        return true;
      }
    }
  }
  return false;
}

// Hàm đánh giá đơn giản
function evaluateBoard(board, piece) {
  if (winningMove(board, AI)) return 100;
  if (winningMove(board, PLAYER)) return -100;
  return Math.floor(Math.random() * 10); // Điểm ngẫu nhiên để bot không quá mạnh
}

// Lấy danh sách các cột hợp lệ
function getValidLocations(board) {
  return board[0].map((_, col) => col).filter((col) => isValidMove(board, col));
}

// Thuật toán Minimax cơ bản
function minimax(board, depth, isMaximizing) {
  if (depth === 0 || winningMove(board, AI) || winningMove(board, PLAYER)) {
    return { score: evaluateBoard(board, AI) };
  }
  
  let validLocations = getValidLocations(board);
  if (isMaximizing) {
    let bestScore = -Infinity;
    let bestColumn = validLocations[0];
    for (let col of validLocations) {
      let newBoard = makeMove(board, col, AI);
      let score = minimax(newBoard, depth - 1, false).score;
      if (score > bestScore) {
        bestScore = score;
        bestColumn = col;
      }
    }
    return { column: bestColumn, score: bestScore };
  } else {
    let bestScore = Infinity;
    let bestColumn = validLocations[0];
    for (let col of validLocations) {
      let newBoard = makeMove(board, col, PLAYER);
      let score = minimax(newBoard, depth - 1, true).score;
      if (score < bestScore) {
        bestScore = score;
        bestColumn = col;
      }
    }
    return { column: bestColumn, score: bestScore };
  }
}

// Hàm chọn nước đi tốt nhất
export function getBestMove(board, depth = 2) {
  console.log("Easy bot is calculating best move...");
  return minimax(board, depth, true).column;
}
