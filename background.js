chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ playlist: [] });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "playSequentially") {
        playSequentially();
    }
});

function playSequentially(index) {
    chrome.storage.local.get({ playlist: [] }, (data) => {
        if (index >= data.playlist.length) return;

        // Store the currently playing video index
        chrome.storage.local.set({ currentPlayingIndex: index });

        chrome.tabs.create({ url: data.playlist[index].url }, (tab) => {
            chrome.storage.local.set({ currentTabId: tab.id });

            // Wait for video duration before playing the next
            setTimeout(() => playSequentially(index + 1), 10000); // Adjust timing
        });
    });
}


// Listen for tab updates and inject autoplay logic
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === "complete") {
        chrome.storage.local.get(["playlist", "currentIndex", "activeTabId"], (data) => {
            if (tabId !== data.activeTabId) return;

            // Inject autoplay script into the YouTube tab
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                function: forceAutoplay,
            });
        });
    }
});

// Function to force autoplay after loading a new video
function forceAutoplay() {
    const waitForVideo = setInterval(() => {
        const video = document.querySelector("video");
        if (video) {
            clearInterval(waitForVideo);
            video.play(); // Force autoplay
            video.addEventListener("ended", () => {
                chrome.runtime.sendMessage({ action: "nextVideo" });
            });
        }
    }, 500); // Check every 500ms
}

// Listen for the "nextVideo" message and load the next video
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "nextVideo") {
        chrome.storage.local.get(["playlist", "currentIndex", "activeTabId"], (data) => {
            const nextIndex = data.currentIndex + 1;
            if (nextIndex >= data.playlist.length) return;

            chrome.tabs.update(data.activeTabId, { url: data.playlist[nextIndex].url }, () => {
                chrome.storage.local.set({ currentIndex: nextIndex });
            });
        });
    }
});
