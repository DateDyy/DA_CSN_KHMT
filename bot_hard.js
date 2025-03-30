// bot_hard.js

// Khai báo các hằng số cho Connect 4
const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const PLAYER = 1; // Người chơi
const AI = 2; // Bot

// Hàm tạo bản sao board
function copyBoard(board) {
  return board.map((row) => row.slice());
}

// Kiểm tra nước đi có hợp lệ (cột chưa đầy)
function isValidMove(board, col) {
  return board[0][col] === EMPTY;
}

// Thực hiện nước đi và trả về board mới
function makeMove(board, col, piece) {
  const newBoard = copyBoard(board);
  for (let row = ROWS - 1; row >= 0; row--) {
    if (newBoard[row][col] === EMPTY) {
      newBoard[row][col] = piece;
      break;
    }
  }
  return newBoard;
}

// Kiểm tra nước đi thắng cuộc (4 quân liên tiếp)
function winningMove(board, piece) {
  // Kiểm tra hàng ngang
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
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
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 3; r++) {
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
  // Kiểm tra đường chéo dương
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (
        board[r][c] === piece &&
        board[r - 1][c + 1] === piece &&
        board[r - 2][c + 2] === piece &&
        board[r - 3][c + 3] === piece
      ) {
        return true;
      }
    }
  }
  // Kiểm tra đường chéo âm
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (
        board[r][c] === piece &&
        board[r + 1][c + 1] === piece &&
        board[r + 2][c + 2] === piece &&
        board[r + 3][c + 3] === piece
      ) {
        return true;
      }
    }
  }
  return false;
}

// Hàm đánh giá board hiện tại cho AI (có thể cải tiến thêm)
function evaluateBoard(board, piece) {
  if (winningMove(board, AI)) {
    return 1000000;
  } else if (winningMove(board, PLAYER)) {
    return -1000000;
  }
  return 0;
}

// Kiểm tra trạng thái kết thúc (thắng hoặc board đầy)
function isTerminalNode(board) {
  return (
    winningMove(board, PLAYER) ||
    winningMove(board, AI) ||
    getValidLocations(board).length === 0
  );
}

// Lấy danh sách các cột có thể thực hiện nước đi
function getValidLocations(board) {
  const validLocations = [];
  for (let col = 0; col < COLS; col++) {
    if (isValidMove(board, col)) {
      validLocations.push(col);
    }
  }
  return validLocations;
}

// Thuật toán minimax với alpha-beta pruning
function minimax(board, depth, alpha, beta, maximizingPlayer) {
  const validLocations = getValidLocations(board);
  const terminal = isTerminalNode(board);

  if (depth === 0 || terminal) {
    if (terminal) {
      if (winningMove(board, AI)) {
        return { score: 1000000 };
      } else if (winningMove(board, PLAYER)) {
        return { score: -1000000 };
      } else {
        return { score: 0 }; // Hòa
      }
    } else {
      return { score: evaluateBoard(board, AI) };
    }
  }

  if (maximizingPlayer) {
    let value = -Infinity;
    let bestColumn = validLocations[0];
    for (let col of validLocations) {
      const newBoard = makeMove(board, col, AI);
      const newScore = minimax(newBoard, depth - 1, alpha, beta, false).score;
      if (newScore > value) {
        value = newScore;
        bestColumn = col;
      }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break; // cắt tỉa
    }
    return { column: bestColumn, score: value };
  } else {
    let value = Infinity;
    let bestColumn = validLocations[0];
    for (let col of validLocations) {
      const newBoard = makeMove(board, col, PLAYER);
      const newScore = minimax(newBoard, depth - 1, alpha, beta, true).score;
      if (newScore < value) {
        value = newScore;
        bestColumn = col;
      }
      beta = Math.min(beta, value);
      if (alpha >= beta) break; // cắt tỉa
    }
    return { column: bestColumn, score: value };
  }
}

// Hàm lấy nước đi tốt nhất cho AI với độ sâu tìm kiếm nhất định
function getBestMove(board, depth = 5) {
  return minimax(board, depth, -Infinity, Infinity, true).column;
}

// Xuất các hàm cần thiết để tích hợp vào logic chính
module.exports = {
  getBestMove,
  minimax,
  makeMove,
  isValidMove,
  getValidLocations,
  winningMove,
  evaluateBoard,
  isTerminalNode,
};
