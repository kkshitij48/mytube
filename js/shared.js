function formatViews(views) {
    if (views >= 1000000) return (views / 1000000).toFixed(1) + "M";
    if (views >= 1000) return (views / 1000).toFixed(1) + "K";
    return views;
}

function updateAuthUI() {
    const token = localStorage.getItem("token");
    const profileEl = document.querySelector(".profile");

    if (!profileEl) return;

    if (token) {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        profileEl.textContent = (user.username || "U").substring(0, 1).toUpperCase();
        profileEl.title = "View profile";
        profileEl.style.cursor = "pointer";
        profileEl.addEventListener("click", function () {
            window.location.href = "profile.html";
        });
    } else {
        profileEl.textContent = "→";
        profileEl.title = "Login";
        profileEl.style.cursor = "pointer";
        profileEl.addEventListener("click", function () {
            window.location.href = "auth.html";
        });
    }
}

function getToken() {
    return localStorage.getItem("token");
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
}