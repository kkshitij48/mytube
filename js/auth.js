const loginTab = document.querySelector("#loginTab");
const registerTab = document.querySelector("#registerTab");
const loginForm = document.querySelector("#loginForm");
const registerForm = document.querySelector("#registerForm");

loginTab.addEventListener("click", function () {
    loginTab.classList.add("active-tab");
    registerTab.classList.remove("active-tab");
    loginForm.style.display = "flex";
    registerForm.style.display = "none";
});

registerTab.addEventListener("click", function () {
    registerTab.classList.add("active-tab");
    loginTab.classList.remove("active-tab");
    registerForm.style.display = "flex";
    loginForm.style.display = "none";
});

loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const errorEl = document.querySelector("#loginError");
    errorEl.textContent = "";

    const email = document.querySelector("#loginEmail").value;
    const password = document.querySelector("#loginPassword").value;

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            errorEl.textContent = data.error || "Login failed";
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = "index.html";
    } catch (err) {
        console.error(err);
        errorEl.textContent = "Could not connect to server.";
    }
});

registerForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const errorEl = document.querySelector("#registerError");
    errorEl.textContent = "";

    const username = document.querySelector("#registerUsername").value;
    const email = document.querySelector("#registerEmail").value;
    const password = document.querySelector("#registerPassword").value;

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            errorEl.textContent = data.error || "Registration failed";
            return;
        }

        // Auto-login after successful registration
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        const loginData = await loginResponse.json();
        localStorage.setItem("token", loginData.token);
        localStorage.setItem("user", JSON.stringify(loginData.user));
        window.location.href = "index.html";
    } catch (err) {
        console.error(err);
        errorEl.textContent = "Could not connect to server.";
    }
});