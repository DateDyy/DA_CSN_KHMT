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
  const opponent = piece === AI ? PLAYER : AI;

  if (winningMove(board, piece)) return 100;
  if (winningMove(board, opponent)) return -100;

  // Ưu tiên 3 quân liên tiếp
  let score = 0;

  // Kiểm tra các hàng để tìm các đoạn có 2-3 quân
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length - 3; c++) {
      let window = board[r].slice(c, c + 4);
      score += evaluateWindow(window, piece);
    }
  }

  // Kiểm tra cột
  for (let c = 0; c < board[0].length; c++) {
    for (let r = 0; r < board.length - 3; r++) {
      let window = [board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]];
      score += evaluateWindow(window, piece);
    }
  }

  return score;
}
function evaluateWindow(window, piece) {
  const opponent = piece === AI ? PLAYER : AI;
  let score = 0;
  let countPiece = window.filter(cell => cell === piece).length;
  let countEmpty = window.filter(cell => cell === EMPTY).length;
  let countOpponent = window.filter(cell => cell === opponent).length;

  if (countPiece === 3 && countEmpty === 1) score += 5;     // cơ hội thắng
  else if (countPiece === 2 && countEmpty === 2) score += 2; // thiết lập thế
  if (countOpponent === 3 && countEmpty === 1) score -= 4;   // chặn người chơi

  return score;
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
