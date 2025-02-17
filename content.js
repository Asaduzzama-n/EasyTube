function addPlaylistButton() {
    const buttonsContainer = document.querySelector("#top-level-buttons-computed");

    if (!buttonsContainer || document.querySelector("#easyTubeAddButton")) return;

    const addButton = document.createElement("img");
    addButton.src = chrome.runtime.getURL("assets/add.png");
    addButton.id = "easyTubeAddButton";
    addButton.style.cursor = "pointer";
    addButton.style.width = "24px";
    addButton.style.marginLeft = "10px";

    addButton.addEventListener("click", () => {
        const videoTitle = document.title.replace(" - YouTube", "");
        const videoUrl = window.location.href;
        const videoId = new URL(videoUrl).searchParams.get("v"); // Extract video ID

        chrome.storage.local.get({ playlist: [] }, (data) => {
            const playlist = data.playlist;

            if (playlist.some(video => video.url === videoUrl)) {
                alert("This video is already in the playlist.");
                return;
            }

            playlist.push({ title: videoTitle, url: videoUrl, id: videoId });
            chrome.storage.local.set({ playlist }, () => {
                console.log("Added to playlist:", videoTitle);
                alert("Added to playlist: " + videoTitle);
            });
        });
    });

    buttonsContainer.appendChild(addButton);
}

setInterval(addPlaylistButton, 2000);
