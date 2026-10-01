const videoGrid = document.querySelector("#videoGrid");
const searchInput = document.querySelector("#searchInput");
const searchButton = document.querySelector("#searchButton");
const categories = document.querySelectorAll(".category");

let currentCategory = "All";
let currentSearch = "";
let allVideos = [];



async function fetchVideos() {
    videoGrid.innerHTML = `<p style="padding:20px;">Loading videos...</p>`;

    const token = localStorage.getItem("token");
    const url = token
        ? `${API_BASE}/recommendations`
        : `${API_BASE}/videos`;
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const data = await response.json();
        allVideos = token ? data : data.videos;
        applyFilter();
    } catch (err) {
        console.error("Failed to load videos:", err);
        videoGrid.innerHTML = `<p style="padding:20px;color:red;">Could not load videos. Is the server running?</p>`;
    }
}

function createVideoCard(video) {
    const card = document.createElement("article");
    card.className = "video-card";

    card.innerHTML = `
        <div class="thumbnail-container">
            <img class="thumbnail" src="${video.thumbnail}" alt="${video.title}">
            <span class="duration">${video.duration || ""}</span>
        </div>
        <div class="video-info">
            <div class="channel-avatar">${video.avatar}</div>
            <div class="video-details">
                <h2 class="video-title">${video.title}</h2>
                <p class="creator-name">${video.creator}</p>
                <p class="video-meta">${formatViews(video.views)} views • ${video.uploaded || ""}</p>
            </div>
        </div>
    `;

    card.addEventListener("click", function () {
        window.location.href = `watch.html?id=${video.id}`;
    });

    return card;
}

function renderVideos(list) {
    videoGrid.innerHTML = "";
    if (list.length === 0) {
        videoGrid.innerHTML = `<p style="padding:20px;color:#606060;">No videos found.</p>`;
        return;
    }
    list.forEach(video => {
        videoGrid.appendChild(createVideoCard(video));
    });
}

function applyFilter() {
    let filtered = allVideos;

    if (currentCategory !== "All") {
        filtered = filtered.filter(v => v.category === currentCategory);
    }

    if (currentSearch.trim() !== "") {
        const term = currentSearch.toLowerCase();
        filtered = filtered.filter(v =>
            v.title.toLowerCase().includes(term) ||
            v.creator.toLowerCase().includes(term)
        );
    }

    renderVideos(filtered);
}

searchButton.addEventListener("click", function () {
    currentSearch = searchInput.value;
    applyFilter();
});

searchInput.addEventListener("keyup", function (e) {
    if (e.key === "Enter") {
        currentSearch = searchInput.value;
        applyFilter();
    }
});

categories.forEach(btn => {
    btn.addEventListener("click", function () {
        categories.forEach(c => c.classList.remove("active-category"));
        btn.classList.add("active-category");
        currentCategory = btn.textContent.trim();
        applyFilter();
    });
});

fetchVideos();

updateAuthUI();