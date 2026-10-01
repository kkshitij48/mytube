const params = new URLSearchParams(window.location.search);
const videoId = Number(params.get("id"));

const watchContainer = document.querySelector("#watchContainer");


async function loadVideo() {
    watchContainer.innerHTML = `<p style="padding:40px;">Loading...</p>`;

    try {
        const response = await fetch(`${API_BASE}/videos/${videoId}`);

        if (response.status === 404) {
            watchContainer.innerHTML = `<p style="padding:40px;">Video not found.</p>`;
            return;
        }

        if (!response.ok) {
            throw new Error(`Server responded with status ${response.status}`);
        }

        const video = await response.json();
        await renderWatchPage(video);
    } catch (err) {
        console.error("Failed to load video:", err);
        watchContainer.innerHTML = `<p style="padding:40px;color:red;">Could not load video. Is the server running?</p>`;
    }
}
let currentCreatorId;
async function renderWatchPage(video) {

    currentCreatorId = video.creator_id;
    recordWatch(video.id);
    watchContainer.innerHTML = `
        <div class="watch-main">
            <div class="video-player">
    <video controls class="player-video" poster="${video.thumbnail}">
        <source src="${video.videoUrl}" type="video/mp4">
        Your browser does not support video playback.
    </video>
</div>

            <h1 class="watch-title">${video.title}</h1>

            <div class="watch-meta-row">
                <p class="watch-views">${formatViews(video.views)} views • ${video.uploaded}</p>

                <div class="watch-actions">
                    <button id="likeButton" class="action-button">
                        👍 <span id="likeCount">0</span>
                    </button>
                </div>
            </div>

            <div class="channel-row">
                <div class="channel-avatar">${video.avatar}</div>
                <div class="channel-info">
                    <p class="channel-name">${video.creator}</p>
                </div>
                <button id="subscribeButton" class="subscribe-button">Subscribe</button>
            </div>

            <div class="comments-section">
                <h3 id="commentCountHeading">Comments</h3>
                <div class="comment-input-row">
                    <input type="text" id="commentInput" placeholder="Add a comment...">
                    <button id="commentButton">Comment</button>
                </div>
                <div id="commentsList"></div>
            </div>
        </div>

        <div class="watch-sidebar">
            <h3>Related Videos</h3>
            <div id="relatedList"></div>
        </div>
    `;

    await loadRelated(video);
    setupLike();
    setupSubscribe();
    setupComments();
}

async function loadRelated(currentVideo) {
    const relatedList = document.querySelector("#relatedList");

    try {
        const response = await fetch(`${API_BASE}/videos/videos`);

        if (!response.ok) {
            relatedList.innerHTML = `<p style="color:#606060;">Could not load related videos.</p>`;
            return;
        }

        const allVideos = await response.json();

        const related = allVideos.filter(
            v => v.category === currentVideo.category && v.id !== currentVideo.id
        );

        if (related.length === 0) {
            relatedList.innerHTML = `<p style="color:#606060;">No related videos.</p>`;
            return;
        }

        related.forEach(v => {
            const item = document.createElement("div");
            item.className = "related-card";
            item.innerHTML = `
                <img src="${v.thumbnail}" alt="${v.title}" class="related-thumbnail">
                <div class="related-info">
                    <p class="related-title">${v.title}</p>
                    <p class="related-meta">${v.creator}</p>
                    <p class="related-meta">${formatViews(v.views)} views</p>
                </div>
            `;
            item.addEventListener("click", function () {
                window.location.href = `watch.html?id=${v.id}`;
            });
            relatedList.appendChild(item);
        });
    } catch (err) {
        console.error("Failed to load related videos:", err);
        relatedList.innerHTML = `<p style="color:#606060;">Could not load related videos.</p>`;
    }
}

function setupLike() {
    const likeButton = document.querySelector("#likeButton");
    const likeCount = document.querySelector("#likeCount");

    async function loadLikeStatus() {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await fetch(`${API_BASE}/videos/${videoId}/likes`, { headers });
        const data = await response.json();

        likeCount.textContent = data.count;
        likeButton.classList.toggle("liked", data.liked);
    }

    likeButton.addEventListener("click", async function () {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("You must be logged in to like a video.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/videos/${videoId}/like`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            likeCount.textContent = data.count;
            likeButton.classList.toggle("liked", data.liked);
        } catch (err) {
            console.error("Like failed:", err);
        }
    });

    loadLikeStatus();
}

function setupSubscribe() {
    const subscribeButton = document.querySelector("#subscribeButton");

    subscribeButton.addEventListener("click", async function () {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("You must be logged in to subscribe.");
            return;
        }

        try {
            const response = await fetch(`${API_BASE}/users/${currentCreatorId}/subscribe`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await response.json();
            subscribeButton.textContent = data.subscribed ? "Subscribed" : "Subscribe";
            subscribeButton.classList.toggle("subscribed", data.subscribed);
        } catch (err) {
            console.error("Subscribe failed:", err);
        }
    });
}

function setupComments() {
    const commentInput = document.querySelector("#commentInput");
    const commentButton = document.querySelector("#commentButton");
    const commentsList = document.querySelector("#commentsList");
    const commentCountHeading = document.querySelector("#commentCountHeading");

    async function loadComments() {
        const response = await fetch(`${API_BASE}/videos/videos/${videoId}/comments`);
        const comments = await response.json();
        renderComments(comments);
    }

    function renderComments(comments) {
        commentCountHeading.textContent = `${comments.length} Comments`;
        commentsList.innerHTML = "";
        comments.forEach(c => {
            const item = document.createElement("div");
            item.className = "comment-item";
            item.innerHTML = `<strong>${c.author}</strong>: ${c.content}`;
            commentsList.appendChild(item);
        });
    }

    async function addComment() {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("You must be logged in to comment.");
            return;
        }

        const text = commentInput.value.trim();
        if (text === "") return;

        try {
            const response = await fetch(`${API_BASE}/videos/${videoId}/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ content: text })
            });

            if (!response.ok) {
                const err = await response.json();
                alert(err.error || "Could not post comment");
                return;
            }

            commentInput.value = "";
            loadComments();
        } catch (err) {
            console.error("Comment failed:", err);
        }
    }

    commentButton.addEventListener("click", addComment);
    commentInput.addEventListener("keyup", function (e) {
        if (e.key === "Enter") addComment();
    });

    loadComments();
}

loadVideo();
updateAuthUI();

async function recordWatch(videoId) {
    const token = localStorage.getItem("token");
    if (!token) return; // don't track logged-out visitors

    try {
        await fetch(`${API_BASE}/videos/${videoId}/watch`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` }
        });
    } catch (err) {
        console.error("Failed to record watch:", err);
    }
}