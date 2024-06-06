import sqlite3
import uuid
import hashlib
import os
from dotenv import load_dotenv

load_dotenv()

class DBHelper:
    def __init__(self):
        self.dbFile = os.getenv("DBFILE")
        self.rootDir = os.getenv("STREAMFUSEROOT")
        
        if not self.dbFile or not self.rootDir:
            raise ValueError("Environment variables DBFILE and STREAMFUSEROOT must be set.")
        
        self.conn = self.__create_connection()
        if self.conn:
            self.__create_table()

    def __create_connection(self):
        try:
            conn = sqlite3.connect(self.dbFile, timeout=10)
            return conn
        except sqlite3.Error as e:
            print(f"Error creating connection to database: {e}")
            return None

    def __create_table(self):
        try:
            sql_create_user_table = """
            CREATE TABLE IF NOT EXISTS user (
                uniqueid TEXT NOT NULL UNIQUE,
                firstname TEXT NOT NULL,
                lastname TEXT NOT NULL,
                username TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                folderid TEXT NOT NULL UNIQUE
            );"""
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(sql_create_user_table)
        except sqlite3.Error as e:
            print(f"Error creating table: {e}")

    def createUser(self, firstname, lastname, username, password):
        try:
            sql = """
            INSERT INTO user (
                uniqueid, 
                firstname, 
                lastname, 
                username,
                password, 
                folderid
            )
            VALUES 
                (?, ?, ?, ?, ?, ?)
            """
            folderid = str(uuid.uuid4())
            uniqueid = str(uuid.uuid4())
            hashed_password = self.hash_password(password)
            
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(sql, (uniqueid, firstname, lastname, username, hashed_password, folderid))
                self.conn.commit()

            os.makedirs(os.path.join(self.rootDir, folderid), exist_ok=True)
            return True
        except sqlite3.IntegrityError as e:
            print(f"Error: Username or folder ID already exists. {e}")
            return False
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return False
        except OSError as e:
            print(f"OS error: {e}")
            return False

    def loginUser(self, username, password):
        try:
            hashed_password = self.hash_password(password)
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute("SELECT * FROM user WHERE username=? AND password=?", (username, hashed_password))
                row = cursor.fetchone()
            return row
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return None

    def changePassword(self, username, oldpassword, newpassword):
        try:
            sql = """
            UPDATE user
            SET password = ?
            WHERE username = ? AND password = ?
            """
            hashed_oldpassword = self.hash_password(oldpassword)
            hashed_newpassword = self.hash_password(newpassword)
            
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute(sql, (hashed_newpassword, username, hashed_oldpassword))
                if cursor.rowcount == 0:
                    print("Old password is incorrect.")
                    return False
                self.conn.commit()
            print("Password updated successfully")
            return True
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return False

    def checkUsername(self, username):
        try:
            with self.conn:
                cursor = self.conn.cursor()
                cursor.execute("SELECT * FROM user WHERE username=?", (username,))
                row = cursor.fetchall()
            return len(row) > 0
        except sqlite3.Error as e:
            print(f"Database error: {e}")
            return False

    def hash_password(self, password):
        return hashlib.sha256(password.encode()).hexdigest()

    def __del__(self):
        if self.conn:
            self.conn.close()
