function addPlaylistButton() {
    const buttonsContainer = document.querySelector("#top-level-buttons-computed");

    if (!buttonsContainer || document.querySelector("#easyTubeAddButton")) return;

    const addButton = document.createElement("img");
    addButton.src = chrome.runtime.getURL("assets/add.png");
    addButton.id = "easyTubeAddButton";
    addButton.style.cursor = "pointer";
    addButton.style.width = "24px";
    addButton.style.marginLeft = "10px";

    addButton.addEventListener("click", async () => {
        const videoId = new URL(window.location.href).searchParams.get("v");
        const videoTitle = document.title.replace(" - YouTube", "");
        const channelName = document.querySelector("#owner #channel-name a")?.innerText || "Unknown";
        const likeCount = document.querySelector("#top-level-buttons-computed yt-formatted-string[aria-label*='likes']")?.innerText || "0";

        const duration = await getVideoDuration();
        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

        console.log("Video ID:", videoId);
        console.log("Video Title:", videoTitle);
        console.log("Channel Name:", channelName);
        console.log("Like Count:", likeCount);
        console.log("Duration:", duration);
        console.log("Thumbnail URL:", thumbnailUrl);

        const videoData = { videoId, title: videoTitle, channelName, likeCount, duration, url: window.location.href, thumbnail: thumbnailUrl };

        chrome.storage.local.get({ playlist: [] }, (data) => {
            if (data.playlist.some(video => video.videoId === videoId)) {
                alert("This video is already in the playlist.");
                return;
            }

            data.playlist.push(videoData);
            chrome.storage.local.set({ playlist: data.playlist }, () => {
                alert("Added to playlist: " + videoTitle);
            });
        });
    });

    buttonsContainer.appendChild(addButton);
}

// Function to reliably fetch video duration
async function getVideoDuration() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 10; // Try up to 10 times
        const interval = 500; // Check every 500ms

        function checkDuration() {
            const videoElement = document.querySelector("video");

            if (!videoElement) {
                console.log("Video element not found.");
                return resolve("Unknown");
            }

            if (videoElement.readyState >= 1 && !isNaN(videoElement.duration)) {
                console.log("Video duration found:", videoElement.duration);
                return resolve(formatDuration(videoElement.duration));
            }

            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(checkDuration, interval); // Retry
            } else {
                console.log("Failed to fetch video duration after multiple attempts.");
                resolve("Unknown");
            }
        }

        checkDuration();
    });
}

// Helper function to format duration from seconds to HH:MM:SS
function formatDuration(seconds) {
    if (isNaN(seconds) || seconds <= 0) return "Unknown";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
}

// Run add button logic every 5 seconds
setInterval(addPlaylistButton, 5000);
