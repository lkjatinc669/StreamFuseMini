const changeType = (id) => {
    if (id == "Audio") {loadAudios()}
    if (id == "Video") {loadVideos()}
    if (id == "Image") {loadImages()}
    document.getElementById("selected").textContent = id;
    document.getElementById("dropdown-content").style.display = "none";
}

document.getElementById("dropdown").addEventListener("click", (event) => {
    const dropdownContent = document.getElementById("dropdown-content");
    dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
    event.stopPropagation();
});

document.addEventListener('click', (event) => {
    const dropdownContent = document.getElementById("dropdown-content");
    if (!document.getElementById("dropdown").contains(event.target)) {
        dropdownContent.style.display = "none";
    }
});

const resolveFolder = () => {
    const currurl = window.location.href;
    list = currurl.split("/")
    listlen = list.length
    type = list[listlen - 2]
    id = list[listlen - 1]
    return [type, id]
}

// const getAudios = () => {
//     const xhr = new XMLHttpRequest()
//     xhr.open("POST", "/stream/get-all-files", true);
//     xhr.setRequestHeader("Content-Type", "application/json");
//     xhr.send(JSON.stringify({ folderId: resolveFolder() }));

//     xhr.onreadystatechange = function () {
//         if (this.readyState === 4 && this.status === 200) {
//             // console.log(this.response)
//         }
//     }
// }

document.getElementById("showPlayListButton").addEventListener("click", () => {
    const playListButton = document.getElementById("showPlayListButton")
    const playlist = document.querySelector(".playlist")
    const videoPlayer = document.querySelector(".video-player")

    if (playlist.style.display == "block") {
        playlist.style.display = "none"
        videoPlayer.style.display = "block"
        playListButton.classList.remove("bi-chevron-left")
        playListButton.classList.add("bi-chevron-right")
    } else {
        playlist.style.display = "block"
        videoPlayer.style.display = "none"
        playListButton.classList.remove("bi-chevron-left")
        playListButton.classList.add("bi-chevron-right")
    }
})

// getAudios()

loadAudios = () => {
    document.getElementById("mainContainer").innerHTML = `
    <div class="music-container">
            <div class="music-player">
                <marquee><h1 id="currentMusicName">Music</h1></marquee>
                <div class="disk">
                    Music
                </div>
                <div class="controls">
                    <p id="currentTime">0:00</p> / <p id="duration">0:00</p>
                    <input type="range" id="seekBar" value="0" min="0" max="100">
                    <div class="buttons">
                        <i class="bi bi-shuffle" id="shuffleButton"></i>
                        <i class="bi bi-chevron-double-left" id="playPreviousAudio"></i>
                        <i class="bi bi-play" id="playPause"></i>
                        <i class="bi bi-chevron-double-right" id="playNextAudio"></i>
                        <i class="bi bi-repeat" id="repeatButton"></i>
                    </div>
                </div>
            </div> 

            <div class="playlist">
                <ul id="audioList" class="lists">
                </ul>
            </div>
            <audio id="audio" controls style="display: none;">
                <source id="audioSource" src="" type="audio/mp3">
                Your browser does not support the audio tag.
            </audio>
        </div>`
    const audio = document.getElementById('audio');
    const audioSource = document.getElementById('audioSource');
    const playPauseButton = document.getElementById('playPause');
    const seekBar = document.getElementById('seekBar');
    const currentTimeDisplay = document.getElementById('currentTime');
    const durationDisplay = document.getElementById('duration');
    const audioList = document.getElementById('audioList');
    const repeatButton = document.getElementById('repeatButton');
    const shuffleButton = document.getElementById('shuffleButton');
    const playNextButton = document.getElementById('playNextAudio');
    const playPrevButton = document.getElementById('playPreviousAudio');

    let isRepeating = false;
    let isShuffling = false;
    let currentAudioIndex = 0;
    let audios = [];

    fetch('/stream/get-all-files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({"id": resolveFolder()[1], "type":resolveFolder()[0], "content": "audio"})
    })
        .then(response => response.json())
        .then(audioFiles => {
            audios = audioFiles;
            console.log(audios);
            audios.forEach((audioFile, index) => {
                const li = document.createElement('li');
                li.textContent = audioFile.title;
                li.dataset.url = audioFile.url;
                li.addEventListener('click', () => loadAudio(index));
                audioList.appendChild(li);
            });

            // Load the first audio by default
            if (audios.length > 0) {
                loadAudio(0);
            }
        });

    playPauseButton.addEventListener('click', () => {
        if (audio.paused) {
            audio.play();
            playPauseButton.classList.remove("bi-play");
            playPauseButton.classList.add("bi-pause");
        } else {
            audio.pause();
            playPauseButton.classList.remove("bi-pause");
            playPauseButton.classList.add("bi-play");
        }
    });

    audio.addEventListener('timeupdate', () => {
        const currentTime = audio.currentTime;
        const duration = audio.duration;
        seekBar.value = (currentTime / duration) * 100;

        currentTimeDisplay.textContent = formatTime(currentTime);
        durationDisplay.textContent = formatTime(duration);
    });

    seekBar.addEventListener('input', () => {
        const seekTo = audio.duration * (seekBar.value / 100);
        audio.currentTime = seekTo;
    });

    audio.addEventListener('loadedmetadata', () => {
        durationDisplay.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', () => {
        if (isRepeating) {
            audio.currentTime = 0;
            audio.play();
        } else if (isShuffling) {
            loadAudio(Math.floor(Math.random() * audios.length));
        } else {
            loadAudio((currentAudioIndex + 1) % audios.length);
        }
    });

    repeatButton.addEventListener('click', () => {
        isRepeating = !isRepeating;
        repeatButton.classList.toggle('active', isRepeating); // Toggle active class for visual feedback
    });

    shuffleButton.addEventListener('click', () => {
        isShuffling = !isShuffling;
        shuffleButton.classList.toggle('active', isShuffling); // Toggle active class for visual feedback
    });

    playNextButton.addEventListener('click', () => {
        if (isShuffling) {
            loadAudio(Math.floor(Math.random() * audios.length));
        } else {
            loadAudio((currentAudioIndex + 1) % audios.length);
        }
    });

    playPrevButton.addEventListener('click', () => {
        if (isShuffling) {
            loadAudio(Math.floor(Math.random() * audios.length));
        } else {
            loadAudio((currentAudioIndex - 1 + audios.length) % audios.length);
        }
    });

    function loadAudio(index) {
        currentAudioIndex = index;
        const selectedAudio = audios[index];
        audioSource.src = selectedAudio.url;
        audio.load();
        audio.play().then(() => {
            playPauseButton.classList.remove("bi-play");
            playPauseButton.classList.add("bi-pause");
        }).catch(error => {
            console.error('Error playing audio:', error);
        });
        document.getElementById("currentMusicName").textContent = selectedAudio.title;
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
};


loadVideos = () => {
    document.getElementById("mainContainer").innerHTML = `
    <div class="video-container">
            <div class="video-player">
                <p id="currentVideoName" style="padding: 12px 0;">Video</p>
                <video id="video">
                    <source id="videoSource" src="" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div class="controls">
                    <div class="timer">
                        <p id="currentTime">0:00</p> / <p id="duration">0:00</p>
                    </div>
                    <input type="range" id="seekBar" value="0" min="0" max="100">
                    <div class="buttons" id="videoButtons">
                        <i class="bi bi-shuffle" id="shuffleButton"></i>
                        <i class="bi bi-chevron-double-left" id="playPreviousVideo"></i>
                        <i class="bi bi-play" id="playPause"></i>
                        <i class="bi bi-chevron-double-right" id="playNextVideo"></i>
                        <i class="bi bi-repeat" id="repeatButton"></i> 
                    </div>
                </div>
            </div>

            <div class="playlist">
                <ul id="videoList" class="lists">
                </ul>
            </div>
        </div>`
    const video = document.getElementById('video');
    const videoSource = document.getElementById('videoSource');
    const playPauseButton = document.getElementById('playPause');
    const seekBar = document.getElementById('seekBar');
    const currentTimeDisplay = document.getElementById('currentTime');
    const durationDisplay = document.getElementById('duration');
    const videoList = document.getElementById('videoList');
    const repeatButton = document.getElementById('repeatButton');
    const shuffleButton = document.getElementById('shuffleButton');
    const playNextButton = document.getElementById('playNextVideo');
    const playPrevButton = document.getElementById('playPreviousVideo');

    let isRepeating = false;
    let isShuffling = false;
    let currentVideoIndex = 0;
    let videos = [];

    if (window.innerWidth < 600) {
        document.getElementById("showPlayListButton").click()
        document.getElementById("showPlayListButton").click()
    }

    fetch('/stream/get-all-files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({"id": resolveFolder()[1], "type":resolveFolder()[0], "content": "video"})
    })
        .then(response => response.json())
        .then(videoFiles => {
            videos = videoFiles;
            console.log(videos);
            videos.forEach((videoFile, index) => {
                const li = document.createElement('li');
                li.textContent = videoFile.title;
                li.dataset.url = videoFile.url;
                li.addEventListener('click', () => loadVideo(index));
                videoList.appendChild(li);
            });

            // Load the first video by default
            if (videos.length > 0) {
                loadVideo(0);
            }
        });

    playPauseButton.addEventListener('click', () => {
        if (video.paused) {
            video.play();
            playPauseButton.classList.remove("bi-play");
            playPauseButton.classList.add("bi-pause");
        } else {
            video.pause();
            playPauseButton.classList.remove("bi-pause");
            playPauseButton.classList.add("bi-play");
        }
    });

    video.addEventListener('timeupdate', () => {
        const currentTime = video.currentTime;
        const duration = video.duration;
        seekBar.value = (currentTime / duration) * 100;

        currentTimeDisplay.textContent = formatTime(currentTime);
        durationDisplay.textContent = formatTime(duration);
    });

    seekBar.addEventListener('input', () => {
        const seekTo = video.duration * (seekBar.value / 100);
        video.currentTime = seekTo;
    });

    video.addEventListener('loadedmetadata', () => {
        durationDisplay.textContent = formatTime(video.duration);
    });

    video.addEventListener('ended', () => {
        if (isRepeating) {
            video.currentTime = 0;
            video.play();
        } else if (isShuffling) {
            loadVideo(Math.floor(Math.random() * videos.length));
        } else {
            loadVideo((currentVideoIndex + 1) % videos.length);
        }
    });

    repeatButton.addEventListener('click', () => {
        isRepeating = !isRepeating;
        repeatButton.classList.toggle('active', isRepeating); // Toggle active class for visual feedback
    });

    shuffleButton.addEventListener('click', () => {
        isShuffling = !isShuffling;
        shuffleButton.classList.toggle('active', isShuffling);
    });

    playNextButton.addEventListener('click', () => {
        if (isShuffling) {
            loadVideo(Math.floor(Math.random() * videos.length));
        } else {
            loadVideo((currentVideoIndex + 1) % videos.length);
        }
    });

    playPrevButton.addEventListener('click', () => {
        if (isShuffling) {
            loadVideo(Math.floor(Math.random() * videos.length));
        } else {
            loadVideo((currentVideoIndex - 1 + videos.length) % videos.length);
        }
    });

    function loadVideo(index) {
        currentVideoIndex = index;
        const selectedVideo = videos[index];
        videoSource.src = selectedVideo.url;
        video.load();
        video.play().then(() => {
            playPauseButton.classList.remove("bi-play");
            playPauseButton.classList.add("bi-pause");
        }).catch(error => {
            console.error('Error playing video:', error);
        });
        document.getElementById("currentVideoName").textContent = selectedVideo.title;
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    }
};


const loadImages = () => {

    document.getElementById("mainContainer").innerHTML = `
<div class="image-container">
            <div class="image-player">
                <p id="currentImageName" style="padding: 12px 0;">Image</p>
                <div class="imageContainer">
                    <img src="" id="image">
                </div>
                <div class="controls">
                    <div class="buttons" id="imageButtons">
                        <!-- <i class="bi bi-shuffle" id="shuffleButton"></i> -->
                        <i class="bi bi-chevron-double-left" id="playPreviousImage"></i>
                        <!-- <i class="bi bi-play" id="playPause"></i> -->
                        <i class="bi bi-chevron-double-right" id="playNextImage"></i>
                        <!-- <i class="bi bi-repeat" id="repeatButton"></i>  -->
                    </div>
                </div>
            </div>

            <div class="playlist">
                <div id="imageList" class="lists">
                    
                </div>
            </div>
        </div>`


    let currentIndex = 0;
    let isRepeating = false;
    let isShuffling = false;

    const currentImage = document.getElementById('image');
    const currentImageName = document.getElementById('currentImageName');
    const playPauseButton = document.getElementById('playPause');
    const prevButton = document.getElementById('playPreviousImage');
    const nextButton = document.getElementById('playNextImage');
    const shuffleButton = document.getElementById('shuffleButton');
    const repeatButton = document.getElementById('repeatButton');
    const imageList = document.getElementById('imageList');

    fetch('/stream/get-all-files', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json' 
          },
          body: JSON.stringify({"id": resolveFolder()[1], "type":resolveFolder()[0], "content": "image"})
    })
        .then(response => response.json())
        .then(imageFiles => {
            images = imageFiles;
            console.log(images);
            images.forEach((image, index) => {
                const imgElement = document.createElement('img');
                imgElement.src = image.url;
                imgElement.alt = image.title;
                imgElement.addEventListener('click', () => loadImage(index));
                imageList.appendChild(imgElement);
            });
            loadImage(0)
        });

    function loadImage(index) {
        currentImage.src = images[index].url;
        currentImageName.textContent = images[index].title;
    }

    prevButton.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + images.length) % images.length;
        loadImage(currentIndex);
    });

    nextButton.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % images.length;
        loadImage(currentIndex);
    });

    // shuffleButton.addEventListener('click', () => {
    //     isShuffling = !isShuffling;
    //     shuffleButton.classList.toggle('active', isShuffling);
    // });

    // repeatButton.addEventListener('click', () => {
    //     isRepeating = !isRepeating;
    //     repeatButton.classList.toggle('active', isRepeating);
    // });

    play = false

    // playPauseButton.addEventListener('click', () => {
    //     // Logic for play/pause button
    //     play = !play
    //     // play.classList
    // });


    currentImage.addEventListener('load', () => {
        if (play) {

            if (isRepeating) {
                setTimeout(() => {
                    loadImage(currentIndex);
                }, 3000); // Adjust delay as needed
            } else if (isShuffling) {
                currentIndex = Math.floor(Math.random() * images.length);
                setTimeout(() => {
                    loadImage(currentIndex);
                }, 3000); // Adjust delay as needed
            } else {
                setTimeout(() => {
                    currentIndex = (currentIndex + 1) % images.length;
                    loadImage(currentIndex);
                }, 3000); // Adjust delay as needed
            }
        }
    });


    // Load the first image
    loadImage(currentIndex);
}




