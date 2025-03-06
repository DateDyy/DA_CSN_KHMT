document.addEventListener("DOMContentLoaded", () => {
    const newGameButton = document.querySelector("#new-game");
    const gameOptions = document.querySelector("#game-options");
    const startGameButton = document.querySelector("#start-game");
    const closeOptionsButton = document.querySelector("#close-options");
    const board = document.querySelector("#board");
    const body = document.body;
    const overlay = document.createElement("div"); // Tạo overlay
    overlay.id = "overlay";
    document.body.appendChild(overlay); // Thêm overlay vào DOM

    // Mở bảng tùy chọn và làm mờ nền
    newGameButton.onclick = () => {
        gameOptions.style.display = "block";
        overlay.style.display = "block"; // Hiển thị overlay
        board.classList.add("disabled");
    };

    // Đóng bảng tùy chọn và khôi phục nền
    function closeOptions() {
        gameOptions.style.display = "none";
        overlay.style.display = "none"; // Ẩn overlay
        board.classList.remove("disabled");
    }

    closeOptionsButton.onclick = closeOptions;
    startGameButton.onclick = () => {
        closeOptions();

        // Lấy giá trị từ các tùy chọn
        const boardSize = document.querySelector("#board-size").value;
        const boardBg = document.querySelector("#board-bg").value;

        // Thiết lập hình nền trang web & thay đổi màu bàn cờ
        let backgroundImage = "";
        let boardColor = "";

        if (boardBg === "blue") {
            backgroundImage = "url('/img/NT_AN.jpg')";
            boardColor = "rgb(23, 126, 158)"; // Xanh dương
        } else if (boardBg === "green") {
            backgroundImage = "url('/img/CN_HC.jpg')";
            boardColor = "rgb(112, 154, 98)"; // Xanh lá
        } else if (boardBg === "wood") {
            backgroundImage = "url('/img/BG_AV.png')";
            boardColor = "rgb(248, 114, 26)"; // Màu gỗ
        }

        // Cập nhật nền trang web
        body.style.backgroundImage = backgroundImage;
        body.style.backgroundSize = "cover";
        body.style.backgroundPosition = "center";
        body.style.backgroundRepeat = "no-repeat";

        // Cập nhật màu bàn cờ
        document.querySelectorAll(".cell").forEach(cell => {
            cell.style.setProperty("--boardColor", boardColor);
        });

        // Cập nhật kích thước bàn cờ
        const [columns, rows] = boardSize.split("x").map(Number);
        board.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
        board.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    };
});
