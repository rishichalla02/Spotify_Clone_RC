console.log("Script loaded");

let currentSong = new Audio();
let songs;
let currfolder;
let play = document.getElementById("play");
let previous = document.getElementById("previous");
let next = document.getElementById("next");
let currentLi = null;
let isLoggedIn = false; // Track login state

// Moved these to a broader scope so they are accessible to main
let currentSliderPage = 0; // 0 for cardContainer, 1 for profileCard
let sliderPages = []; // Will store the slider content elements

// Function to show a specific slider page
function showSliderPage(index) {
    sliderPages.forEach((page, i) => {
        if (i === index) {
            page.style.display = 'flex'; // Show the current page
        } else {
            page.style.display = 'none'; // Hide other pages
        }
    });
    // Update the title based on the current page
    const spotifyPlaylistTitle = document.querySelector(".spotifyPlaylist h1");
    if (spotifyPlaylistTitle) {
        if (index === 0) {
            spotifyPlaylistTitle.textContent = "Spotify Playlists";
        } else if (index === 1) {
            spotifyPlaylistTitle.textContent = "User Profile";
        }
    }
}


// Hide main content initially
document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.container');
    if (container) {
        container.style.display = 'none';
    }
});

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');
    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currfolder = folder;
    try {
        // *** CHANGE: Fetch info.json directly for song list ***
        // This will fetch the auto-generated info.json from the specific album folder
        let a = await fetch(`/songs/${folder}/info.json`);

        let info = await a.json(); // Parse the response as JSON
        songs = info.songs || []; // Get the 'songs' array from the JSON

        let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
        if (songUL) {
            songUL.innerHTML = ""; // Clear existing song list items
            for (const song of songs) {
                songUL.innerHTML += `
                    <li data-song-path="${song}"> <img class="invert" src="./img/music.svg" alt="music">
                        <div class="info">
                            <div>${song.replace(".mp3", "")}</div> <div>${info.artist || 'Unknown Artist'}</div> </div>
                        <div class="playnow">
                            <span>Play Now</span>
                            <img class="invert" src="./img/play.svg" alt="">
                        </div>
                    </li>`;
            }

            // Attach event listeners for each song in the list
            Array.from(document.querySelectorAll(".songList li")).forEach(li => {
                li.addEventListener("click", () => {
                    // Get the full song filename from the data attribute for playback
                    const trackName = li.getAttribute('data-song-path');

                    // Play/pause logic for the current song if clicked again
                    if (currentLi === li) {
                        if (!currentSong.paused) {
                            currentSong.pause();
                            if (play) play.src = "./img/play.svg";
                            li.querySelector(".playnow img").src = "./img/play.svg";
                        } else {
                            currentSong.play();
                            if (play) play.src = "./img/pause.svg";
                            li.querySelector(".playnow img").src = "./img/pause.svg";
                        }
                        return;
                    }

                    // If a new song is clicked, play it
                    playMusic(trackName); // Pass the complete filename to playMusic
                    if (play) play.src = "./img/pause.svg";

                    // Update play/pause icons for all songs
                    document.querySelectorAll(".songList li .playnow img").forEach(img => {
                        img.src = "./img/play.svg"; // Set all to play icon
                    });
                    li.querySelector(".playnow img").src = "./img/pause.svg"; // Set current to pause icon
                    currentLi = li; // Update the currently playing list item
                });
            });
        }
    } catch (error) {
        console.error(`Error fetching songs from folder '${folder}':`, error);
        let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
        if (songUL) {
            songUL.innerHTML = "";
            for (const song of songs) {
                // Ensure fallback also uses data-song-path and cleans display name
                songUL.innerHTML += `
                    <li data-song-path="${song}">
                        <img class="invert" src="./img/music.svg" alt="music">
                        <div class="info">
                            <div>${song.replace(".mp3", "")}</div>
                            <div>Rishi Challa</div>
                        </div>
                        <div class="playnow">
                            <span>Play Now</span>
                            <img class="invert" src="./img/play.svg" alt="">
                        </div>
                    </li>`;
            }
            // Attach click listeners for fallback songs as well
            Array.from(document.querySelectorAll(".songList li")).forEach(li => {
                li.addEventListener("click", () => {
                    const trackName = li.getAttribute('data-song-path');
                    // This re-attaches the logic to the fallback items if the fetch fails
                    if (currentLi === li) {
                        if (!currentSong.paused) {
                            currentSong.pause();
                            if (play) play.src = "./img/play.svg";
                            li.querySelector(".playnow img").src = "./img/play.svg";
                        } else {
                            currentSong.play();
                            if (play) play.src = "./img/pause.svg";
                            li.querySelector(".playnow img").src = "./img/pause.svg";
                        }
                        return;
                    }

                    playMusic(trackName);
                    if (play) play.src = "./img/pause.svg";

                    document.querySelectorAll(".songList li .playnow img").forEach(img => {
                        img.src = "./img/play.svg";
                    });

                    li.querySelector(".playnow img").src = "./img/pause.svg";
                    currentLi = li;
                });
            });
        }
    }
    return songs;
}

const playMusic = (track, pause = false) => {
    // *** FIX: Changed to relative path `/songs/${currfolder}/` ***
    currentSong.src = `/songs/${currfolder}/` + encodeURIComponent(track);
    if (!pause) {
        currentSong.play();
        if (play) {
            play.src = "./img/pause.svg";
        }
    }
    const songInfoElement = document.querySelector(".songinfo");
    const songTimeElement = document.querySelector(".songtime");

    if (songInfoElement) {
        songInfoElement.innerHTML = track;
    }
    if (songTimeElement) {
        songTimeElement.innerHTML = "00:00 / 00:00";
    }
};

async function displayAlbums() {
    console.log("Attempting to display albums...");
    let cardContainer = document.querySelector(".cardContainer");

    try {
        // Fetch the master albums.json file
        let albumsResponse = await fetch(`/songs/albums.json`);
        if (!albumsResponse.ok) {
            throw new Error(`HTTP error! status: ${albumsResponse.status}`);
        }
        let albumsData = await albumsResponse.json();

        // Clear existing content in cardContainer
        cardContainer.innerHTML = "";

        if (albumsData && Array.isArray(albumsData.folders)) {
            for (const folder of albumsData.folders) {
                try {
                    // Fetch info.json for each individual album folder
                    let infoResponse = await fetch(`/songs/${folder}/info.json`);
                    if (!infoResponse.ok) {
                        console.warn(`Could not find info.json for folder: ${folder}. Skipping.`);
                        continue; // Skip this folder if info.json is not found
                    }
                    let albumInfo = await infoResponse.json();

                    // Create the album card HTML
                    let cardHTML = `
                        <div data-folder="${folder}" class="card">
                             <div class="play"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24"
                                height="24" color="#000000" fill="none">
                                <path
                                    d="M18.8906 12.846C18.5371 14.189 16.8667 15.138 13.5257 17.0361C10.296 18.8709 8.6812 19.7884 7.37983 19.4196C6.8418 19.2671 6.35159 18.9776 5.95624 18.5787C5 17.6139 5 15.7426 5 12C5 8.2574 5 6.3861 5.95624 5.42132C6.35159 5.02245 6.8418 4.73288 7.37983 4.58042C8.6812 4.21165 10.296 5.12907 13.5257 6.96393C16.8667 8.86197 18.5371 9.811 18.8906 11.154C19.0365 11.7084 19.0365 12.2916 18.8906 12.846Z"
                                    stroke="currentColor" fill="black" stroke-width="0.5" stroke-linejoin="round" />
                            </svg></div>
                            <img src="/songs/${folder}/cover.jpg" alt="${albumInfo.title || folder}">
                            <h2>${albumInfo.title || folder}</h2>
                            <p>${albumInfo.description || "Description not available."}</p>
                        </div>`;
                    cardContainer.innerHTML += cardHTML; // Append the card
                } catch (innerError) {
                    console.error(`Error processing album folder ${folder}:`, innerError);
                }
            }

            // Attach event listeners to the newly created cards
            Array.from(document.getElementsByClassName("card")).forEach(card => {
                card.addEventListener("click", async item => {
                    const clickedFolder = item.currentTarget.dataset.folder;
                    console.log(`Loading songs for album: ${clickedFolder}`);
                    // Load songs from the clicked folder and play the first one
                    songs = await getSongs(clickedFolder);
                    if (songs.length > 0) {
                        playMusic(songs[0], true);
                    } else {
                        console.warn(`No songs found in album: ${clickedFolder}`);
                    }
                    // Optionally close the left sidebar after clicking an album
                    document.querySelector(".left").classList.remove("left-show");
                });
            });
        } else {
            console.error("albums.json is not in the expected format or is empty.");
        }
    } catch (error) {
        console.error("Error fetching or processing albums.json:", error);
        cardContainer.innerHTML = "<p>Could not load albums. Please check the server and file structure.</p>";
    }
}

// Make sure displayAlbums() is called when the app initializes
async function main() {
    await initializeAppWithAuth(); // Start the app by trying to initialize with auth

    // Initialize slider pages AFTER DOM is loaded
    sliderPages[0] = document.querySelector(".cardContainer");
    sliderPages[1] = document.querySelector(".profileCard");
    showSliderPage(currentSliderPage); // Show default page

    // Get the list of all the songs for an initial album (e.g., "Devotional")
    // This will load the songs for the first album into the song list in the sidebar.
    // If you want to load a different default album, change "Devotional" here.
    await getSongs("Devotional");
    if (songs && songs.length > 0) {
        playMusic(songs[0], true); // Play the first song of the initial album
    }
}

// Authentication functions
function displayUserInfo() {
    const authService = window.authService; // Assuming authService is globally available
    if (!authService) {
        console.warn('Auth service not available, cannot display user info.');
        return;
    }

    const user = authService.getCurrentUser(); // Assuming getCurrentUser exists
    if (user) {
        console.log('User logged in:', user.email);
        isLoggedIn = true;
        updateHeaderButtons();
        // Update profile card with user data
        document.getElementById('profileEmail').textContent = user.email || 'N/A';
        document.getElementById('profileUserId').textContent = user.uid || 'N/A';
        // Note: Password is not directly accessible from the user object for security reasons
        document.getElementById('profilePassword').textContent = '********';
    } else {
        isLoggedIn = false;
        updateHeaderButtons();
        // Clear profile card if not logged in
        document.getElementById('profileEmail').textContent = 'Not logged in';
        document.getElementById('profileUserId').textContent = 'N/A';
        document.getElementById('profilePassword').textContent = '********';
    }
}

function updateHeaderButtons() {
    const buttonsContainer = document.querySelector('.buttons');
    if (buttonsContainer) {
        if (isLoggedIn) {
            // Show logout button and user info
            const authService = window.authService;
            const user = authService ? authService.getCurrentUser() : null;
            const displayName = user ? (user.displayName || user.email) : 'User';

            buttonsContainer.innerHTML = `
                <span class="user-info" style="color: white; margin-right: 15px;">Welcome, ${displayName}</span>
                <button class="loginbtn" onclick="handleLogout()">Logout</button>
            `;
        } else {
            // Show login and signup buttons
            buttonsContainer.innerHTML = `
                <button data-action="signup" class="signupbtn">Sign up</button>
                <button data-action="login" class="loginbtn">Log in</button>
            `;
        }
    }
}

// Global logout function
window.handleLogout = async function () {
    const authService = window.authService;
    if (!authService) {
        console.error('Auth service not available for logout.');
        // Fallback logout: simply update UI
        isLoggedIn = false;
        updateHeaderButtons();
        // Using a custom message box instead of alert
        showCustomMessage('Logged out (mock). Authentication service not loaded.');
        return;
    }

    try {
        const result = await authService.signOut(); // Assuming signOut exists
        if (result && result.success) {
            console.log('User logged out successfully');
            isLoggedIn = false;
            updateHeaderButtons();
            // Reset slider to default view
            currentSliderPage = 0;
            showSliderPage(currentSliderPage);
            // Optionally redirect to login page
            window.location.href = './login.html';
        } else {
            console.error('Logout error:', result ? result.error : 'Unknown error');
            showCustomMessage('Error logging out. Please try again.');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        showCustomMessage('An unexpected error occurred during logout.');
    }
};

// Function to wait for auth services to be available (simplified for this script)
function waitForAuthServices() {
    return new Promise((resolve) => {
        // In a real app, you'd check if Firebase scripts are loaded and initialized
        // For this demo, we'll assume they might be available after a short delay
        // or not at all if auth-service.js/auth-guard.js aren't linked.
        if (window.authService && window.authGuard && typeof window.authService.waitForAuthInit === 'function') {
            resolve();
            return;
        }

        const checkInterval = setInterval(() => {
            if (window.authService && window.authGuard && typeof window.authService.waitForAuthInit === 'function') {
                clearInterval(checkInterval);
                resolve();
            }
        }, 100); // Check every 100ms

        setTimeout(() => {
            clearInterval(checkInterval);
            console.warn('Auth services not loaded within 5 seconds. Proceeding without.');
            resolve(); // Resolve anyway after timeout to unblock app
        }, 5000); // Wait up to 5 seconds
    });
}

async function initializeMainAppUI() {
    // Display user info if logged in
    displayUserInfo();

    // Display all the albums on the page
    await displayAlbums();

    // Initialize all event listeners
    initializeEventListeners();

    // Show the main content
    const container = document.querySelector('.container');
    if (container) {
        container.style.display = 'flex';
    }
}

async function initializeAppWithoutAuth() {
    console.log('Initializing app without authentication...');
    isLoggedIn = false; // Ensure logged out state for UI
    updateHeaderButtons(); // Show login/signup buttons
    await initializeMainAppUI();
}

async function initializeAppWithAuth() {
    console.log('Attempting to initialize app with authentication...');

    await waitForAuthServices(); // Wait for auth service to be potentially available

    const authService = window.authService;
    const authGuard = window.authGuard;

    if (!authService || !authGuard || typeof authService.waitForAuthInit !== 'function') {
        console.warn('Auth services not fully available or correctly structured. Running without authentication.');
        await initializeAppWithoutAuth();
        return;
    }

    try {
        const user = await authService.waitForAuthInit(); // This should handle Firebase auth state
        if (user) {
            console.log('User authenticated:', user.email);
            isLoggedIn = true;
        } else {
            console.log('No user authenticated.');
            isLoggedIn = false; // Set to false if no user
        }
        await initializeMainAppUI(); // Initialize UI based on auth state
    } catch (error) {
        console.error('Error during Firebase authentication initialization:', error);
        console.log('Falling back to app without authentication due to auth error.');
        await initializeAppWithoutAuth();
    }
}

// Function to show a custom message instead of alert
function showCustomMessage(message) {
    const messageBox = document.createElement('div');
    messageBox.className = 'custom-message-box';
    messageBox.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: #333;
        color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        text-align: center;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
    `;
    messageBox.textContent = message;
    document.body.appendChild(messageBox);

    setTimeout(() => {
        messageBox.style.opacity = '1';
    }, 10); // Small delay to trigger transition

    setTimeout(() => {
        messageBox.style.opacity = '0';
        messageBox.addEventListener('transitionend', () => messageBox.remove());
    }, 3000); // Message disappears after 3 seconds
}


function initializeEventListeners() {
    // Handle play/pause button
    if (play) {
        play.addEventListener("click", () => {
            if (!currentLi) {
                showCustomMessage("Please select a song first.");
                return;
            }

            if (currentSong.paused) {
                currentSong.play();
                play.src = "./img/pause.svg";
                if (currentLi) {
                    currentLi.querySelector(".playnow img").src = "./img/pause.svg";
                }
            } else {
                currentSong.pause();
                play.src = "./img/play.svg";
                if (currentLi) {
                    currentLi.querySelector(".playnow img").src = "./img/play.svg";
                }
            }
        });
    }

    // Listen for time update event
    currentSong.addEventListener("timeupdate", () => {
        const songTimeElement = document.querySelector(".songtime");
        const circleElement = document.querySelector(".circle");

        if (songTimeElement) {
            songTimeElement.innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        }
        if (circleElement && currentSong.duration) {
            circleElement.style.left = `${(currentSong.currentTime / currentSong.duration) * 100}%`;
        }
    });

    // Add event listener to seekbar
    const seekbar = document.querySelector(".seekbar");
    const progress = seekbar?.querySelector(".progress");
    const circle = seekbar?.querySelector(".circle");

    if (seekbar && progress && circle) {
        seekbar.addEventListener("click", (e) => {
            updateSeekbar(e);
        });

        let isDragging = false;

        circle.addEventListener("mousedown", (e) => {
            isDragging = true;
            e.preventDefault();
        });

        document.addEventListener("mousemove", (e) => {
            if (isDragging) {
                updateSeekbar(e);
            }
        });

        document.addEventListener("mouseup", () => {
            isDragging = false;
        });

        function updateSeekbar(e) {
            const rect = seekbar.getBoundingClientRect();
            let clickX = e.clientX;

            if (clickX < rect.left) clickX = rect.left;
            if (clickX > rect.right) clickX = rect.right;

            const offsetX = clickX - rect.left;
            const percentage = offsetX / rect.width;

            currentSong.currentTime = percentage * currentSong.duration;

            progress.style.width = `${percentage * 100}%`;
            circle.style.left = `${percentage * 100}%`;
        }
    }

    // Add event listener for hamburger
    const hamburger = document.querySelector(".hamburger");
    if (hamburger) {
        hamburger.addEventListener("click", () => {
            const leftPanel = document.querySelector(".left");
            if (leftPanel) {
                leftPanel.style.left = "0";
            }
        });
    }

    // Add event listener for close button
    const closeBtn = document.querySelector(".close");
    if (closeBtn) {
        closeBtn.addEventListener("click", () => {
            const leftPanel = document.querySelector(".left");
            if (leftPanel) {
                leftPanel.style.left = "-120%";
            }
        });
    }

    // Add event listener to previous
    if (previous) {
        previous.addEventListener("click", () => {
            if (currentSong.src && songs && songs.length > 0) {
                let currentFilename = decodeURIComponent(currentSong.src.split("/").pop());
                let index = songs.indexOf(currentFilename);
                if (index > 0) {
                    playMusic(songs[index - 1]);
                } else {
                    // Loop to end of playlist or stop
                    playMusic(songs[songs.length - 1]);
                }
            }
        });
    }

    // Add event listener to next
    if (next) {
        next.addEventListener("click", () => {
            if (currentSong.src && songs && songs.length > 0) {
                let currentFilename = decodeURIComponent(currentSong.src.split("/").pop());
                let index = songs.indexOf(currentFilename);
                if (index < songs.length - 1) {
                    playMusic(songs[index + 1]);
                } else {
                    // Loop to start of playlist or stop
                    playMusic(songs[0]);
                }
            }
        });
    }

    // Add event listener to volume
    const volumeSlider = document.querySelector(".range input");
    if (volumeSlider) {
        volumeSlider.addEventListener("change", (e) => {
            currentSong.volume = parseInt(e.target.value) / 100;
            // Update volume icon based on slider value
            const volumeIcon = document.querySelector(".volume>img");
            if (volumeIcon) {
                if (currentSong.volume === 0) {
                    volumeIcon.src = volumeIcon.src.replace("volume.svg", "mute.svg");
                } else {
                    volumeIcon.src = volumeIcon.src.replace("mute.svg", "volume.svg");
                }
            }
        });
    }

    // Add event listener to mute the track
    const volumeIcon = document.querySelector(".volume>img");
    if (volumeIcon) {
        volumeIcon.addEventListener("click", e => {
            if (e.target.src.includes("volume.svg")) {
                e.target.src = e.target.src.replace("volume.svg", "mute.svg");
                currentSong.volume = 0;
                const volumeInput = document.querySelector(".range input");
                if (volumeInput) {
                    volumeInput.value = 0;
                }
            } else {
                e.target.src = e.target.src.replace("mute.svg", "volume.svg");
                currentSong.volume = 0.1; // Restore to a default low volume
                const volumeInput = document.querySelector(".range input");
                if (volumeInput) {
                    volumeInput.value = 50; // Set slider to a corresponding value
                }
            }
        });
    }

    // Animation Script - Run once on load
    const container = document.createElement("div");
    container.className = "image-rain-container";

    const totalImages = 60;

    for (let i = 0; i < totalImages; i++) {
        const img = document.createElement("img");
        img.src = "./img/favicon.ico";
        img.className = "image-drop";

        img.style.left = `${Math.random() * 100}vw`;
        img.style.top = `-50px`;

        img.style.animationDelay = `${Math.random() * 2}s`;

        container.appendChild(img);
    }

    document.body.appendChild(container);

    // Clean up after animation
    setTimeout(() => {
        container.remove();
    }, 4000);

    // Navigation functions (for login/signup pages)
    function navigateToLogin() {
        window.location.href = './login.html';
    }

    function navigateToSignup() {
        window.location.href = './signup.html';
    }

    // Enhanced event delegation for data attributes for login/signup buttons
    document.addEventListener('click', function (e) {
        const target = e.target;
        const actionElement = target.closest('[data-action]');

        if (actionElement) {
            e.preventDefault();
            const action = actionElement.getAttribute('data-action');

            actionElement.style.opacity = '0.7';
            setTimeout(() => {
                actionElement.style.opacity = '1';
            }, 150);

            switch (action) {
                case 'login':
                    if (!isLoggedIn) navigateToLogin();
                    break;
                case 'signup':
                    if (!isLoggedIn) navigateToSignup();
                    break;
            }
        }
    });

    // Optional: Keyboard shortcuts for login/signup (only if not logged in)
    document.addEventListener('keydown', function (e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            switch (e.key.toLowerCase()) {
                case 'l':
                    if (!isLoggedIn) {
                        const loginBtn = document.querySelector('[data-action="login"]');
                        if (loginBtn) {
                            loginBtn.click();
                        }
                    }
                    break;
                case 's':
                    if (!isLoggedIn) {
                        const signupBtn = document.querySelector('[data-action="signup"]');
                        if (signupBtn) {
                            signupBtn.click();
                        }
                    }
                    break;
            }
        }
    });

    // Slider functionality
    const arrowLeft = document.querySelector(".arrow-left");
    const arrowRight = document.querySelector(".arrow-right");

    if (arrowLeft) {
        arrowLeft.addEventListener("click", () => {
            currentSliderPage = (currentSliderPage - 1 + sliderPages.length) % sliderPages.length;
            showSliderPage(currentSliderPage);
            // Re-display user info just in case
            if (currentSliderPage === 1) {
                displayUserInfo();
            }
        });
    }

    if (arrowRight) {
        arrowRight.addEventListener("click", () => {
            currentSliderPage = (currentSliderPage + 1) % sliderPages.length;
            showSliderPage(currentSliderPage);
            // Re-display user info just in case
            if (currentSliderPage === 1) {
                displayUserInfo();
            }
        });
    }
}

// Clean up on page unload (e.g., for authGuard listeners)
window.addEventListener('beforeunload', () => {
    const authGuard = window.authGuard;
    if (authGuard && typeof authGuard.cleanup === 'function') {
        authGuard.cleanup();
    }
});

main(); // Call main to start the application