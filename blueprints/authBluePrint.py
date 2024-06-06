from flask import Blueprint, request, render_template, redirect, url_for, session
from blueprints.helper.auth import DBHelper

authBP = Blueprint("auth", __name__)

@authBP.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method=="POST":
        username = request.form['username']
        password = request.form['password']
        if (DBHelper().loginUser(username, password)):
            session["streamfusemanservs"] = username
            return redirect(url_for("file.home"))
        else:
            return render_template("login.html", e=error) 
    elif request.method=="GET":
        if "streamfusemanservs" in session:
            return redirect(url_for("file.home"))
        return render_template("login.html", e=error)

@authBP.route('/create-account', methods=['GET', 'POST'])
def signup():
    error = None
    if request.method=="POST":
        fname = request.form['fname']
        lname = request.form['lname']
        username = request.form['username']
        password = request.form['password']    
        if (DBHelper().createUser(fname, lname, username, password)):
            return redirect(url_for("auth.login"))
        else:
            return render_template("signup.html", e=error) 
    elif request.method=="GET":
        if "streamfusemanservs" in session:
            return redirect(url_for("file.home"))
        return render_template("signup.html", e=error)

@authBP.route('/logout', methods=["POST"])
def logout():
    session.pop("streamfusemanservs", None)
    return redirect(url_for("auth.login")) 
