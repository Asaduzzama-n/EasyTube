document.addEventListener("DOMContentLoaded", () => {
    const playlistContainer = document.getElementById("playlist");
    const playAllBtn = document.getElementById("playAll");

    function loadPlaylist() {
        chrome.storage.local.get({ playlist: [], currentIndex: -1 }, (data) => {
            playlistContainer.innerHTML = ""; // Clear old list

            data.playlist.forEach((video, index) => {
                const videoElement = document.createElement("div");
                videoElement.className = "video-item";

                if (index === data.currentIndex) {
                    videoElement.classList.add("now-playing"); // Highlight current video
                }

                videoElement.innerHTML = `
                    <img class="thumbnail" src="https://img.youtube.com/vi/${video.id}/default.jpg">
                    <div class="video-details">
                        <div class="video-title">${video.title}</div>
                        <div class="video-meta">${index === data.currentIndex ? "▶ Now Playing" : index === data.currentIndex + 1 ? "⏭ Next" : ""}</div>
                    </div>
                    <span class="play-btn" data-index="${index}">▶</span>
                    <span class="remove-btn" data-index="${index}">❌</span>
                `;

                playlistContainer.appendChild(videoElement);
            });

            document.querySelectorAll(".play-btn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    playVideo(parseInt(e.target.dataset.index));
                });
            });

            document.querySelectorAll(".remove-btn").forEach(btn => {
                btn.addEventListener("click", (e) => {
                    removeFromPlaylist(parseInt(e.target.dataset.index));
                });
            });
        });
    }

    function playVideo(index) {
        chrome.storage.local.set({ currentIndex: index }, () => {
            chrome.storage.local.get({ playlist: [] }, (data) => {
                if (data.playlist.length > index) {
                    chrome.tabs.create({ url: data.playlist[index].url });
                    loadPlaylist(); // Refresh UI
                }
            });
        });
    }

    function removeFromPlaylist(index) {
        chrome.storage.local.get({ playlist: [] }, (data) => {
            let playlist = data.playlist;
            playlist.splice(index, 1);
            chrome.storage.local.set({ playlist }, loadPlaylist);
        });
    }

    playAllBtn.addEventListener("click", () => {
        playSequentially(0);
    });

    function playSequentially(index) {
        chrome.storage.local.set({ currentIndex: index }, () => {
            chrome.storage.local.get({ playlist: [] }, (data) => {
                if (index >= data.playlist.length) return;
                chrome.tabs.create({ url: data.playlist[index].url });

                setTimeout(() => playSequentially(index + 1), 10000);
            });
        });
    }

    loadPlaylist();
});
