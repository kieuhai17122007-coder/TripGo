const loginForm = document.getElementById("loginForm");

loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    const message = document.getElementById("loginMessage");

    // Xóa thông báo cũ
    message.textContent = "";

    // Kiểm tra bỏ trống
    if (email === "") {
        message.textContent = "Vui lòng nhập email.";
        return;
    }

    if (password === "") {
        message.textContent = "Vui lòng nhập mật khẩu.";
        return;
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        message.textContent = "Email không đúng định dạng.";
        return;
    }

    // Lấy danh sách tài khoản từ LocalStorage
    const users = JSON.parse(
        localStorage.getItem("tripgo_users")
    ) || [];

    // Kiểm tra tài khoản có tồn tại không
    const user = users.find(function (user) {
        return user.email === email;
    });

    if (!user) {
        message.textContent = "Tài khoản không tồn tại.";
        return;
    }

    // Kiểm tra mật khẩu
    if (user.password !== password) {
        message.textContent = "Mật khẩu không chính xác.";
        return;
    }

    // Lưu tài khoản đang đăng nhập
    localStorage.setItem(
        "tripgo_current_user",
        JSON.stringify(user)
    );

    message.textContent = "Đăng nhập thành công!";

    // Chuyển về trang chủ
    setTimeout(function () {
        window.location.href = "../index.html";
    }, 1000);
});