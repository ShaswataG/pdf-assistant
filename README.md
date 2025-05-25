# PDF Q&A Application (FastAPI + Vite Frontend)

## Overview

This full-stack application allows users to upload PDF documents, extract their text, and ask questions about the content using a large language model (LLM). It supports chat history, document indexing, and LLM response.

---

## Architecture Overview

- **Frontend**: Vite + React + TailwindCSS + **shadcn/ui** for a modern, component-driven UI
- **Backend**: FastAPI for serving REST APIs
- **PDF Storage**: Uploaded PDFs are stored in **Cloudinary**
- **PDF Processing**: Utilizes PyMuPDF (`fitz`) to extract text from uploaded PDFs.
- **Database**: Metadata about PDFs and chat messages are stored in **SQLite**
- **LLM Integration**: `TogetherLLM` used via LlamaIndex for Q&A
- **Vector Indexing**: LlamaIndex’s `VectorStoreIndex` indexes text for contextual search
- **Chat History**: User questions and AI answers are stored and linked to each document
- **CORS**: Configured to allow frontend communication with the backend

---

## Backend Setup Instructions (FastAPI)

### Prerequisites

- Python 3.8+
- [Poetry](https://python-poetry.org/) or `pip` for dependency management
- SQLite
- API key for TogetherAI (`TOGETHER_API_KEY`)
- Cloudinary credentials (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`)

### Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/ShaswataG/pdf-assistant.git
    cd pdf-assistant
    ```
    
2. Navigate to the server directory:
    ```bash
    cd server
    ```

3. Create a virtual environment:
    ```bash
    python -m venv venv
    source venv/bin/activate   # On Windows: .venv\Scripts\Activate.ps1
    ```

4. Install dependencies:
    ```bash
    pip install -r requirements.txt
    ```

5. Create a `.env` file in the `/server` directory with the following:
    ```
    TOGETHER_API_KEY=your_together_ai_api_key_here
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```

6. Run the backend:
    ```bash
    uvicorn app.main:app --reload
    ```

7. API will be available at: [http://localhost:8000](http://localhost:8000)

---

## Frontend Setup Instructions (Vite + React + TailwindCSS + shadcn/ui)

### Prerequisites

- Node.js (v16+ recommended)
- pnpm / yarn / npm

### Installation

1. Navigate to the client directory:
    ```bash
    cd client
    ```

2. Install dependencies:
    ```bash
    npm install
    ```

3. Create a `.env` file in the root of the client directory:
    ```
    VITE_API_URL=http://localhost:8000
    ```

4. Start the development server:
    ```bash
    npm run dev
    ```

5. Frontend will be available at: [http://localhost:5173](http://localhost:5173)

---

## API Documentation

### 1. Get List of Documents

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
### 2. Upload PDF Document

- **Endpoint:** POST /upload

- **Description:** Upload a PDF file. The server extracts text and stores the document.

- **Request:** Multipart/form-data with file field named file. Only PDF files accepted (application/pdf).

- **Response:**

  ```json
  {
    "id": "generated-uuid",
    "filename": "uploaded_file.pdf",
    "upload_date": "2023-01-01T12:00:00Z",
    "cloudinary_url": "https://res.cloudinary.com/..."
  }
  ```
- **Errors:**
400 Bad Request if file is not a PDF or extraction fails.

### 3. Ask a Question About a Document

- **Endpoint:** POST /ask

- **Description:** Submit a question related to a specific document. Returns an AI-generated answer.

- **Request Body:**
  ```json
  {
    "doc_id": "document-uuid",
    "question": "Your question here",
    "stream": false    // Optional boolean, if true returns streaming response
  }
- **Response:**

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

- **Errors:**
404 Not Found if the document ID does not exist.

### 4. Retrieve Chat History for a Document

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
