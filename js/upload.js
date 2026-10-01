const uploadForm = document.querySelector("#uploadForm");
const uploadButton = document.querySelector("#uploadButton");
const errorEl = document.querySelector("#uploadError");
const successEl = document.querySelector("#uploadSuccess");

const videoDropzone = document.querySelector("#videoDropzone");
const videoFileInput = document.querySelector("#videoFile");
const videoDropzoneContent = document.querySelector("#videoDropzoneContent");

const thumbFileInput = document.querySelector("#thumbnailFile");
const thumbPlaceholder = document.querySelector("#thumbPlaceholder");
const thumbPreview = document.querySelector("#thumbPreview");

const progressEl = document.querySelector("#uploadProgress");
const progressFill = document.querySelector("#progressFill");
const progressLabel = document.querySelector("#progressLabel");

const token = localStorage.getItem("token");
if (!token) {
    window.location.href = "auth.html";
}

// Show selected video file name
videoFileInput.addEventListener("change", function () {
    const file = videoFileInput.files[0];
    if (!file) return;

    videoDropzone.classList.add("has-file");
    videoDropzoneContent.innerHTML = `
        <div class="dropzone-icon">🎬</div>
        <p class="dropzone-title">${file.name}</p>
        <p class="dropzone-hint">Reading duration...</p>
    `;

    const tempVideo = document.createElement("video");
    tempVideo.preload = "metadata";

    tempVideo.onloadedmetadata = function () {
        window.URL.revokeObjectURL(tempVideo.src);
        const totalSeconds = Math.round(tempVideo.duration);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const formatted = `${minutes}:${seconds.toString().padStart(2, "0")}`;

        document.querySelector("#durationInput").value = formatted;

        videoDropzoneContent.innerHTML = `
            <div class="dropzone-icon">🎬</div>
            <p class="dropzone-title">${file.name}</p>
            <p class="dropzone-hint">${(file.size / (1024 * 1024)).toFixed(1)} MB • ${formatted} • click to change</p>
        `;
    };

    tempVideo.src = URL.createObjectURL(file);
});

// Show thumbnail preview
thumbFileInput.addEventListener("change", function () {
    const file = thumbFileInput.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        thumbPreview.src = url;
        thumbPreview.style.display = "block";
        thumbPlaceholder.style.display = "none";
    }
});

uploadForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.textContent = "";
    successEl.textContent = "";

    const videoFile = videoFileInput.files[0];
    const thumbnailFile = thumbFileInput.files[0];
    const title = document.querySelector("#titleInput").value.trim();
    const description = document.querySelector("#descriptionInput").value.trim();
    const category = document.querySelector("#categoryInput").value;
    const duration = document.querySelector("#durationInput").value.trim();

    if (!videoFile || !title) {
        errorEl.textContent = "Video file and title are required.";
        return;
    }

    const formData = new FormData();
    formData.append("video", videoFile);
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("duration", duration);

    uploadButton.disabled = true;
    uploadButton.textContent = "Publishing...";
    progressEl.style.display = "flex";

    try {
        const data = await uploadWithProgress(formData, token);

        progressFill.style.width = "100%";
        progressLabel.textContent = "Upload complete";
        successEl.textContent = "Video published! Redirecting...";

        setTimeout(function () {
            window.location.href = `watch.html?id=${data.id}`;
        }, 1000);
    } catch (err) {
        console.error(err);
        errorEl.textContent = err.message || "Upload failed";
        uploadButton.disabled = false;
        uploadButton.textContent = "Publish";
        progressEl.style.display = "none";
    }
});

function uploadWithProgress(formData, token) {
    return new Promise(function (resolve, reject) {
        const xhr = new XMLHttpRequest();

        xhr.open("POST", `${API_BASE}/videos/upload`);
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);

        xhr.upload.addEventListener("progress", function (e) {
            if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100);
                progressFill.style.width = percent + "%";
                progressLabel.textContent = `Uploading... ${percent}%`;
            }
        });

        xhr.onload = function () {
            try {
                const data = JSON.parse(xhr.responseText);
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(data);
                } else {
                    reject(new Error(data.error || "Upload failed"));
                }
            } catch (err) {
                reject(new Error("Unexpected server response"));
            }
        };

        xhr.onerror = function () {
            reject(new Error("Could not connect to server"));
        };

        xhr.send(formData);
    });
}