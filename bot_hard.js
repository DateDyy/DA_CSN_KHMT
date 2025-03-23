// bot_hard.js

// Các hằng số cho Connect 4 (vẫn giữ các hằng số cho EMPTY, PLAYER, AI)
const EMPTY = 0;
const PLAYER = 1; // Người chơi
const AI = 2; // Bot

// Tạo bản sao của board (mảng 2D)
function copyBoard(board) {
  return board.map((row) => row.slice());
}

// Kiểm tra nước đi có hợp lệ tại cột (dựa vào số cột của board)
function isValidMove(board, col) {
  return board[0][col] === EMPTY;
}

// Thực hiện nước đi tại cột đã chọn và trả về board mới
function makeMove(board, col, piece) {
  const newBoard = copyBoard(board);
  const rows = board.length;
  for (let row = rows - 1; row >= 0; row--) {
    if (newBoard[row][col] === EMPTY) {
      newBoard[row][col] = piece;
      break;
    }
  }
  return newBoard;
}

// Kiểm tra thắng cuộc: 4 quân liên tiếp theo các hướng
function winningMove(board, piece) {
  const rows = board.length;
  const cols = board[0].length;

  // Hàng ngang
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
  // Hàng dọc
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
  // Đường chéo xuống phải
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
  }
  // Đường chéo xuống trái
  for (let r = 0; r < rows - 3; r++) {
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

// Hàm quét một cửa sổ (window) gồm 4 ô và tính điểm cho cửa sổ đó
function scoreWindow(window, piece) {
  let score = 0;
  const opponent = piece === AI ? PLAYER : AI;
  const countPiece = window.filter((cell) => cell === piece).length;
  const countOpponent = window.filter((cell) => cell === opponent).length;
  const countEmpty = window.filter((cell) => cell === EMPTY).length;

  if (countPiece === 4) {
    score += 100;
  } else if (countPiece === 3 && countEmpty === 1) {
    score += 5;
  } else if (countPiece === 2 && countEmpty === 2) {
    score += 2;
  }

  if (countOpponent === 3 && countEmpty === 1) {
    score -= 4;
  }

  return score;
}

// Hàm đánh giá board hiện tại cho AI theo nhiều tiêu chí
function evaluateBoard(board, piece) {
  if (winningMove(board, AI)) return 1000000;
  if (winningMove(board, PLAYER)) return -1000000;

  let score = 0;
  const rows = board.length;
  const cols = board[0].length;

  // Ưu tiên nước đi ở cột trung tâm
  const centerCol = Math.floor(cols / 2);
  let centerArray = [];
  for (let r = 0; r < rows; r++) {
    centerArray.push(board[r][centerCol]);
  }
  const centerCount = centerArray.filter((cell) => cell === piece).length;
  score += centerCount * 3;

  // Hàng ngang
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 3; c++) {
      const window = board[r].slice(c, c + 4);
      score += scoreWindow(window, piece);
    }
  }

  // Hàng dọc
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows - 3; r++) {
      let window = [];
      for (let i = 0; i < 4; i++) {
        window.push(board[r + i][c]);
      }
      score += scoreWindow(window, piece);
    }
  }

  // Đường chéo xuống phải
  for (let r = 0; r < rows - 3; r++) {
    for (let c = 0; c < cols - 3; c++) {
      let window = [];
      for (let i = 0; i < 4; i++) {
        window.push(board[r + i][c + i]);
      }
      score += scoreWindow(window, piece);
    }
  }

  // Đường chéo xuống trái
  for (let r = 0; r < rows - 3; r++) {
    for (let c = 3; c < cols; c++) {
      let window = [];
      for (let i = 0; i < 4; i++) {
        window.push(board[r + i][c - i]);
      }
      score += scoreWindow(window, piece);
    }
  }

  return score;
}

// Kiểm tra trạng thái kết thúc của board: chiến thắng hoặc board đầy
function isTerminalNode(board) {
  return (
    winningMove(board, PLAYER) ||
    winningMove(board, AI) ||
    getValidLocations(board).length === 0
  );
}

// Lấy danh sách các cột hợp lệ để thực hiện nước đi
function getValidLocations(board) {
  const cols = board[0].length;
  const validLocations = [];
  for (let col = 0; col < cols; col++) {
    if (isValidMove(board, col)) {
      validLocations.push(col);
    }
  }
  return validLocations;
}

/*
  Thuật toán Negamax:
  - Sử dụng tham số "color" (+1 nếu lượt của AI, -1 nếu lượt của đối thủ)
  - Đánh giá board từ góc nhìn của AI: sử dụng color * evaluateBoard(board, AI)
  - Khi thực hiện nước đi, nếu color == +1 thì nước đi của AI, nếu -1 thì của PLAYER.
*/
function negamax(board, depth, alpha, beta, color) {
  const validLocations = getValidLocations(board);
  const terminal = isTerminalNode(board);

  if (depth === 0 || terminal) {
    if (terminal) {
      if (winningMove(board, AI)) {
        return { score: color * 1000000 };
      } else if (winningMove(board, PLAYER)) {
        return { score: color * -1000000 };
      } else {
        return { score: 0 };
      }
    } else {
      return { score: color * evaluateBoard(board, AI) };
    }
  }

  let value = -Infinity;
  let bestColumn = validLocations[0];

  for (let col of validLocations) {
    const piece = color === 1 ? AI : PLAYER;
    const newBoard = makeMove(board, col, piece);
    const newScore = -negamax(newBoard, depth - 1, -beta, -alpha, -color).score;
    if (newScore > value) {
      value = newScore;
      bestColumn = col;
    }
    alpha = Math.max(alpha, value);
    if (alpha >= beta) break;
  }

  return { column: bestColumn, score: value };
}

// Hàm lấy nước đi tốt nhất cho AI với độ sâu tìm kiếm (mặc định = 5)
// Dùng negamax với màu ban đầu là +1 (tức là lượt của AI)
export function getBestMove(board, depth = 5) {
  return negamax(board, depth, -Infinity, Infinity, 1).column;
}
