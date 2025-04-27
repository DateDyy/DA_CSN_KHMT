const EMPTY = 0;
const PLAYER = 1;
const AI = 2;

const transpositionTable = new Map();

function copyBoard(board) {
  return board.map(row => [...row]);
}

function isValidMove(board, col) {
  return board[0][col] === EMPTY;
}

function makeMove(board, col, piece) {
  const newBoard = copyBoard(board);
  for (let row = newBoard.length - 1; row >= 0; row--) {
    if (newBoard[row][col] === EMPTY) {
      newBoard[row][col] = piece;
      break;
    }
  }
  return newBoard;
}

function winningMove(board, piece) {
  const rows = board.length;
  const cols = board[0].length;
  const directions = [
    [[0, 1], [0, 2], [0, 3]],
    [[1, 0], [2, 0], [3, 0]],
    [[1, 1], [2, 2], [3, 3]],
    [[1, -1], [2, -2], [3, -3]]
  ];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] !== piece) continue;

      for (const [d1, d2, d3] of directions) {
        if (
          board[r + d1[0]]?.[c + d1[1]] === piece &&
          board[r + d2[0]]?.[c + d2[1]] === piece &&
          board[r + d3[0]]?.[c + d3[1]] === piece
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

function scoreWindow(window, piece) {
  const opponent = piece === AI ? PLAYER : AI;
  const countPiece = window.filter(c => c === piece).length;
  const countOpponent = window.filter(c => c === opponent).length;
  const countEmpty = 4 - countPiece - countOpponent;

  if (countPiece === 4) return 10000;
  if (countPiece === 3 && countEmpty === 1) return 1000;
  if (countPiece === 2 && countEmpty === 2) return 50;
  if (countOpponent === 3 && countEmpty === 1) return -1200;
  if (countOpponent === 2 && countEmpty === 2) return -30;
  return 0;
}

function evaluateBoard(board, piece) {
  if (winningMove(board, AI)) return 100000;
  if (winningMove(board, PLAYER)) return -100000;

  let score = 0;
  const rows = board.length;
  const cols = board[0].length;
  const opponent = piece === AI ? PLAYER : AI;
  const centerCol = Math.floor(cols / 2);

  // Ưu tiên cột trung tâm
  for (let r = 0; r < rows; r++) {
    if (board[r][centerCol] === piece) score += (rows - r) * 10;
  }

  const evaluateWindows = (rowStart, colStart, rowStep, colStep) => {
    for (let r = rowStart; r < rows; r++) {
      for (let c = colStart; c < cols; c++) {
        const window = [];
        for (let i = 0; i < 4; i++) {
          const row = r + i * rowStep;
          const col = c + i * colStep;
          if (row >= 0 && row < rows && col >= 0 && col < cols) {
            window.push(board[row][col]);
          }
        }
        if (window.length === 4) {
          score += scoreWindow(window, piece);
        }
      }
    }
  };

  evaluateWindows(0, 0, 0, 1); // Ngang
  evaluateWindows(0, 0, 1, 0); // Dọc
  evaluateWindows(0, 0, 1, 1); // Chéo phải
  evaluateWindows(0, cols - 1, 1, -1); // Chéo trái

  score -= 0.4 * evaluateBoardRaw(board, opponent);

  return score;
}

function evaluateBoardRaw(board, piece) {
  let score = 0;
  const rows = board.length;
  const cols = board[0].length;

  const evaluateWindows = (rowStart, colStart, rowStep, colStep) => {
    for (let r = rowStart; r < rows; r++) {
      for (let c = colStart; c < cols; c++) {
        const window = [];
        for (let i = 0; i < 4; i++) {
          const row = r + i * rowStep;
          const col = c + i * colStep;
          if (row >= 0 && row < rows && col >= 0 && col < cols) {
            window.push(board[row][col]);
          }
        }
        if (window.length === 4) {
          score += scoreWindow(window, piece);
        }
      }
    }
  };

  evaluateWindows(0, 0, 0, 1); // Ngang
  evaluateWindows(0, 0, 1, 0); // Dọc
  evaluateWindows(0, 0, 1, 1); // Chéo phải
  evaluateWindows(0, cols - 1, 1, -1); // Chéo trái

  return score;
}

function isTerminalNode(board) {
  return winningMove(board, PLAYER) || winningMove(board, AI) || getValidLocations(board).length === 0;
}

export function getValidLocations(board) {
  return board[0]
    .map((_, col) => col)
    .filter(col => isValidMove(board, col));
}

function boardToKey(board, color) {
  return board.flat().join('') + '|' + color;
}

function negamax(board, depth, alpha, beta, color) {
  const boardKey = boardToKey(board, color);
  const cached = transpositionTable.get(boardKey);
  if (cached && cached.depth >= depth) return cached.result;

  const validLocations = getValidLocations(board);
  const terminal = isTerminalNode(board);

  if (depth === 0 || terminal || validLocations.length === 0) {
    const score = color * evaluateBoard(board, AI);
    return { score, column: null };
  }

  // Ưu tiên nước đi gần trung tâm
  const center = Math.floor(board[0].length / 2);
  validLocations.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));

  let bestScore = -Infinity;
  let bestCol = validLocations[0];

  for (const col of validLocations) {
    const newBoard = makeMove(board, col, color === 1 ? AI : PLAYER);
    const { score } = negamax(newBoard, depth - 1, -beta, -alpha, -color);
    const currentScore = -score;

    if (currentScore > bestScore) {
      bestScore = currentScore;
      bestCol = col;
    }

    alpha = Math.max(alpha, bestScore);
    if (alpha >= beta) break;
  }

  const result = { score: bestScore, column: bestCol };
  transpositionTable.set(boardKey, { depth, result });
  return result;
}

export function getBestMove(board, validMovesCount) {
  let depth = 7;
  if (validMovesCount > 20) depth = 5;
  if (validMovesCount > 30) depth = 4;
  if (validMovesCount < 10) depth = 9;
  if (validMovesCount < 5) depth = 12;

  transpositionTable.clear();
  return negamax(board, depth, -Infinity, Infinity, 1).column;
}
