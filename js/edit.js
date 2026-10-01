const token = localStorage.getItem("token");
if (!token) window.location.href = "auth.html";

const params = new URLSearchParams(window.location.search);
const videoId = Number(params.get("id"));

const editForm = document.querySelector("#editForm");
const errorEl = document.querySelector("#editError");
const successEl = document.querySelector("#editSuccess");
const saveButton = document.querySelector("#saveButton");

async function loadVideo() {
    try {
        const response = await fetch(`${API_BASE}/videos/${videoId}`);
        const video = await response.json();

        document.querySelector("#titleInput").value = video.title;
        document.querySelector("#descriptionInput").value = video.description || "";
        document.querySelector("#categoryInput").value = video.category;
        document.querySelector("#durationInput").value = video.duration || "";
    } catch (err) {
        errorEl.textContent = "Could not load video.";
    }
}

editForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.textContent = "";
    successEl.textContent = "";
    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    try {
        const response = await fetch(`${API_BASE}/videos/${videoId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                title: document.querySelector("#titleInput").value.trim(),
                description: document.querySelector("#descriptionInput").value.trim(),
                category: document.querySelector("#categoryInput").value,
                duration: document.querySelector("#durationInput").value.trim()
            })
        });

        const data = await response.json();

        if (!response.ok) {
            errorEl.textContent = data.error || "Could not save changes";
            saveButton.disabled = false;
            saveButton.textContent = "Save changes";
            return;
        }

        successEl.textContent = "Saved. Redirecting...";
        setTimeout(function () {
            window.location.href = `watch.html?id=${videoId}`;
        }, 900);
    } catch (err) {
        errorEl.textContent = "Could not connect to server.";
        saveButton.disabled = false;
        saveButton.textContent = "Save changes";
    }
});

loadVideo();