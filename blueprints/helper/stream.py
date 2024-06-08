import sqlite3
from sqlite3 import Error
import uuid
import hashlib
import os
import datetime
from dotenv import load_dotenv

load_dotenv()

class DBHelper:
    def __init__(self):
        self.dbFile = os.getenv("DBFILE")
        self.conn = self.__create_connection()

    def __create_connection(self):
        try:
            conn = sqlite3.connect(self.dbFile, timeout=10)
            return conn
        except Error as e:
            print(e)
            return None
        
    def resolveRootFolder(self, username):
        try:
            sql = """SELECT folderid FROM user WHERE username=?"""
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(sql, (username,))
                row = cursor.fetchall()
                print(row)
            return row
        except Error as e:
            print(e)
            return False

    def generateUniq(self):
        return str(uuid.uuid4()).replace("-", "")
    
    def getFileSName(self, fileid):
        try:
            sql = """SELECT filesname from file where fileid=?"""
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(sql, (fileid,))
                row = cursor.fetchall()
            x = row[0][0]
            return x
        except Error as e:
            print(e)
            return False
    
    def getFiles(self, type, id, owner):
        try:
            if type=="folder":
                if type=="audio":
                    sql = """SELECT fileid, filename from file where parentid=? AND owner=? AND filesname like '%.mp3' UNION
                    SELECT fileid, filename from file where parentid=? AND owner=? AND filesname like '%.wav' UNION
                    SELECT fileid, filename from file where parentid=? AND owner=? AND filesname like '%.m4a'"""
                elif type=="video":
                    sql = """SELECT fileid, filename from file where parentid=? AND owner=? AND filesname like '%.mp4' UNION
                    SELECT fileid, filename from file where parentid=? AND owner=? AND filesname like '%.avi' UNION
                    SELECT fileid, filename from file where parentid=? AND owner=? AND filesname like '%.mkv'"""
                elif type=="image":
                    sql = """SELECT fileid, filename from file where parentid=? AND owner=? AND filesname like '%.jpg' UNION
                    SELECT fileid, filename from file where parentid=? AND owner=? AND filesname like '%.png' UNION
                    SELECT fileid, filename from file where parentid=? AND owner=? AND filesname like '%.gif'""" 
                else :
                    sql = """SELECT fileid, filename from file where parentid=? AND owner=?"""
                with self.conn:
                    cursor = self.conn.cursor()
                    cursor.execute(sql, (id, owner,))
                    row = cursor.fetchall()
                    print(row)

                x = [{"title": each[1], "url": f"/stream/get-file/{each[0]}"} for each in row]
                print(x)
                return x
            if type=="file":
                return [id]
        except Error as e:
            print(e)
            return False