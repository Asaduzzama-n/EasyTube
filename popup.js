document.addEventListener("DOMContentLoaded", () => {
    const playlistContainer = document.getElementById("playlist");
    const playAllBtn = document.getElementById("playAll");

    function loadPlaylist() {
        chrome.storage.local.get({ playlist: [], currentIndex: -1 }, (data) => {
            playlistContainer.innerHTML = "";

            data.playlist.forEach((video, index) => {
                const videoElement = document.createElement("div");
                videoElement.className = "video-item";

                if (index === data.currentIndex) {
                    videoElement.classList.add("now-playing");
                }

                videoElement.innerHTML = `
                    <img class="thumbnail" src="${video.thumbnail}">
                    <div class="video-details">
                        <div class="video-title">${video.title}</div>
                        <div class="video-meta">🎬 ${video.channelName} | 👍 ${video.likeCount} | ⏳ ${formatTime(video.duration)}</div>
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
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs.length === 0) return;
                        chrome.tabs.update(tabs[0].id, { url: data.playlist[index].url });
                        loadPlaylist();
                    });
                }
            });
        });
    }

    function removeFromPlaylist(index) {
        chrome.storage.local.get({ playlist: [], currentIndex: -1 }, (data) => {
            let playlist = data.playlist;
            let newIndex = data.currentIndex;

            if (index < newIndex) {
                newIndex--; // Shift index back if previous video is removed
            } else if (index === newIndex) {
                newIndex = -1; // Reset if current video is removed
            }

            playlist.splice(index, 1);
            chrome.storage.local.set({ playlist, currentIndex: newIndex }, loadPlaylist);
        });
    }

    playAllBtn.addEventListener("click", () => {
        playSequentially(0);
    });

    function playSequentially(index) {
        chrome.storage.local.set({ currentIndex: index }, () => {
            chrome.storage.local.get({ playlist: [] }, (data) => {
                if (index >= data.playlist.length) return;

                chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (tabs.length === 0) return;
                    let tabId = tabs[0].id;

                    chrome.tabs.update(tabId, { url: data.playlist[index].url });

                    setTimeout(() => {
                        monitorVideoEnd(() => playSequentially(index + 1));
                    }, 3000);
                });
            });
        });
    }

    function monitorVideoEnd(callback) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs.length === 0) return;
            let tabId = tabs[0].id;

            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => {
                    let video = document.querySelector("video");
                    if (video) {
                        video.addEventListener("ended", () => {
                            chrome.runtime.sendMessage({ action: "nextVideo" });
                        });
                    }
                }
            });

            const messageListener = (message) => {
                if (message.action === "nextVideo") {
                    callback();
                }
            };

            chrome.runtime.onMessage.removeListener(messageListener);
            chrome.runtime.onMessage.addListener(messageListener);
        });
    }

    function formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }

    loadPlaylist();
});
