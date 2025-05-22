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
        conn.commit()

def add_document(doc_id: str, filename: str, content: str) -> None:
    upload_date = datetime.utcnow().isoformat()
    with sqlite3.connect(DB_FILE) as conn:
        c = conn.cursor()
        c.execute(
            "INSERT INTO documents (id, filename, upload_date, content) VALUES (?, ?, ?, ?)",
            (doc_id, filename, upload_date, content)
        )
        conn.commit()

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
