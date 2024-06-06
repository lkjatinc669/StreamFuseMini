import hashlib
from flask import Blueprint, redirect, url_for, jsonify, session, request, render_template, send_file
from blueprints.helper.file import DBHelper
from werkzeug.utils import secure_filename
import datetime, uuid
import os

fileBP = Blueprint("file", __name__)

@fileBP.route('/<id>', methods=['GET', 'POST'])
def home1(id):
    if "streamfusemanservs" not in session:
        return redirect(url_for("auth.login"))
    return render_template("file.html")

@fileBP.route('/', methods=['GET', 'POST'])
def home():
    if "streamfusemanservs" not in session:
        return redirect(url_for("auth.login"))
    return render_template("file.html")

@fileBP.route('/create-folder', methods=['POST'])
def createFolder():
    if "streamfusemanservs" not in session:
        return redirect(url_for("auth.login"))
    data = request.get_json()
    owner = session["streamfusemanservs"]
    result = DBHelper().createFolder(data["parentFolder"], data["childFolder"], owner)
    return jsonify({"status": result})

@fileBP.route('/upload-file', methods=['POST'])
def uploadFile():
    if "streamfusemanservs" not in session:
        return redirect(url_for("auth.login"))

    UPLOAD_FOLDER = DBHelper().resolveRootFolder(session["streamfusemanservs"])[0][0]
    
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    
    files = request.files.getlist('file')
    parent = request.form["parent"]
    owner = session["streamfusemanservs"]

    for file in files:
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
        
        filename = secure_filename(file.filename)
        extension = filename.split(".")[-1]
        newFName = f"""{datetime.datetime.now().strftime("%d%m%Y_%H%M%S")}_{str(uuid.uuid4()).replace("-", "")}.{extension}"""
        path = os.getenv("STREAMFUSEROOT") + UPLOAD_FOLDER + "\\" + newFName
        
        file.save(path)
        size = os.path.getsize(path)

        sha256_hash = hashlib.sha256()
        with open(path, "rb") as f:
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)
        hashsha = sha256_hash.hexdigest()

        x = DBHelper().createFile(parent, filename, newFName, size, "", extension, hashsha, owner)
        if x:
            return jsonify({'message': 'Files uploaded successfully'}), 200
        os.remove(path)
        return jsonify({'message': 'File with Same name Already Exists'}), 400

@fileBP.route('/list-files-folders/<id>', methods=['POST'])
def returnAllFilesandFolders(id):
    if "streamfusemanservs" not in session:
        return redirect(url_for("auth.login"))
    owner = session["streamfusemanservs"]
    files_and_folders = DBHelper().getAllFilesAndFolders(id, owner)
    return jsonify({"status": files_and_folders})

@fileBP.route('/rename-folder', methods=['POST'])
def renameFolder():
    if "streamfusemanservs" not in session:
        return redirect(url_for("auth.login"))
    data = request.get_json()
    owner = session["streamfusemanservs"]
    result = DBHelper().renameFolder(data["folderId"], data["newName"], owner)
    return jsonify({"status": result})

@fileBP.route('/rename-file', methods=['POST'])
def renameFile():
    if "streamfusemanservs" not in session:
        return redirect(url_for("auth.login"))
    data = request.get_json()
    owner = session["streamfusemanservs"]
    result = DBHelper().renameFile(data["fileId"], data["newName"], owner)
    return jsonify({"status": result})

@fileBP.route('/delete-file', methods=['POST'])
def deleteFile():
    if "streamfusemanservs" not in session:
        return redirect(url_for("auth.login"))
    UPLOAD_FOLDER = DBHelper().resolveRootFolder(session["streamfusemanservs"])[0][0]
    data = request.get_json()
    owner = session["streamfusemanservs"]
    newFName = DBHelper().deleteFile(data["fileId"], owner)
    if newFName:
        path = os.getenv("STREAMFUSEROOT") + UPLOAD_FOLDER + "\\" + newFName
        os.remove(path)
        return jsonify({"message": "File Deleted Successfully"}), 200
    return jsonify({"error": "File deletion failed"}), 400

@fileBP.route('/delete-folder', methods=['POST'])
def deleteFolder():
    if "streamfusemanservs" not in session:
        return redirect(url_for("auth.login"))
    data = request.get_json()
    owner = session["streamfusemanservs"]
    result = DBHelper().recursiveDeleteFolder(data["folderId"], owner)
    if result:
        return jsonify({"message": "Folder Deleted Successfully"}), 200
    return jsonify({"error": "Folder deletion failed"}), 400

@fileBP.route('/download-file/<file_id>', methods=['GET'])
def downloadFile(file_id):
    if "streamfusemanservs" not in session:
        return jsonify({"status": "error", "message": "User not authenticated."}), 401
    
    owner = session["streamfusemanservs"]
    file_info = DBHelper().getFileInformation(file_id, owner)
    if not file_info:
        return jsonify({"status": "error", "message": "File not found."}), 404

    UPLOAD_FOLDER = DBHelper().resolveRootFolder(owner)[0][0]
    file_path = os.path.join(os.getenv("STREAMFUSEROOT"), UPLOAD_FOLDER, file_info["filesname"])
    
    if not os.path.exists(file_path):
        return jsonify({"status": "error", "message": "File not found on the server."}), 404
    
    return send_file(file_path, as_attachment=True, download_name=file_info["filename"])

@fileBP.route('/folder-info/<folder_id>', methods=['POST'])
def getFolderInfo(folder_id):
    if "streamfusemanservs" not in session:
        return jsonify({"status": "error", "message": "User not authenticated."}), 401

    owner = session["streamfusemanservs"]
    folder_info = DBHelper().getFolderInformation(folder_id, owner)
    if folder_info:
        return jsonify({"status": "success", "folder_info": folder_info})
    else:
        return jsonify({"status": "error", "message": "Folder not found."}), 404

@fileBP.route('/file-info/<file_id>', methods=['POST'])
def getFileInfo(file_id):
    if "streamfusemanservs" not in session:
        return jsonify({"status": "error", "message": "User not authenticated."}), 401

    owner = session["streamfusemanservs"]
    file_info = DBHelper().getFileInformation(file_id, owner)
    if file_info:
        return jsonify({"status": "success", "file_info": file_info})
    else:
        return jsonify({"status": "error", "message": "File not found."}), 404