document.addEventListener("DOMContentLoaded", () => {
  const newGameButton = document.querySelector("#new-game");
  const gameOptions = document.querySelector("#game-options");
  const startGameButton = document.querySelector("#start-game");
  const closeOptionsButton = document.querySelector("#close-options");
  const board = document.querySelector("#board");
  const body = document.body;
  const player1ColorSelect = document.querySelector("#player1-color");
  const player2ColorSelect = document.querySelector("#player2-color");
  const player1TypeSelect = document.querySelector("#player1-type");
  const player2TypeSelect = document.querySelector("#player2-type");
  const aiDifficulty = document.querySelector("#computer-difficulty");

  // Hàm kiểm tra và cập nhật trạng thái của selector độ khó
  function toggleAIDifficultySelector() {
    const isComputerPlaying =
      player1TypeSelect.value === "computer" ||
      player2TypeSelect.value === "computer";

    // Nếu có ít nhất 1 người chơi là "computer", bật selector độ khó
    aiDifficulty.disabled = !isComputerPlaying;
    aiDifficulty.parentElement.classList.toggle("disabled", !isComputerPlaying);
  }
  toggleAIDifficultySelector();

  // Gán sự kiện change cho cả hai select loại người chơi
  player1TypeSelect.addEventListener("change", toggleAIDifficultySelector);
  player2TypeSelect.addEventListener("change", toggleAIDifficultySelector);

  // Xử lý sự kiện thay đổi kiểu người chơi với biến đúng
  player1TypeSelect.addEventListener("change", () => {
    handlePlayerTypeChange(player1TypeSelect, player2TypeSelect);
  });

  player2TypeSelect.addEventListener("change", () => {
    handlePlayerTypeChange(player2TypeSelect, player1TypeSelect);
  });

  // Hàm xử lý kiểu người chơi: nếu cả hai đều là "computer", chuyển người kia về "human"
  function handlePlayerTypeChange(changedSelect, otherSelect) {
    if (
      changedSelect.value === "computer" &&
      otherSelect.value === "computer"
    ) {
      otherSelect.value = "human";
    }
  }

  
  function loadBotScript(difficulty) {
    let botScript = document.getElementById("bot-script");

    let botFile = "";
    if (difficulty === "easy") {
        botFile = "Easy_bot.js";
    } else if (difficulty === "medium") {
        botFile = "Medium_bot.js";
    } else if (difficulty === "hard") {
        botFile = "Hard_bot.js";
    }

    if (!botFile) return;

    // Kiểm tra và xóa script cũ nếu có
    if (botScript) {
        botScript.remove();
    }

    // Tạo script mới
    botScript = document.createElement("script");
    botScript.id = "bot-script";
    botScript.src = botFile;
    botScript.type = "module";  
    botScript.onload = () => console.log(`Loaded bot: ${botFile}`);
    botScript.onerror = () => console.error(`Failed to load bot: ${botFile}`);
    document.body.appendChild(botScript);
}


startGameButton.addEventListener("click", () => {
  const difficulty = aiDifficulty.value;
  console.log("Selected difficulty:", difficulty); // Debug xem có lấy đúng giá trị không
  loadBotScript(difficulty);
});


  // Định nghĩa đối tượng ánh xạ màu
  const colorMap = {
    red: "rgba(235, 16, 16, 0.916)",
    yellow: "rgba(242, 255, 0, 0.933)",
  };

  let isUpdating = false; // Cờ kiểm soát cập nhật tự động

  // Cập nhật CSS custom property dựa trên giá trị chọn
  const updatePlayerColor = (playerSelect, cssVariable) => {
    const colorValue = colorMap[playerSelect.value] || "";
    document.documentElement.style.setProperty(cssVariable, colorValue);
  };

  // Hàm xử lý sự thay đổi màu của người chơi
  const handleColorChange = (
    changedSelect, // Select box màu thay đổi
    otherSelect, // Select box màu còn lại
    cssVariableChanged, // Tên biến CSS custom của màu thay đổi
    cssVariableOther // Tên biến CSS custom của màu còn lại
  ) => {
    if (isUpdating) return;
    const changedColor = changedSelect.value;
    const otherColor = otherSelect.value;

    // Nếu hai màu trùng nhau, tự động cập nhật màu của người còn lại
    if (changedColor === otherColor) {
      isUpdating = true;
      for (const option of otherSelect.options) {
        if (option.value !== changedColor) {
          otherSelect.value = option.value;
          break;
        }
      }
      updatePlayerColor(otherSelect, cssVariableOther);
      isUpdating = false;
    }
    updatePlayerColor(changedSelect, cssVariableChanged);
  };

  player1ColorSelect.addEventListener("change", () => {
    handleColorChange(
      player1ColorSelect,
      player2ColorSelect,
      "--player1-color",
      "--player2-color"
    );
  });

  player2ColorSelect.addEventListener("change", () => {
    handleColorChange(
      player2ColorSelect,
      player1ColorSelect,
      "--player2-color",
      "--player1-color"
    );
  });

  // Tạo overlay và thêm vào DOM
  const overlay = document.createElement("div");
  overlay.id = "overlay";
  document.body.appendChild(overlay);

  // Hàm mở bảng tùy chọn
  const openOptions = () => {
    gameOptions.classList.add("active");
    overlay.classList.add("active");
    board.classList.add("disabled");
  };

  // Hàm đóng bảng tùy chọn
  const closeOptions = () => {
    gameOptions.classList.remove("active");
    overlay.classList.remove("active");
    board.classList.remove("disabled");
  };

  newGameButton.addEventListener("click", openOptions);
  closeOptionsButton.addEventListener("click", closeOptions);
  overlay.addEventListener("click", closeOptions);

  startGameButton.addEventListener("click", () => {
    closeOptions();

    // Lấy giá trị từ các tùy chọn
    const boardBgValue = document.querySelector("#board-bg").value;

    // Lưu mức độ AI vào localStorage
    localStorage.setItem("aiDifficulty", aiDifficulty.value);

    // Cấu hình hình nền và màu bàn cờ theo tùy chọn
    const boardBackgrounds = {
      blue: {
        backgroundImage: "url('img/BG_Blue.jpg')",
        boardColor: "rgb(41, 95, 211)",
        music: "sounds/blueBG.mp3"
      },
      green: {
        backgroundImage: "url('img/BG_Green.jpg')",
        boardColor: "rgb(84, 187, 85)",
        music: "sounds/greenbackground.mp3"
      },
      wood: {
        backgroundImage: "url('img/BG_Wood.png')",
        boardColor: "rgb(238, 125, 50)",
        music: "sounds/woodBG.mp3"
      },
    };


    const settings = boardBackgrounds[boardBgValue] || {};
    if (settings.backgroundImage) {
      body.style.backgroundImage = settings.backgroundImage;
      body.style.backgroundSize = "cover";
      body.style.backgroundPosition = "center";
      body.style.backgroundRepeat = "no-repeat";
      board.style.setProperty("--boardColor", settings.boardColor);
    }

     // Lưu tên file nhạc nền vào localStorage
    if (settings.music) {
      localStorage.setItem("backgroundMusic", settings.music);
    }
    initializeBoard();
  });
});
