chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ playlist: [] });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "playSequentially") {
        playSequentially(0);
    }
});

function playSequentially(index) {
    chrome.storage.local.get({ playlist: [] }, (data) => {
        if (index >= data.playlist.length) return;
        chrome.tabs.create({ url: data.playlist[index].url });

        setTimeout(() => playSequentially(index + 1), 10000); // Adjust timing as needed
    });
}
