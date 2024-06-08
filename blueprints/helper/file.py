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
        self.__create_table()

    def __create_connection(self):
        try:
            conn = sqlite3.connect(self.dbFile, timeout=10)
            return conn
        except Error as e:
            print(e)
            return None

    def __create_table(self):
        try:
            table0 = """
            CREATE TABLE IF NOT EXISTS folder (
                folderid TEXT NOT NULL UNIQUE,
                foldername TEXT NOT NULL,
                parentid TEXT NOT NULL,
                owner TEXT NOT NULL,
                PRIMARY KEY (parentid, foldername, owner)
            );"""
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(table0)
            
            table1 = """
            CREATE TABLE IF NOT EXISTS file (
                fileid TEXT NOT NULL UNIQUE,
                parentid TEXT NOT NULL,
                filename TEXT NOT NULL,
                filesname TEXT NOT NULL,
                size TEXT NOT NULL,
                uploadedon TEXT NOT NULL,
                tags TEXT,
                extension TEXT NOT NULL,
                hashsha TEXT NOT NULL UNIQUE,
                owner TEXT NOT NULL,
                PRIMARY KEY (parentid, filename, owner)
            );"""
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(table1)
        except Error as e:
            print(e)

    def generateUniq(self):
        return str(uuid.uuid4()).replace("-", "")

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

    def createFolder(self, parent, child, owner):
        try:
            sql = """INSERT INTO folder (folderid, foldername, parentid, owner) VALUES (?, ?, ?, ?)"""
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(sql, (self.generateUniq(), child, parent, owner))
                self.conn.commit()
            return True
        except Error as e:
            print(e)
            return False

    def createFile(self, parentid, filename, filesname, size, tags, extension, hashsha, owner):
        try:
            sql = """
            INSERT INTO file (
                fileid, 
                parentid, 
                filename,
                filesname,
                size,
                uploadedon,
                tags,
                extension,
                hashsha,
                owner
            )
            VALUES 
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(sql, (
                    self.generateUniq(), 
                    parentid,
                    filename,
                    filesname,
                    size, 
                    datetime.datetime.now(),
                    tags,
                    extension,
                    hashsha,
                    owner
                ))
                self.conn.commit()
            return True
        except Error as e:
            print(e)
            return False
        
    def getAllFilesAndFolders(self, folderid, owner):
        try:
            res = []
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute("SELECT folderid, foldername FROM folder WHERE parentid=? AND owner=?", (folderid, owner))
                row = cursor.fetchall()
            for each in row:
                res.append((each[0], each[1], "folder"))
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute("SELECT fileid, filename FROM file WHERE parentid=? AND owner=?", (folderid, owner))
                row = cursor.fetchall()
            for each in row:
                res.append((each[0], each[1], "file"))
            return res
        except Error as e:
            print(e)
            return False
    
    def renameFolder(self, folderid, foldername, owner):
        try:
            sql = """UPDATE folder SET foldername=? WHERE folderid=? AND owner=?"""
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(sql, (foldername, folderid, owner))
                self.conn.commit()
            print("Folder Name Updated")
            return True
        except Error as e:
            print(e)
            return False
    
    def renameFile(self, fileid, filename, owner):
        try:
            sql = """UPDATE file SET filename=? WHERE fileid=? AND owner=?"""
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(sql, (filename, fileid, owner))
                self.conn.commit()
            print("File Name Updated")
            return True
        except Error as e:
            print(e)
            return False
    
    def deleteFile(self, fileid, owner):
        try:
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute("SELECT filesname FROM file WHERE fileid=? AND owner=?", (fileid, owner))
                row = cursor.fetchall()
                row = row[0][0]
            sql = """DELETE from file WHERE fileid=? AND owner=?"""
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(sql, (fileid, owner))
                self.conn.commit()
            return row
        except Error as e:
            print(e)
            return False
    
    def getFileInformation(self, fileid, owner):
        try:
            sql = """
            SELECT * FROM file WHERE fileid=? AND owner=?
            """
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(sql, (fileid, owner))
                row = cursor.fetchone()
                if row:
                    return {
                        "fileid": row[0],
                        "parentid": row[1],
                        "filename": row[2],
                        "filesname": row[3],
                        "size": row[4],
                        "uploadedon": row[5],
                        "tags": row[6],
                        "extension": row[7],
                        "hashsha": row[8],
                        "owner": row[9]
                    }
                else:
                    return None
        except Error as e:
            print(e)
            return None
    
    def getFolderInformation(self, folderid, owner):
        try:
            sql = """
            SELECT * FROM folder WHERE folderid=? AND owner=?
            """
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(sql, (folderid, owner))
                row = cursor.fetchone()
                if row:
                    return {
                        "folderid": row[0],
                        "foldername": row[1],
                        "parentid": row[2],
                        "owner": row[3]
                    }
                else:
                    return None
        except Error as e:
            print(e)
            return None

    def recursiveDeleteFolder(self, folderid, owner):
        try:
            sql = "SELECT folderid FROM folder WHERE parentid=? AND owner=?"
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(sql, (folderid, owner))
                subfolders = cursor.fetchall()
            for subfolder in subfolders:
                self.recursiveDeleteFolder(subfolder[0], owner)
            
            sql = "DELETE FROM file WHERE parentid=? AND owner=?"
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(sql, (folderid, owner))
            
            sql = "DELETE FROM folder WHERE folderid=? AND owner=?"
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(sql, (folderid, owner))
            
            self.conn.commit()
            return True
        except Error as e:
            print(e)
            return False
