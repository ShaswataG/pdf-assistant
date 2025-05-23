import sqlite3
from datetime import datetime
from typing import Optional, List, Dict

DB_FILE = "documents.db"

def create_tables():
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute("""
            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                filename TEXT NOT NULL,
                upload_date TEXT NOT NULL,
                content TEXT NOT NULL
            )
        """)
        c.execute("""
            CREATE TABLE IF NOT EXISTS chats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                doc_id TEXT NOT NULL,
                user_id TEXT,  -- Optional, for future use
                content TEXT NOT NULL,
                is_user_message BOOLEAN NOT NULL,  -- True for user, False for AI
                timestamp TEXT NOT NULL,
                FOREIGN KEY (doc_id) REFERENCES documents(id)
            )
        """)
        conn.commit()

def add_chat(doc_id: str, user_id: Optional[str], content: str, is_user_message: bool) -> Dict:
    timestamp = datetime.utcnow().isoformat()
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute(
            "INSERT INTO chats (doc_id, user_id, content, is_user_message, timestamp) VALUES (?, ?, ?, ?, ?)",
            (doc_id, user_id, content, is_user_message, timestamp)
        )
        # Get the ID of the newly inserted row
        chat_id = c.lastrowid
        conn.commit()
        # Return the newly inserted chat entry
        return {
            "id": chat_id,
            "doc_id": doc_id,
            "user_id": user_id,
            "content": content,
            "is_user_message": is_user_message,
            "timestamp": timestamp,
        }

def get_chats_by_document(doc_id: str) -> List[Dict]:
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute("SELECT id, doc_id, user_id, content, is_user_message, timestamp FROM chats WHERE doc_id = ?", (doc_id,))
        rows = c.fetchall()
        return [
            {
                "id": row[0],
                "doc_id": row[1],
                "user_id": row[2],
                "content": row[3],
                "is_user_message": bool(row[4]),
                "timestamp": row[5],
            }
            for row in rows
        ]

def add_document(doc_id: str, filename: str, content: str) -> Dict:
    upload_date = datetime.utcnow().isoformat()
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute(
            "INSERT INTO documents (id, filename, upload_date, content) VALUES (?, ?, ?, ?)",
            (doc_id, filename, upload_date, content)
        )
        # Get the ID of the newly inserted row
        doc_id = c.lastrowid
        conn.commit()
        return {
            "id": doc_id,
            "filename": filename,
            "upload_date": upload_date,
            "content": content,
        }

def get_document(doc_id: str) -> Optional[Dict]:
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute("SELECT id, filename, upload_date, content FROM documents WHERE id = ?", (doc_id,))
        row = c.fetchone()
        if row:
            return {
                "id": row[0],
                "filename": row[1],
                "upload_date": row[2],
                "content": row[3]
            }
        return None

def list_documents() -> List[Dict]:
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute("SELECT id, filename, upload_date FROM documents ORDER BY upload_date DESC")
        rows = c.fetchall()
        return [{"id": r[0], "filename": r[1], "upload_date": r[2]} for r in rows]

# Initialize tables on module import
create_tables()
