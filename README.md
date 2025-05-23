# PDF Q&A FastAPI Application

## Overview

This application provides a backend API for uploading PDF documents, extracting their text, storing them in a database, and enabling users to ask questions about the content of these PDFs using a large language model (LLM). The app supports both non-streaming and streaming responses from the LLM and maintains a chat history for each document.

---

## Architecture Overview

- **FastAPI**: Serves as the web framework handling API endpoints.
- **SQLite**: Used as the database to store documents and chat messages.
- **PDF Processing**: Utilizes PyMuPDF (`fitz`) to extract text from uploaded PDFs.
- **LLM Integration**: Uses the `TogetherLLM` model via LlamaIndex for answering questions.
- **Indexing**: Each document's text is indexed using LlamaIndex’s `VectorStoreIndex` for fast retrieval of relevant context.
- **Chat History**: User questions and AI answers are stored in the database and retrievable by document.
- **CORS Middleware**: Allows cross-origin requests from specific frontend origins.

---

## Setup Instructions

### Prerequisites

- Python 3.8+
- [Poetry](https://python-poetry.org/) or `pip` for dependency management
- SQLite (comes bundled with Python)
- API key for TogetherAI (`TOGETHER_API_KEY`)

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/ShaswataG/pdf-assistant.git
    cd pdf-assistant
    ```

2. Create and activate a virtual environment (optional but recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate   # On Windows(powershell): .venv\Scripts\Activate.ps1
    ```

3. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

4. Create a `.env` file in the directory "/server" and add your TogetherAI API key:
    ```
    TOGETHER_API_KEY=your_together_ai_api_key_here
    ```

5. (Optional) Ensure `documents.db` SQLite database is created automatically on first run (handled by the app).

### Running the Application

```bash
uvicorn app.main:app --reload
```


## The API will be available at: http://localhost:8000

# API Documentation

## 1. Get List of Documents

- **Endpoint:** `GET /documents`
- **Description:** Returns a list of all uploaded documents with metadata.
- **Response:**
  ```json
  {
    "documents": [
      {
        "id": "document-uuid",
        "filename": "example.pdf",
        "upload_date": "2023-01-01T12:00:00Z"
      },
      ...
    ]
  }
  ```
## 2. Upload PDF Document

- **Endpoint:** POST /upload

- **Description:** Upload a PDF file. The server extracts text and stores the document.

- **Request:** Multipart/form-data with file field named file. Only PDF files accepted (application/pdf).

- **Response:**

  ```json
  {
    "id": "generated-uuid",
    "filename": "uploaded_file.pdf",
    "upload_date": "2023-01-01T12:00:00Z",
    "content": "Extracted text content from the PDF..."
  }
  ```
- **Errors:**
400 Bad Request if file is not a PDF or extraction fails.

## 3. Ask a Question About a Document

- **Endpoint:** POST /ask

- **Description:** Submit a question related to a specific document. Returns an AI-generated answer.

- **Request Body:**
  ```json
  {
    "doc_id": "document-uuid",
    "question": "Your question here",
    "stream": false    // Optional boolean, if true returns streaming response
  }
- **Response (Non-Streaming):**

  ```json
  {
    "answer": "The AI's answer to your question.",
    "user_chat": {
      "id": 1,
      "doc_id": "document-uuid",
      "user_id": null,
      "content": "Your question here",
      "is_user_message": true,
      "timestamp": "2023-01-01T12:00:00Z"
    },
    "ai_chat": {
      "id": 2,
      "doc_id": "document-uuid",
      "user_id": null,
      "content": "The AI's answer to your question.",
      "is_user_message": false,
      "timestamp": "2023-01-01T12:00:05Z"
    }
  }
  ```
- **Response (Streaming):**
Returns a stream of text chunks as the AI generates the answer.

- **Errors:**
404 Not Found if the document ID does not exist.

## 4. Retrieve Chat History for a Document

- **Endpoint:** GET /chats/{doc_id}

- **Description:** Fetch all chat messages (questions and answers) related to a specific document.

- **Response:**

  ```json
  {
    "chats": [
      {
        "id": 1,
        "doc_id": "document-uuid",
        "user_id": null,
        "content": "User question here",
        "is_user_message": true,
        "timestamp": "2023-01-01T12:00:00Z"
      },
      {
        "id": 2,
        "doc_id": "document-uuid",
        "user_id": null,
        "content": "AI answer here",
        "is_user_message": false,
        "timestamp": "2023-01-01T12:00:05Z"
      },
      ...
    ]
  }
  ```

## Notes
- All timestamps are in UTC and ISO 8601 format.

- The stream parameter in /ask is optional; by default, responses are non-streaming.

- Uploaded PDFs are stored with a unique UUID.

- The chat history includes both user messages and AI responses.

- CORS is enabled for specified frontend origins (update as needed).
