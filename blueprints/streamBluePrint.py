from flask import Blueprint, redirect, url_for, jsonify, render_template, session, send_file, request
from blueprints.helper.stream import DBHelper
import os

streamBP = Blueprint("stream", __name__)

@streamBP.route('/', methods=['GET', 'POST'])
def home0():
    return redirect(url_for("file.home"))

@streamBP.route('/folder/<id>', methods=['GET', 'POST'])
def fileHome(id):
    if "streamfusemanservs" not in session:
        return redirect(url_for("auth.login"))
    return render_template("stream.html", type="file")

@streamBP.route('/file/<id>', methods=['GET', 'POST'])
def homeFolder(id):
    if "streamfusemanservs" not in session:
        return redirect(url_for("auth.login"))
    return render_template("stream.html", type="folder")

@streamBP.route('/get-file/<fileid>', methods=['GET'])
def getSingleFile(fileid):
    UPLOAD_FOLDER = DBHelper().resolveRootFolder(session["streamfusemanservs"])[0][0]
    sFileName = DBHelper().getFileSName(fileid)
    path = os.getenv("STREAMFUSEROOT") + UPLOAD_FOLDER + "\\" + sFileName
    return send_file(path)

@streamBP.route('/get-all-files', methods=['POST'])
def getFiles():
    owner = session["streamfusemanservs"]
    data = request.get_json()
    print(data)
    x = DBHelper().getFiles(data["type"], data["id"], owner)
    print(x)
    return jsonify(DBHelper().getFiles(data["type"], data["id"], owner))