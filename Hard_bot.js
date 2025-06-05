// Định nghĩa giá trị cho các ô trên bàn cờ
const EMPTY = 0;
const PLAYER = 1;
const AI = 2;

// Bảng băm lưu trữ các trạng thái đã tính toán để tối ưu tốc độ
const transpositionTable = new Map();
const MAX_TABLE_SIZE = 1000000; // Giới hạn kích thước bảng băm

/**
 * Thêm trạng thái vào bảng băm. Nếu bảng đầy, xóa bớt 20% trạng thái cũ.
 * @param {string} key - Khóa đại diện cho trạng thái bàn cờ
 * @param {number} depth - Độ sâu tìm kiếm của trạng thái này
 * @param {object} result - Kết quả tính toán tại trạng thái này
 */
function addToTranspositionTable(key, depth, result) {
  if (transpositionTable.size >= MAX_TABLE_SIZE) {
    // Xóa 20% trạng thái cũ khi bảng đầy
    const keys = [...transpositionTable.keys()].slice(0, Math.floor(MAX_TABLE_SIZE * 0.2));
    keys.forEach(k => transpositionTable.delete(k));
  }
  transpositionTable.set(key, { depth, result });
}

/**
 * Tạo bản sao mới của bàn cờ (2 chiều)
 * @param {number[][]} board - Bàn cờ hiện tại
 * @returns {number[][]} - Bản sao của bàn cờ
 */
function copyBoard(board) {
  return board.map(row => [...row]);
}

/**
 * Kiểm tra một cột có thể đặt quân được không
 * @param {number[][]} board - Bàn cờ hiện tại
 * @param {number} col - Chỉ số cột
 * @returns {boolean} - true nếu cột còn trống ở hàng trên cùng
 */
function isValidMove(board, col) {
  return board[0][col] === EMPTY;
}

/**
 * Đặt quân vào một cột trên bản sao của bàn cờ và trả về bàn cờ mới
 * @param {number[][]} board - Bàn cờ hiện tại
 * @param {number} col - Cột muốn đặt quân
 * @param {number} piece - Loại quân (PLAYER hoặc AI)
 * @returns {number[][]} - Bàn cờ mới sau khi đặt quân
 */
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

/**
 * Đặt quân vào một cột trên bàn cờ hiện tại và trả về vị trí đã đặt quân
 * @param {number[][]} board - Bàn cờ hiện tại
 * @param {number} col - Cột muốn đặt quân
 * @param {number} piece - Loại quân (PLAYER hoặc AI)
 * @returns {number} - Vị trí hàng đã đặt quân, hoặc -1 nếu không hợp lệ
 */
function makeMoveInPlace(board, col, piece) {
  for (let row = board.length - 1; row >= 0; row--) {
    if (board[row][col] === EMPTY) {
      board[row][col] = piece;
      return row; // trả về vị trí đã đặt quân để undo nhanh
    }
  }
  return -1; // không hợp lệ
}

/**
 * Hoàn tác nước đi vừa thực hiện trên bàn cờ (xóa quân ở vị trí row, col)
 * @param {number[][]} board - Bàn cờ hiện tại
 * @param {number} col - Cột đã đặt quân
 * @param {number} row - Hàng đã đặt quân
 */
function undoMove(board, col, row) {
  board[row][col] = EMPTY;
}

/**
 * Kiểm tra xem một quân có tạo thành chuỗi thắng trên bàn cờ không
 * @param {number[][]} board - Bàn cờ hiện tại
 * @param {number} piece - Loại quân (PLAYER hoặc AI)
 * @returns {boolean} - true nếu có chuỗi thắng, ngược lại false
 */
function winningMove(board, piece) {
  const rows = board.length;
  const cols = board[0].length;
  const directions = [
    [[0, 1], [0, 2], [0, 3]], // Ngang
    [[1, 0], [2, 0], [3, 0]], // Dọc
    [[1, 1], [2, 2], [3, 3]], // Chéo phải
    [[1, -1], [2, -2], [3, -3]] // Chéo trái
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

/**
 * Tính điểm cho một "cửa sổ" 4 ô dựa trên số lượng quân của mỗi bên
 * @param {number[]} window - Mảng 4 ô liên tiếp
 * @param {number} piece - Quân đang xét (PLAYER hoặc AI)
 * @returns {number} - Điểm số cho cửa sổ này
 */
function scoreWindow(window, piece) {
  const opponent = piece === AI ? PLAYER : AI;
  const countPiece = window.filter(c => c === piece).length;
  const countOpponent = window.filter(c => c === opponent).length;
  const countEmpty = 4 - countPiece - countOpponent;

  if (countPiece === 4) return 10000;
  if (countPiece === 3 && countEmpty === 1 && countOpponent === 0) return 5000;
  if (countPiece === 2 && countEmpty === 2 && countOpponent === 0) return 200;
  if (countOpponent === 3 && countEmpty === 1) return -8000;
  if (countOpponent === 2 && countEmpty === 2) return -100;
  return 0;
}

/**
 * Đánh giá tổng thể bàn cờ cho một bên (AI hoặc PLAYER)
 * @param {number[][]} board - Bàn cờ hiện tại
 * @param {number} piece - Quân đang xét (PLAYER hoặc AI)
 * @returns {number} - Điểm số tổng thể của bàn cờ
 */
function evaluateBoard(board, piece) {
  if (winningMove(board, AI)) return 100000;
  if (winningMove(board, PLAYER)) return -100000;

  let score = 0;
  const rows = board.length;
  const cols = board[0].length;
  const opponent = piece === AI ? PLAYER : AI;
  const centerCol = Math.floor(cols / 2);

  // Ưu tiên các quân ở cột trung tâm
  for (let r = 0; r < rows; r++) {
    if (board[r][centerCol] === piece) score += (rows - r) * 10;
  }

  // Đánh giá các cửa sổ 4 ô theo các hướng
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

  // Trừ điểm nếu đối thủ có thế mạnh
  score -= 0.4 * evaluateBoardRaw(board, opponent);

  return score;
}

/**
 * Đánh giá bàn cờ cho một bên mà không ưu tiên vị trí trung tâm
 * @param {number[][]} board - Bàn cờ hiện tại
 * @param {number} piece - Quân đang xét (PLAYER hoặc AI)
 * @returns {number} - Điểm số tổng thể của bàn cờ
 */
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

/**
 * Kiểm tra xem trạng thái hiện tại là trạng thái kết thúc (thắng, thua hoặc hòa)
 * @param {number[][]} board - Bàn cờ hiện tại
 * @returns {boolean} - true nếu là trạng thái kết thúc
 */
function isTerminalNode(board) {
  return winningMove(board, PLAYER) || winningMove(board, AI) || getValidLocations(board).length === 0;
}

/**
 * Lấy danh sách các cột hợp lệ để đặt quân
 * @param {number[][]} board - Bàn cờ hiện tại
 * @returns {number[]} - Mảng các chỉ số cột hợp lệ
 */
export function getValidLocations(board) {
  return board[0]
    .map((_, col) => col)
    .filter(col => isValidMove(board, col));
}

/**
 * Chuyển bàn cờ thành chuỗi khóa duy nhất để lưu vào bảng băm
 * @param {number[][]} board - Bàn cờ hiện tại
 * @param {number} color - Quân hiện tại (1 hoặc -1)
 * @returns {string} - Chuỗi đại diện cho trạng thái bàn cờ
 */
function boardToKey(board, color) {
  return board.flat().join('') + '|' + color;
}

// Quản lý thời gian cho thuật toán lặp sâu dần
let startTime;
let timeLimit = 1000; // Mặc định 1 giây

/**
 * Tìm nước đi tốt nhất cho quân hiện tại trên bàn cờ
 * @param {number[][]} board - Bàn cờ hiện tại
 * @param {number} validMovesCount - Số lượng nước đi hợp lệ có thể thực hiện
 * @returns {number} - Cột tốt nhất để thực hiện nước đi tiếp theo
 */
export function getBestMove(board, validMovesCount) {
  startTime = Date.now();

  // Điều chỉnh thời gian dựa vào kích thước bàn cờ
  const totalCells = board.length * board[0].length;
  if (totalCells > 42) { // Lớn hơn bàn cờ chuẩn 7x6
    timeLimit = 1500; // Tăng thời gian cho bàn lớn
  }
  if (totalCells > 56) { // Lớn hơn nữa
    timeLimit = 2000; // Tăng thêm thời gian
  }

  let depth = 1;
  let bestMove = null;
  let maxDepth = 7;

  // Điều chỉnh độ sâu tối đa dựa vào số nước đi hợp lệ
  if (validMovesCount > 20) maxDepth = 5;
  if (validMovesCount > 30) maxDepth = 4;
  if (validMovesCount > 10) maxDepth = 9;
  if (validMovesCount < 5) maxDepth = 12;

  transpositionTable.clear();

  // Lặp sâu dần
  while (depth <= maxDepth) {
    const result = negamax(board, depth, -Infinity, Infinity, 1);
    if (Date.now() - startTime > timeLimit) break;

    bestMove = result.column;
    depth++;
  }

  return bestMove;
}

// Thuật toán negamax với cắt tỉa alpha-beta và kiểm soát thời gian
/**
 * Thuật toán tìm kiếm nước đi tốt nhất sử dụng phương pháp negamax với cắt tỉa alpha-beta
 * @param {number[][]} board - Bàn cờ hiện tại
 * @param {number} depth - Độ sâu tìm kiếm còn lại
 * @param {number} alpha - Giá trị alpha cho cắt tỉa
 * @param {number} beta - Giá trị beta cho cắt tỉa
 * @param {number} color - Màu sắc của quân hiện tại (1 cho AI, -1 cho PLAYER)
 * @returns {object} - Đối tượng chứa thông tin về điểm số tốt nhất và cột tương ứng
 */
function negamax(board, depth, alpha, beta, color) {
  if (Date.now() - startTime > timeLimit) {
    return { score: 0, column: null, timeOut: true };
  }

  const boardKey = boardToKey(board, color);
  const cached = transpositionTable.get(boardKey);
  if (cached && cached.depth >= depth) return cached.result;

  const validLocations = getValidLocations(board);
  const terminal = isTerminalNode(board);

  if (depth === 0 || terminal || validLocations.length === 0) {
    const score = color * evaluateBoard(board, AI);
    return { score, column: null };
  }

  const center = Math.floor(board[0].length / 2);
  validLocations.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));

  let bestScore = -Infinity;
  let bestCol = validLocations[0];

  for (const col of validLocations) {
    const row = makeMoveInPlace(board, col, color === 1 ? AI : PLAYER);
    if (row === -1) continue; // Bỏ qua nước không hợp lệ
    const { score } = negamax(board, depth - 1, -beta, -alpha, -color);
    const currentScore = -score;
    undoMove(board, col, row);

    if (currentScore > bestScore) {
      bestScore = currentScore;
      bestCol = col;
    }

    alpha = Math.max(alpha, bestScore);
    if (alpha >= beta) break;
  }

  const result = { score: bestScore, column: bestCol };
  addToTranspositionTable(boardKey, depth, result);
  return result;
}
