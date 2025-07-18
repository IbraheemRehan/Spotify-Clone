console.log('Lets write javaScript');
let currentSong = new Audio;
let currFolder;
let currentSongIndex = 0;
let songs = []
let play;
let allPlaylists = [];
let currentPlaylistIndex = 0;

// Fetch all playlist folders (once) and store them
async function fetchPlaylists() {
    let res = await fetch('http://127.0.0.1:3000/Spotify%20Clone/songs/');
    let html = await res.text();
    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    let anchors = tempDiv.getElementsByTagName("a");

    allPlaylists = [];
    for (let anchor of anchors) {
        if (anchor.href.includes("/songs/") && !anchor.href.endsWith(".mp3")) {
            let folder = decodeURIComponent(anchor.href.split("/").slice(-2)[0]);
            allPlaylists.push(folder);
        }
    }
}

// Load a playlist by index
async function loadPlaylistByIndex(index) {
    if (index < 0 || index >= allPlaylists.length) return;

    currentPlaylistIndex = index;
    const folder = allPlaylists[index];
    currFolder = `songs/${folder}`;
    songs = await getsongs(currFolder);
    currentSongIndex = 0;

    const songUL = document.querySelector(".songlist ul");
    songUL.innerHTML = "";

    for (const song of songs) {
        let songName = song.split("/").pop().replaceAll("%20", " ");
        songUL.innerHTML += `
            <li>
                <img class="invert musicSize" src="music.svg" alt="">
                <div class="info">
                    <div class="scroll-text" data-text="${songName}">${songName}</div>
                    <div class="scroll-text" data-text="Song Artist">Song Artist</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="play.svg" alt="">
                </div>
            </li>`;
    }

    Array.from(songUL.getElementsByTagName("li")).forEach((li, i) => {
        li.addEventListener("click", () => {
            const songText = li.querySelector(".info .scroll-text").dataset.text.trim();
            currentSongIndex = i;
            playMusic(songText);
        });
    });

    playMusic(songs[currentSongIndex]);
}


function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}

async function getsongs(folder) {
    currFolder = folder;
    songs = []; //  Clear old songs to avoid mixing albums

    let a = await fetch(`http://127.0.0.1:3000/Spotify%20Clone/${folder}/`);
    let responce = await a.text();

    let div = document.createElement("div");
    div.innerHTML = responce;
    let as = div.getElementsByTagName("a");

    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1]);
        }
    }

    return songs;
}

const playMusic = (track, pause = false) => {
    if (!track) {
        console.error("No track provided to playMusic()");
        return;
    }
    let cleanTrack = decodeURIComponent(track.trim());
    let fullPath = `/Spotify Clone/${currFolder}/` + cleanTrack;

    console.log("Trying to play:", fullPath);

    currentSong.src = fullPath;
    if (!pause) {
        currentSong.play().catch(e => console.error("Playback failed:", e));
        play.src = "pause.svg";
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

async function displayAlbums() {
    console.log("Displaying albums...");

    let res = await fetch('http://127.0.0.1:3000/Spotify%20Clone/songs/');
    let html = await res.text();

    let tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    let anchors = tempDiv.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = ""; // Clear any existing cards

    for (let anchor of anchors) {
        if (anchor.href.includes("/songs/") && !anchor.href.endsWith(".mp3")) {
            let folder = decodeURIComponent(anchor.href.split("/").slice(-2)[0]);

            try {
                let metaRes = await fetch(`http://127.0.0.1:3000/Spotify%20Clone/songs/${folder}/info.json`);
                let meta = await metaRes.json();

                cardContainer.innerHTML += `
                    <div data-folder="${folder}" class="card">
                        <div class="playButton">
                            <svg class="play-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12" cy="12" r="12" fill="#1db954" />
                                <path d="M10 8L16 12L10 16V8Z" fill="white" />
                            </svg>
                        </div>
                        <img src="/Spotify%20Clone/songs/${folder}/cover.jpg" alt="${meta.title} Cover">
                        <h2>${meta.title}</h2>
                        <p>${meta.description}</p>
                    </div>
                `;
            } catch (err) {
                console.warn(`Skipping folder "${folder}": info.json missing or invalid`, err);
            }
        }
    }

    // Rebind click listeners to cards after rendering
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async (event) => {
            const folder = event.currentTarget.dataset.folder;
            currFolder = `songs/${folder}`;
            songs = await getsongs(currFolder);
            currentSongIndex = 0;

            const songUL = document.querySelector(".songlist ul");
            songUL.innerHTML = "";

            for (const song of songs) {
                let songName = song.split("/").pop().replaceAll("%20", " ");
                songUL.innerHTML += `
                    <li>
                        <img class="invert musicSize" src="music.svg" alt="">
                        <div class="info">
                            <div class="scroll-text" data-text="${songName}">${songName}</div>
                            <div class="scroll-text" data-text="Song Artist">Song Artist</div>
                        </div>
                        <div class="playnow">
                            <span>Play Now</span>
                            <img class="invert" src="play.svg" alt="">
                        </div>
                    </li>`;
            }

            Array.from(songUL.getElementsByTagName("li")).forEach((li, i) => {
                li.addEventListener("click", () => {
                    const songText = li.querySelector(".info .scroll-text").dataset.text.trim();
                    currentSongIndex = i;
                    playMusic(songText);
                });
            });

            playMusic(songs[currentSongIndex]);
        });
    });
}




async function main() {
    play = document.querySelector(".songbuttons img:nth-child(2)");

    await displayAlbums();
    await fetchPlaylists(); // Load all playlist folders
    await loadPlaylistByIndex(0); // Start from the first playlist



    // Set default icon to "play" on load
    play.src = "play.svg";

    let songs = await getsongs("songs/Trending");
    console.log(songs);


    playMusic(songs[currentSongIndex], true);
    // Start with first song, but keep it paused

    let songUL = document.querySelector(".songlist ul");

    for (const song of songs) {
        let songName = song.split("/").pop().replaceAll("%20", " ");
        songUL.innerHTML += `
        <li>
            <img class="invert musicSize" src="music.svg" alt="">
            <div class="info">
                <div class="scroll-text" data-text="${songName}">${songName}</div>
                <div class="scroll-text" data-text="Song Artist">Song Artist</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img class="invert" src="play.svg" alt="">
            </div>
        </li>`;
    }

    Array.from(songUL.getElementsByTagName("li")).forEach((e, i) => {
        e.addEventListener("click", () => {
            const songText = e.querySelector(".info .scroll-text").dataset.text.trim();
            currentSongIndex = i; // Update index
            playMusic(songText);
        });
    });


    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "pause.svg";
        } else {
            currentSong.pause();
            play.src = "play.svg";
        }
    });

    currentSong.addEventListener("timeupdate", () => {
        // Update time display
        document.querySelector(".songtime").innerHTML =
            `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;

        // Update progress circle position
        const progress = (currentSong.currentTime / currentSong.duration) * 100;
        if (!isNaN(currentSong.duration)) {
            const progress = (currentSong.currentTime / currentSong.duration) * 100;
            document.querySelector(".circle").style.left = `${progress}%`;
        }

    });

    //  Add seekbar click functionality
    document.querySelector(".seekbar").addEventListener("click", (e) => {
        const seekbar = e.currentTarget;
        const rect = seekbar.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percent = offsetX / rect.width;
        currentSong.currentTime = percent * currentSong.duration;
    });
    const seekbar = document.querySelector(".seekbar");
    const circle = document.querySelector(".circle");

    let isDragging = false;

    seekbar.addEventListener("mousedown", (e) => {
        isDragging = true;
        updateSeek(e);
    });

    document.addEventListener("mousemove", (e) => {
        if (isDragging) {
            updateSeek(e);
        }
    });

    document.addEventListener("mouseup", () => {
        isDragging = false;
    });

    function updateSeek(e) {
        const rect = seekbar.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, offsetX / rect.width));
        const newTime = percent * currentSong.duration;

        currentSong.currentTime = newTime;

        // Move the circle smoothly
        circle.style.left = `${percent * 100}%`;
    }

    document.querySelector(".hamburger").addEventListener("click", () => {

        document.querySelector(".left").style.left = "0"
    })

    document.querySelector(".Home").addEventListener("click", () => {

        document.querySelector(".left").style.left = "-100%"
    })

    document.querySelector(".close").addEventListener("click", () => {

        document.querySelector(".left").style.left = "-100%"
    })
    const prevBtn = document.getElementById("previous");
    const nextBtn = document.getElementById("next");

    // Go to Previous Song
    prevBtn.addEventListener("click", () => {
        currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
        playMusic(songs[currentSongIndex]);
    });

    // Go to Next Song
    nextBtn.addEventListener("click", () => {
        currentSongIndex = (currentSongIndex + 1) % songs.length;
        playMusic(songs[currentSongIndex]);
    });
    document.querySelector(".arrows svg:nth-child(1)").addEventListener("click", async () => {
        if (allPlaylists.length === 0) return;
        currentPlaylistIndex = (currentPlaylistIndex - 1 + allPlaylists.length) % allPlaylists.length;
        await loadPlaylistByIndex(currentPlaylistIndex);
    });

    document.querySelector(".arrows svg:nth-child(2)").addEventListener("click", async () => {
        if (allPlaylists.length === 0) return;
        currentPlaylistIndex = (currentPlaylistIndex + 1) % allPlaylists.length;
        await loadPlaylistByIndex(currentPlaylistIndex);
    });
    // Show search bar when search button is clicked
document.getElementById("searchBtn").addEventListener("click", function () {
  const box = document.getElementById("songSearchBox");
  box.style.display = box.style.display === "none" ? "block" : "none";
  document.getElementById("songSearchInput").focus();
});

// Search functionality
document.getElementById("songSearchInput").addEventListener("input", function () {
  const filter = this.value.toLowerCase();
  const listItems = document.querySelectorAll(".songlist ul li");

  listItems.forEach((item) => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(filter) ? "flex" : "none";
  });
});

}

main();