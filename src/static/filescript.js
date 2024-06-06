// Event listener for creating a new folder
document.getElementById("newFolder").onclick = () => {
    document.getElementById("folderName").value = "";
    document.getElementById("newFolderInput").style.display = "block";
    document.getElementById("folderName").focus();

    document.getElementById("cancel").onclick = () => {
        document.getElementById("newFolderInput").style.display = "none";
    }

    document.getElementById("create").onclick = () => {
        createFolder(document.getElementById("folderName").value);
        document.getElementById("newFolderInput").style.display = "none";
    }
}

// Event listener for viewing uploads
document.getElementById("viewUploads").addEventListener("click", () => {
    document.getElementById("uploadinglist").style.display = "block";

    document.getElementById("close-uploads").addEventListener("click", () => {
        document.getElementById("uploadinglist").style.display = "none";
    })
})

// Function to resolve the current folder
const resolveFolder = () => {
    const currurl = window.location.href;
    return currurl.split("/folder/")[1] === "" ? "root" : currurl.split("/folder/")[1];
}

// Function to load all files
const loadAllFiles = () => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/folder/list-files-folders/" + resolveFolder(), true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({ folderId: resolveFolder() }));

    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            listFiles(JSON.parse(this.response));
        }
    }
}

// Function to list files and folders
const listFiles = (arr) => {
    console.log(arr);
    const foldersDiv = document.getElementById("folders");
    while (foldersDiv.firstChild) {
        foldersDiv.removeChild(foldersDiv.firstChild);
    }
    const filesDiv = document.getElementById("files");
    while (filesDiv.firstChild) {
        filesDiv.removeChild(filesDiv.firstChild);
    }
    for (let i = 0; i < arr["status"].length; i++) {
        createEachElement(arr["status"][i][0], arr["status"][i][1], "folder", arr["status"][i][2]);
    }
}

// Function to create each element (file/folder card)
const createEachElement = (id, name, icon, type) => {
    const ffCardDiv = document.createElement('div');
    ffCardDiv.className = 'ff-card';

    const h3 = document.createElement('h3');
    h3.textContent = name;

    const folderIcon = document.createElement('i');
    folderIcon.className = icon ? `bi bi-${icon}` : 'bi bi-folder';

    const bottomDiv = document.createElement('div');
    bottomDiv.className = 'bottom';

    const archiveIcon = document.createElement('i');
    archiveIcon.className = 'bi bi-archive';
    archiveIcon.addEventListener("click", () => {
        if (type === "file") {
            removeFile(id);
        } else {
            removeFolder(id);
        }
    });

    const streamIcon = document.createElement('i');
    streamIcon.className = 'bi bi-arrow-right';
    streamIcon.addEventListener("click", () => {
        if (type === "file") {
            streamFile(id);
        } else {
            streamFolder(id);
        }
    });

    const penIcon = document.createElement('i');
    penIcon.className = 'bi bi-pen';
    penIcon.addEventListener("click", () => {
        if (type === "file") {
            renameFile(id);
        } else {
            renameFolder(id);
        }
    });

    const downloadIcon = document.createElement('i');
    // infoIcon.className = 'bi bi-info-circle';
    downloadIcon.className = 'bi bi-download';
    downloadIcon.addEventListener("click", () => {
        window.open(`/folder/download-file/${id}`, "_blank")
    });

    const moveIcon = document.createElement('i');
    moveIcon.className = 'bi bi-arrows-move';

    bottomDiv.appendChild(archiveIcon);
    bottomDiv.appendChild(penIcon);
    // bottomDiv.appendChild(moveIcon);
    if (type == "file") {
        bottomDiv.appendChild(downloadIcon);
    }
    bottomDiv.appendChild(streamIcon);

    ffCardDiv.appendChild(h3);
    ffCardDiv.appendChild(folderIcon);
    ffCardDiv.appendChild(bottomDiv);

    ffCardDiv.addEventListener('dblclick', () => {
        if (type === "folder") {
            handleCardClick(id);
        }
    });

    ffCardDiv.addEventListener('click', () => {
        if (type === "folder") {
            getFolderInfo(id);
        } else {
            getFileInfo(id)
        }
    });

    if (type === "folder") {
        document.getElementById("folders").appendChild(ffCardDiv);
    } else {
        document.getElementById("files").appendChild(ffCardDiv);
    }
}

// Function to remove a file
const removeFile = (id) => {
    if (confirm("Are you sure you want to delete the file?")) {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/folder/delete-file", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({ fileId: id }));

        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                loadAllFiles();
            }
        }
    }
}

const getFolderInfo = (id) => {
    console.log(id)
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/folder/folder-info/${id}`, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    // xhr.send(JSON.stringify({ folderId: id }));
    xhr.send()
    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            console.log(JSON.parse(this.responseText))
        }
    }
}

const getFileInfo = (id) => {

}

// Function to remove a file
const removeFolder = (id) => {
    if (confirm("Are you sure you want to delete the folder?")) {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/folder/delete-folder", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.send(JSON.stringify({ folderId: id }));
        xhr.onreadystatechange = function () {
            if (this.readyState === 4 && this.status === 200) {
                loadAllFiles();
            }
        }
    }
}

// Function to handle folder card click
const handleCardClick = (id) => {
    window.location.href = "/folder/" + id;
    console.log('Card with ID:', id, 'was clicked');
}

// Function to rename a folder
const renameFolder = (id) => {
    document.getElementById("renameFolderInput").style.display = "block";
    document.getElementById("renameFolderName").value = "";
    document.getElementById("renameFolderName").focus();

    document.getElementById("renameFolderCancel").onclick = () => {
        document.getElementById("renameFolderInput").style.display = "none";
    }

    document.getElementById("renameFolderSuccess").onclick = () => {
        renameFolderServer(id, document.getElementById("renameFolderName").value);
        document.getElementById("renameFolderInput").style.display = "none";
    }
}

// Function to rename a folder on the server
const renameFolderServer = (id, newName) => {
    if (newName.trim() === "") {
        return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/folder/rename-folder", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({ folderId: id, newName: newName }));

    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            loadAllFiles();
        }
    }
}

// Function to rename a file
const renameFile = (id) => {
    document.getElementById("renameFileName").value = "";
    document.getElementById("renameFileInput").style.display = "block";
    document.getElementById("renameFileName").focus();

    document.getElementById("renameFileCancel").onclick = () => {
        document.getElementById("renameFileInput").style.display = "none";
    }

    document.getElementById("renameFileSuccess").onclick = () => {
        renameFileServer(id, document.getElementById("renameFileName").value);
        document.getElementById("renameFileInput").style.display = "none";
    }
}

// Function to rename a file on the server
const renameFileServer = (id, newName) => {
    if (newName.trim() === "") {
        return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/folder/rename-file", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({ fileId: id, newName: newName }));

    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            loadAllFiles();
        }
    }
}

// Event listener for DOM content loaded to load all files
window.addEventListener("DOMContentLoaded", () => {
    loadAllFiles();
})

const streamFolder = (id) => {
    window.open(`/stream/folder/${id}`, "_blank")
}

const streamFile = (id) => {
    window.open(`/stream/file/${id}`, "_blank")
}

// Function to create a new folder
const createFolder = (folderName) => {
    if (folderName.trim() === "") {
        return;
    }
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/folder/create-folder`, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({ parentFolder: resolveFolder(), childFolder: folderName }));

    xhr.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            loadAllFiles();
        }
    }
}

// Drag and Drop functionality for file uploads
const dropZone = document.getElementById('dropZone');
const fileList = document.getElementById('file_list');

let controllers = [];

dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.style.borderColor = '#333';
});

dropZone.addEventListener('dragleave', (event) => {
    dropZone.style.borderColor = '#ccc';
});

dropZone.addEventListener('drop', async (event) => {
    event.preventDefault();
    dropZone.style.borderColor = '#ccc';
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        for (let file of files) {
            uploadFile(file);
        }
    }
});

// Function to upload files
const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append("parent", resolveFolder());
    formData.append('file', file);

    const fileItem = document.createElement('div');
    fileItem.classList.add('file-item');

    const fileName = document.createElement('span');
    fileName.textContent = file.name;

    const statusText = document.createElement('p');
    statusText.textContent = "Uploading";

    const progressBar = document.createElement('div');
    progressBar.classList.add('progress-bar');

    const progress1 = document.createElement('div');
    progress1.classList.add('progress');
    progress1.classList.add('p1');

    const progress2 = document.createElement('div');
    progress2.classList.add('progress');
    progress2.classList.add('p2');

    const progress3 = document.createElement('div');
    progress3.classList.add('progress');
    progress3.classList.add('p3');

    progressBar.appendChild(progress1);
    progressBar.appendChild(progress2);
    progressBar.appendChild(progress3);

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.classList.add('cancel-button');
    cancelButton.style.display = 'block';

    fileItem.appendChild(fileName);
    fileItem.appendChild(progressBar);
    fileItem.appendChild(statusText);
    fileItem.appendChild(cancelButton);
    fileList.appendChild(fileItem);

    const controller = new AbortController();
    const signal = controller.signal;
    controllers.push(controller);

    cancelButton.addEventListener('click', () => {
        controller.abort();
    });

    try {
        const response = await fetch('/folder/upload-file', {
            method: 'POST',
            body: formData,
            signal,
            headers: {
                'Accept': 'application/json'
            },
        });

        const data = await response.json();
        if (data.message) {
            showError(data.message);
        } else if (data.error) {
            showError(data.error);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            showError('Upload cancelled');
        } else {
            showError('Error:', error);
        }
    } finally {
        progress1.style.width = '100%';
        progress2.style.width = '100%';
        progress3.style.width = '100%';
        progress1.style.animation = "none";
        progress2.style.animation = "none";
        progress3.style.animation = "none";
        statusText.textContent = 'Uploaded';
        cancelButton.style.display = 'none';
        loadAllFiles();
    }
}

// Function to show error messages
const showError = (message) => {
    document.getElementById("bottom-toast").style.display = "flex";
    document.getElementById("toast-message").innerHTML = message;
    document.getElementById("close-bottom-toast").onclick = () => {
        document.getElementById("bottom-toast").style.display = "none";

    }
    setTimeout(() => {
        document.getElementById("bottom-toast").style.display = "none";
    }, 3000)
}
