document.addEventListener("DOMContentLoaded", () => {
  const newGameButton = document.querySelector("#new-game");
  const gameOptions = document.querySelector("#game-options");
  const startGameButton = document.querySelector("#start-game");
  const closeOptionsButton = document.querySelector("#close-options");
  const board = document.querySelector("#board");
  const body = document.body;

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
  // Đóng modal khi click vào overlay
  overlay.addEventListener("click", closeOptions);

  startGameButton.addEventListener("click", () => {
    closeOptions();
  
    // Lấy giá trị từ các tùy chọn
    const boardSize = document.querySelector("#board-size").value;
    const boardBg = document.querySelector("#board-bg").value;
    const aiDifficulty = document.querySelector("#ai-difficulty").value; // Lấy mức độ AI
  
    // Lưu mức độ AI vào localStorage để sử dụng trong game
    localStorage.setItem("aiDifficulty", aiDifficulty);
  
    console.log("Selected AI Difficulty:", aiDifficulty); // Kiểm tra trên console
  
    // Thiết lập hình nền trang web & màu bàn cờ dựa theo tùy chọn
    let backgroundImage = "";
    let boardColor = "";
  
    switch (boardBg) {
      case "blue":
        backgroundImage = "url('/img/BG_Blue.jpg')";
        boardColor = "rgb(23, 28, 158)"; // Xanh dương
        break;
      case "green":
        backgroundImage = "url('/img/BG_Green.jpg')";
        boardColor = "rgb(44, 80, 32)"; // Xanh lá
        break;
      case "wood":
        backgroundImage = "url('/img/BG_Wood.png')";
        boardColor = "rgb(248, 114, 26)"; // Màu gỗ
        break;
      default:
        break;
    }
  
    // Cập nhật nền trang web
    body.style.backgroundImage = backgroundImage;
    body.style.backgroundSize = "cover";
    body.style.backgroundPosition = "center";
    body.style.backgroundRepeat = "no-repeat";
  
    // Cập nhật màu bàn cờ
    board.style.setProperty("--boardColor", boardColor);
  
    // Cập nhật kích thước bàn cờ dựa theo boardSize
    const [columns, rows] = boardSize.split("x").map(Number);
    board.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
  });
});
