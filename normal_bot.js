const ROWS = 6;
const COLS = 7;
const EMPTY = 0;
const PLAYER = 1;
const AI = 2;
const MAX_DEPTH = 5;
const TIME_LIMIT = 1000; // Giới hạn thời gian tính toán (ms)

function copyBoard(board) {
  return board.map(row => row.slice());
}

function isValidMove(board, col) {
  return board[0][col] === EMPTY;
}

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

function winningMove(board, piece) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] === piece && board[r][c + 1] === piece && board[r][c + 2] === piece && board[r][c + 3] === piece) {
        return true;
      }
    }
  }
  for (let c = 0; c < COLS; c++) {
    for (let r = 0; r < ROWS - 3; r++) {
      if (board[r][c] === piece && board[r + 1][c] === piece && board[r + 2][c] === piece && board[r + 3][c] === piece) {
        return true;
      }
    }
  }
  for (let r = 3; r < ROWS; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] === piece && board[r - 1][c + 1] === piece && board[r - 2][c + 2] === piece && board[r - 3][c + 3] === piece) {
        return true;
      }
    }
  }
  for (let r = 0; r < ROWS - 3; r++) {
    for (let c = 0; c < COLS - 3; c++) {
      if (board[r][c] === piece && board[r + 1][c + 1] === piece && board[r + 2][c + 2] === piece && board[r + 3][c + 3] === piece) {
        return true;
      }
    }
  }
  return false;
}

function evaluateBoard(board, piece) {
  if (winningMove(board, AI)) return 1000000;
  if (winningMove(board, PLAYER)) return -1000000;
  return 0;
}

function getValidLocations(board) {
  let validLocations = [];
  for (let col = 0; col < COLS; col++) {
    if (isValidMove(board, col)) {
      validLocations.push(col);
    }
  }
  return validLocations;
}

function moveOrdering(validLocations, board, piece) {
  return validLocations.sort((a, b) => {
    return evaluateBoard(makeMove(board, b, piece)) - evaluateBoard(makeMove(board, a, piece));
  });
}

function negamax(board, depth, alpha, beta, color, startTime) {
  if (Date.now() - startTime > TIME_LIMIT) return { score: 0, column: null };
  
  const validLocations = moveOrdering(getValidLocations(board), board, color === 1 ? AI : PLAYER);
  if (depth === 0 || validLocations.length === 0 || winningMove(board, AI) || winningMove(board, PLAYER)) {
    return { score: color * evaluateBoard(board, AI), column: null };
  }
  
  let bestScore = -Infinity;
  let bestColumn = validLocations[0];
  for (let col of validLocations) {
    const newBoard = makeMove(board, col, color === 1 ? AI : PLAYER);
    let { score } = negamax(newBoard, depth - 1, -beta, -alpha, -color, startTime);
    score = -score;
    if (score > bestScore) {
      bestScore = score;
      bestColumn = col;
    }
    alpha = Math.max(alpha, score);
    if (alpha >= beta) break;
  }
  return { score: bestScore, column: bestColumn };
}

function getBestMove(board) {
  let bestMove = null;
  const startTime = Date.now();
  for (let depth = 1; depth <= MAX_DEPTH; depth++) {
    let result = negamax(board, depth, -Infinity, Infinity, 1, startTime);
    if (Date.now() - startTime > TIME_LIMIT) break;
    bestMove = result.column;
  }
  return bestMove;
}

// Xuất hàm để sử dụng trong index.html
window.getBestMove = getBestMove;
