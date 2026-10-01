const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "auth.html";
}

const profileAvatar = document.querySelector("#profileAvatar");
const profileUsername = document.querySelector("#profileUsername");
const profileEmail = document.querySelector("#profileEmail");
const profileJoined = document.querySelector("#profileJoined");
const myVideosGrid = document.querySelector("#myVideosGrid");
const logoutButton = document.querySelector("#logoutButton");



async function loadProfile() {
    try {
        const response = await fetch(`${API_BASE}/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            localStorage.removeItem("token");
            window.location.href = "auth.html";
            return;
        }

        const user = await response.json();

        profileAvatar.textContent = user.username.substring(0, 2).toUpperCase();
        profileUsername.textContent = user.username;
        profileEmail.textContent = user.email;
        profileJoined.textContent = `Joined ${new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
    } catch (err) {
        console.error("Failed to load profile:", err);
    }
}

async function loadMyVideos() {
    myVideosGrid.innerHTML = `<p class="empty-state">Loading your videos...</p>`;

    try {
        const response = await fetch(`${API_BASE}/videos/my-videos`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const videos = await response.json();

        if (videos.length === 0) {
            myVideosGrid.innerHTML = `<p class="empty-state">You haven't uploaded any videos yet.</p>`;
            return;
        }

        myVideosGrid.innerHTML = "";
        videos.forEach(video => {
            const card = document.createElement("div");
            card.className = "my-video-card";
            card.innerHTML = `
                <img src="${video.thumbnail || ''}" class="my-video-thumb" alt="${video.title}">
                <div class="my-video-info">
                    <p class="my-video-title">${video.title}</p>
                    <p class="my-video-meta">${formatViews(video.views)} views • ${video.uploaded}</p>
                    <div class="my-video-actions">
                        <button class="video-action-btn edit-btn" data-id="${video.id}">Edit</button>
                        <button class="video-action-btn delete-btn" data-id="${video.id}">Delete</button>
                    </div>
                </div>
            `;
            myVideosGrid.appendChild(card);
        });

        // Edit buttons
        document.querySelectorAll(".edit-btn").forEach(btn => {
            btn.addEventListener("click", function () {
                const id = btn.dataset.id;
                window.location.href = `edit.html?id=${id}`;
            });
        });

        // Delete buttons
        document.querySelectorAll(".delete-btn").forEach(btn => {
            btn.addEventListener("click", async function () {
                const id = btn.dataset.id;
                if (!confirm("Delete this video permanently?")) return;

                try {
                    const response = await fetch(`${API_BASE}/videos/${id}`, {
                        method: "DELETE",
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (response.status === 204) {
                        loadMyVideos();
                    } else {
                        const data = await response.json();
                        alert(data.error || "Could not delete video");
                    }
                } catch (err) {
                    console.error("Delete failed:", err);
                    alert("Could not connect to server.");
                }
            });
        });
    } catch (err) {
        console.error("Failed to load videos:", err);
        myVideosGrid.innerHTML = `<p class="empty-state">Could not load your videos.</p>`;
    }
}

logoutButton.addEventListener("click", function () {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "index.html";
});

loadProfile();
loadMyVideos();