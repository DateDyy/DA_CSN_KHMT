// main.js

// Imports
import { getBestMove as getHardMove, getValidLocations } from "./Hard_bot.js";
import { getBestMove as getMediumMove } from "./Medium_bot.js";
import { getBestMove as getEasyMove } from "./Easy_bot.js";

// Constants
const FIRST_TURN = 1;
const SECOND_TURN = 2;

// Audio System
const sounds = {
  drop: new Audio('sounds/drop.wav'),
  background: new Audio('sounds/woodBG.mp3'),
  win: new Audio('sounds/win.mp3'),
  draw: new Audio('sounds/draw.mp3'),
};


// Add error handling for audio files
Object.values(sounds).forEach(sound => {
  sound.addEventListener('error', () => {
    console.error(`Failed to load sound: ${sound.src}`);
  });
});

// Main Game Module
document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const elements = {
    board: document.querySelector("#board"),
    modalContainer: document.querySelector("#modal-container"),
    modalMessage: document.querySelector("#modal-message"),
    resetButton: document.querySelector("#reset"),
    boardSizeSelect: document.querySelector("#board-size"),
    player1ColorSelect: document.querySelector("#player1-color"),
    player2ColorSelect: document.querySelector("#player2-color"),
    player1TypeSelect: document.querySelector("#player1-type"),
    player2TypeSelect: document.querySelector("#player2-type"),
    reviewButton: document.getElementById("review"),
    computerDifficultySelect: document.querySelector("#computer-difficulty"),
    suggestButton: document.getElementById("suggestButton"),
    turnMessage: document.getElementById("turn-message"),
    playerIndicator: document.querySelector(".player-indicator")
  };

  // Game State
  const gameState = {
    boardWidth: 7,
    boardHeight: 6,
    pieces: [],
    playerTurn: FIRST_TURN,
    hoverColumn: -1,
    animating: false,
    isGameRunning: false,
    isSoundOn: true, // <-- Mặc định bật âm thanh
    suggestionCount: 0,
    suggestionLimit: 0,
    backgroundMusicStarted: false
  };
  elements.board.classList.add("disabled");
  // Thêm hàm cập nhật nhạc nền
  function updateBackgroundMusic() {
    const musicFile = localStorage.getItem("backgroundMusic");
    if (musicFile && sounds.background.src.indexOf(musicFile) === -1) {
      sounds.background.pause();
      sounds.background.src = musicFile;
      sounds.background.load();
      if (gameState.isSoundOn) {
        playSound("background", true);
      }
    }
  }

  // Initialize the game
  initializeEventListeners();


  // Audio Functions
  function playSound(soundName, loop = false) {
    if (!gameState.isSoundOn || !sounds[soundName]) return;
    
    try {
      // Nếu là background sound và chưa được bắt đầu, ghi nhận trạng thái
      if (soundName === "background" && !gameState.backgroundMusicStarted && loop) {
        gameState.backgroundMusicStarted = true;
      }
      
      sounds[soundName].currentTime = 0;
      sounds[soundName].loop = loop;
      
      // Sử dụng promise để xử lý lỗi và thử lại nếu cần
      const playPromise = sounds[soundName].play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.log("Playback prevented by browser:", error);
          // Không làm gì, âm thanh sẽ được phát khi có tương tác người dùng
        });
      }
    } catch (e) {
      console.error('Audio play failed:', e);
    }
  }


  // Event Listener Setup
  function initializeEventListeners() {
    elements.resetButton.addEventListener("click", handleReset);
    elements.boardSizeSelect.addEventListener("change", () => 
      setBoardDimensions(elements.boardSizeSelect.value)
    );
    elements.player1TypeSelect.addEventListener("change", updateSuggestButtonVisibility);
    elements.player2TypeSelect.addEventListener("change", updateSuggestButtonVisibility);
    elements.reviewButton.addEventListener("click", handleReview);
    
    // Phát nhạc nền khi người dùng bắt đầu trò chơi
    document.getElementById("start-game").addEventListener("click", function() {
      handleGameStart();
    // Khi bấm Play, bật âm thanh và đổi icon
    gameState.isSoundOn = true;
    const soundIcon = document.getElementById("sound-icon");
    if (soundIcon) soundIcon.src = "./img/sound-on.png";
    // Luôn phát nhạc nền khi bấm Play nếu đang bật âm thanh
    if (gameState.isSoundOn) {
      playSound("background", true);
    }
  });
    document.getElementById("sound-toggle").addEventListener("click", () => {
      gameState.isSoundOn = !gameState.isSoundOn;

      const soundIcon = document.getElementById("sound-icon");
      if (soundIcon) {
      soundIcon.src = "./img/sound-off.png";
    }
      // Cập nhật biểu tượng âm thanh
      if (gameState.isSoundOn) {
        playSound("background", true);
        soundIcon.src = "./img/sound-on.png";
      } else {
        sounds.background.pause();
        sounds.background.currentTime = 0;
        soundIcon.src = "./img/sound-off.png";
      }
    });

    document.getElementById("close-options").addEventListener("click", handleCloseOptions);
    // Thêm sự kiện click cho toàn bộ document để bắt đầu phát nhạc
    // document.addEventListener('click', function initialClick() {
    //   if (!gameState.backgroundMusicStarted) {
    //     playSound("background", true);
    //   }
    //   // Chỉ thực hiện một lần
    //   document.removeEventListener('click', initialClick);
    // }, { once: true });
    
    // Initial setup
    setBoardDimensions(elements.boardSizeSelect.value);
    elements.suggestButton.style.visibility = "hidden";

    // Sau khi khai báo sounds
    const volumeSlider = document.getElementById("volume-slider");
    if (volumeSlider) {
      volumeSlider.value = sounds.background.volume;
      volumeSlider.addEventListener("input", function () {
        const vol = parseFloat(this.value);
        Object.values(sounds).forEach(sound => {
          sound.volume = vol;
        });
      });
    }
  }

  // Event Handlers
  function handleReset() {
    elements.modalContainer.style.display = "none";
    initializeBoard();
    elements.board.classList.remove("disabled");
    gameState.isGameRunning = true;
  }

  function handleReview() {
    elements.modalContainer.style.display = "none";
    elements.board.classList.add("disabled");
    document.getElementById("turn-notification").style.visibility = "hidden";
    elements.suggestButton.style.visibility = "hidden";
  }

  function handleGameStart() {
    updateBackgroundMusic();
    gameState.isGameRunning = true;
    document.getElementById("turn-notification").style.visibility = "visible";
    elements.board.classList.remove("visibi");
    updateSuggestButtonVisibility();
    if (elements.suggestButton.style.visibility === "visible") {
      elements.suggestButton.addEventListener("click", suggestBestMove);
    }
  }

  function handleCloseOptions() {
    gameState.isGameRunning = false;
    document.getElementById("turn-notification").style.visibility = "hidden";
    elements.board.classList.add("visibi");
    elements.suggestButton.style.visibility = "hidden";
    initializeBoard();
  }

  // Board Management
  function setBoardDimensions(sizeStr) {
    const [w, h] = sizeStr.split("x").map(Number);
    if (isNaN(w) || isNaN(h)) {
      console.error("Invalid board size:", sizeStr);
      return;
    }
    gameState.boardWidth = w;
    gameState.boardHeight = h;
    document.documentElement.style.setProperty("--board-cols", w);
    document.documentElement.style.setProperty("--board-rows", h);
    elements.board.style.gridTemplateColumns = `repeat(${w}, auto)`;
    elements.board.style.gridTemplateRows = `repeat(${h}, auto)`;
    initializeBoard();
  }

  function initializeBoard() {
    elements.board.innerHTML = "";
    gameState.pieces = new Array(gameState.boardWidth * gameState.boardHeight).fill(0);
    gameState.playerTurn = FIRST_TURN;
    gameState.hoverColumn = -1;
    gameState.animating = false;

    updateSuggestButtonVisibility();

    for (let i = 0; i < gameState.boardWidth * gameState.boardHeight; i++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      elements.board.appendChild(cell);
      const col = i % gameState.boardWidth;
      cell.addEventListener("mouseenter", () => onMouseEnteredColumn(col));
      cell.addEventListener("click", () => {
        if (getCurrentPlayerType() === "computer") return;
        if (!gameState.animating) onColumnClicked(col);
      });
    }
    updateTurnNotification();
    checkAndMakeAIMove();
  }

  // Game Logic
  function getCurrentPlayerType() {
    return gameState.playerTurn === FIRST_TURN
      ? elements.player1TypeSelect.value.trim().toLowerCase()
      : elements.player2TypeSelect.value.trim().toLowerCase();
  }

  function getAvailableRowInColumn(column) {
    for (let row = gameState.boardHeight - 1; row >= 0; row--) {
      if (gameState.pieces[row * gameState.boardWidth + column] === 0) return row;
    }
    return -1;
  }

  function onColumnClicked(column) {
    playSound("drop");
    const availableRow = getAvailableRowInColumn(column);
    if (availableRow === -1) return;
    
    gameState.pieces[availableRow * gameState.boardWidth + column] = gameState.playerTurn;
    const cell = elements.board.children[availableRow * gameState.boardWidth + column];
    const piece = document.createElement("div");
    piece.className = "piece";
    piece.dataset.placed = "true";
    piece.dataset.player = gameState.playerTurn;
    cell.appendChild(piece);

    const unplacedPiece = document.querySelector("[data-placed='false']");
    if (!unplacedPiece) {
      checkGameWinOrDraw();
      return;
    }
    
    const unplacedY = unplacedPiece.getBoundingClientRect().y;
    const placedY = piece.getBoundingClientRect().y;
    const yDiff = unplacedY - placedY;

    gameState.animating = true;
    removeUnplacedPiece();

    const animation = piece.animate(
      [
        { transform: `translateY(${yDiff}px)`, offset: 0 },
        { transform: "translateY(0px)", offset: 0.6 },
        { transform: `translateY(${yDiff / 20}px)`, offset: 0.8 },
        { transform: "translateY(0px)", offset: 0.95 },
      ],
      { duration: 400, easing: "linear", iterations: 1 }
    );
    animation.addEventListener("finish", checkGameWinOrDraw);
  }

  function onMouseEnteredColumn(column) {
    gameState.hoverColumn = column;
    if (!gameState.animating) updateHover();
  }

  function updateHover() {
    removeUnplacedPiece();
    if (gameState.hoverColumn >= 0 && gameState.pieces[gameState.hoverColumn] === 0) {
      const cell = elements.board.children[gameState.hoverColumn];
      const piece = document.createElement("div");
      piece.className = "piece";
      piece.dataset.placed = "false";
      piece.dataset.player = gameState.playerTurn;
      cell.appendChild(piece);
    }
  }

  function removeUnplacedPiece() {
    const unplacedPiece = document.querySelector("[data-placed='false']");
    unplacedPiece?.parentElement?.removeChild(unplacedPiece);
  }

  // Game State Updates
  function checkGameWinOrDraw() {
    gameState.animating = false;

    const winningPositions = hasPlayerWon(gameState.playerTurn);

    if (winningPositions) {
      elements.modalContainer.style.display = "block";
      const winnerColor =
        gameState.playerTurn === FIRST_TURN
          ? elements.player1ColorSelect.value
          : elements.player2ColorSelect.value;
      // Xác định loại người chơi thắng
      const winnerType = gameState.playerTurn === FIRST_TURN
        ? elements.player1TypeSelect.value.trim().toLowerCase()
        : elements.player2TypeSelect.value.trim().toLowerCase();
      if (winnerType === "computer") {
        elements.modalMessage.textContent = "Computer WON!";

      } else {
        elements.modalMessage.textContent = `Player ${gameState.playerTurn} WON!`;
      }
      elements.modalMessage.style.color = winnerColor;
      elements.modalMessage.dataset.winner = gameState.playerTurn;
      playSound("win");

      

      // Highlight winning pieces
      winningPositions.forEach((index) => {
        const cell = elements.board.children[index];
        cell.firstChild.classList.add("winning-piece");
      });

      return;
    }
    if (!gameState.pieces.includes(0)) {
      elements.modalContainer.style.display = "block";
      elements.modalMessage.textContent = "Draw";
      playSound("draw");
      return;
    }
    
    // Switch turns
    gameState.playerTurn = gameState.playerTurn === FIRST_TURN ? SECOND_TURN : FIRST_TURN;
    updateTurnNotification();
    checkAndMakeAIMove();
    updateHover();
  }

  function updateTurnNotification() {
    if (!elements.turnMessage || !elements.playerIndicator) return;
    
    const playerNum = gameState.playerTurn === FIRST_TURN ? "1" : "2";
    elements.playerIndicator.style.backgroundColor = 
      `var(--player${playerNum}-color, ${playerNum === "1" ? "red" : "yellow"})`;
    elements.turnMessage.style.color = 
      `var(--player${playerNum}-color, ${playerNum === "1" ? "red" : "yellow"})`;
      
    elements.turnMessage.textContent = getCurrentPlayerType() === "computer" 
      ? "Computer's Thinking" 
      : `Player ${playerNum}'s Turn`;
  }

  // AI and Suggestion Logic
  function checkAndMakeAIMove() {
    if (getCurrentPlayerType() === "computer") {
      const difficulty = elements.computerDifficultySelect.value;
      
      setTimeout(() => {
        if (difficulty === "easy") {
          makeEasyAIMove();
        } else if (difficulty === "medium") {
          makeMediumAIMove();
        } else if (difficulty === "hard") {
          makeHardAIMove();
        }
      }, 200);
    }
  }

  function makeEasyAIMove() {
    const board2D = convertPiecesTo2D();
    const moveColumn = getEasyMove(board2D, 2);
    
    if (moveColumn >= 0 && moveColumn < gameState.boardWidth) {
      gameState.hoverColumn = moveColumn;
      updateHover();
      onColumnClicked(moveColumn);
    }
  }

  function makeMediumAIMove() {
    const board2D = convertPiecesTo2D();
    const moveColumn = getMediumMove(board2D, 4);
    
    if (moveColumn >= 0 && moveColumn < gameState.boardWidth) {
      gameState.hoverColumn = moveColumn;
      updateHover();
      onColumnClicked(moveColumn);
    }
  }

  function makeHardAIMove() {
    const board2D = convertPiecesTo2D();
    const validMoves = getValidLocations(board2D).length;
    const moveColumn = getHardMove(board2D, validMoves);
    
    if (moveColumn >= 0 && moveColumn < gameState.boardWidth) {
      gameState.hoverColumn = moveColumn;
      updateHover();
      onColumnClicked(moveColumn);
    }
  }

  // Suggestions Feature
  function updateSuggestButtonVisibility() {
    const player1Type = elements.player1TypeSelect.value;
    const player2Type = elements.player2TypeSelect.value;

    if (
      gameState.isGameRunning &&
      (player1Type === "computer" || player2Type === "computer")
    ) {
      elements.suggestButton.style.visibility = "visible";
      gameState.suggestionCount = 0;
    } else {
      elements.suggestButton.style.visibility = "hidden";
    }
  }

  function suggestBestMove() {
    // Set suggestion limits based on difficulty
    const difficulty = elements.computerDifficultySelect.value;
    switch (difficulty) {
      case "easy": gameState.suggestionLimit = 5; break;
      case "medium": gameState.suggestionLimit = 3; break;
      case "hard": gameState.suggestionLimit = 1; break;
      default: gameState.suggestionLimit = 0;
    }

    if (gameState.suggestionCount >= gameState.suggestionLimit) {
      showSuggestionMessage("⚠️ Bạn đã sử dụng hết lượt gợi ý!");
      return;
    }

    gameState.suggestionCount++;

    const board2D = convertPiecesTo2D();
    const suggestedColumn = getHardMove(board2D, 5);

    if (suggestedColumn < 0 || suggestedColumn >= gameState.boardWidth) return;

    // Find highest empty row in suggested column
    let targetRow = -1;
    for (let row = gameState.boardHeight - 1; row >= 0; row--) {
      if (board2D[row][suggestedColumn] === 0) {
        targetRow = row;
        break;
      }
    }

    if (targetRow === -1) return; // No empty spaces

    const index = targetRow * gameState.boardWidth + suggestedColumn;
    const cell = elements.board.children[index];
    cell.classList.add("suggestion-blink");

    setTimeout(() => {
      cell.classList.remove("suggestion-blink");
    }, 2000);
  }

  function showSuggestionMessage(message) {
    const msgBox = document.getElementById("suggestionMessage");
    msgBox.textContent = message;
    msgBox.classList.add("show");

    setTimeout(() => {
      msgBox.classList.remove("show");
    }, 3000); // Show for 3 seconds then hide
  }

  // Utility Functions
  function convertPiecesTo2D() {
    let board2D = [];
    for (let row = 0; row < gameState.boardHeight; row++) {
      let rowArr = [];
      for (let col = 0; col < gameState.boardWidth; col++) {
        rowArr.push(gameState.pieces[row * gameState.boardWidth + col]);
      }
      board2D.push(rowArr);
    }
    return board2D;
  }

  function hasPlayerWon(player) {
    const { boardWidth, boardHeight, pieces } = gameState;
    
    for (let row = 0; row < boardHeight; row++) {
      for (let col = 0; col < boardWidth; col++) {
        const index = row * boardWidth + col;
        if (pieces[index] !== player) continue;

        // Horizontal check
        if (
          col <= boardWidth - 4 &&
          pieces[row * boardWidth + (col + 1)] === player &&
          pieces[row * boardWidth + (col + 2)] === player &&
          pieces[row * boardWidth + (col + 3)] === player
        ) {
          return [
            index,
            row * boardWidth + (col + 1),
            row * boardWidth + (col + 2),
            row * boardWidth + (col + 3),
          ];
        }

        // Vertical check
        if (
          row <= boardHeight - 4 &&
          pieces[(row + 1) * boardWidth + col] === player &&
          pieces[(row + 2) * boardWidth + col] === player &&
          pieces[(row + 3) * boardWidth + col] === player
        ) {
          return [
            index,
            (row + 1) * boardWidth + col,
            (row + 2) * boardWidth + col,
            (row + 3) * boardWidth + col,
          ];
        }

        // Diagonal (/) check
        if (
          col <= boardWidth - 4 &&
          row <= boardHeight - 4 &&
          pieces[(row + 1) * boardWidth + (col + 1)] === player &&
          pieces[(row + 2) * boardWidth + (col + 2)] === player &&
          pieces[(row + 3) * boardWidth + (col + 3)] === player
        ) {
          return [
            index,
            (row + 1) * boardWidth + (col + 1),
            (row + 2) * boardWidth + (col + 2),
            (row + 3) * boardWidth + (col + 3),
          ];
        }

        // Diagonal (\) check
        if (
          col >= 3 &&
          row <= boardHeight - 4 &&
          pieces[(row + 1) * boardWidth + (col - 1)] === player &&
          pieces[(row + 2) * boardWidth + (col - 2)] === player &&
          pieces[(row + 3) * boardWidth + (col - 3)] === player
        ) {
          return [
            index,
            (row + 1) * boardWidth + (col - 1),
            (row + 2) * boardWidth + (col - 2),
            (row + 3) * boardWidth + (col - 3),
          ];
        }
      }
    }

    return null;
  }

  // Make the initializeBoard function available globally
  window.initializeBoard = initializeBoard;
});


