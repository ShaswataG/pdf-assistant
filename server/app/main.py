import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database import add_document, get_document, list_documents, add_chat, get_chats_by_document
from app.pdf_utils import extract_text_from_pdf
from app.llm_utils import get_answer_once, get_answer_stream, build_index_from_text
import uuid
import cloudinary.uploader
from datetime import datetime
import logging

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://shaswatag.github.io",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Set the log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",  # Log format
    handlers=[
        logging.StreamHandler(),  # Log to console
        logging.FileHandler("app.log")  # Log to a file
    ]
)

logger = logging.getLogger("pdf-assistant")

@app.get("/")
async def root():
    logger.info("Root endpoint was accessed.")
    return {"message": "Hello, World!"}

@app.get("/documents")
async def getDocuments():
    documents = list_documents()
    return {"documents": documents}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    file_bytes = await file.read()

    # Upload to Cloudinary in specific folder with timestamp in filename
    try:
        original_filename = file.filename.rsplit(".", 1)[0]  # strip .pdf extension
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        public_id = f"{original_filename}_{timestamp}.pdf"

        upload_result = cloudinary.uploader.upload(
            file_bytes,
            resource_type="raw",
            folder="pdf-assistant/documents",
            public_id=public_id
        )
        cloudinary_url = upload_result["secure_url"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cloudinary upload failed: {str(e)}")

    # Extract text
    try:
        text_content = extract_text_from_pdf(file_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF text extraction failed: {str(e)}")
    
    if not text_content.strip():
        raise HTTPException(status_code=400, detail="Failed to extract text from PDF.")
    
    # Vectorize
    doc_id = str(uuid.uuid4())
    try:
        build_index_from_text(doc_id, text_content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vectorization failed: {str(e)}")
    
    new_document = add_document(doc_id, file.filename, cloudinary_url)
    return {
        "id": doc_id,
        "filename": file.filename,
        "upload_date": new_document["upload_date"],
        "cloudinary_url": cloudinary_url
    }

@app.post("/ask")
async def ask_question(request: Request):
    body = await request.json()
    doc_id = body.get("doc_id")
    question = body.get("question")
    stream = body.get("stream", False)

    doc = get_document(doc_id)
    # print('doc', doc)
    if not doc:
        # print('doc not found')
        raise HTTPException(status_code=404, detail="Document not found")

    # Store the user's question and get the inserted chat entry
    user_chat = add_chat(doc_id, None, question, is_user_message=True)

    if stream:
        # print('stream', stream)
        async def token_generator():
            async for chunk in get_answer_stream(doc_id, question):
                yield chunk
        return StreamingResponse(token_generator(), media_type="text/plain")
    else:
        # print('stream not found')
        answer = get_answer_once(doc_id, question)
        # Store the AI's response and get the inserted chat entry
        ai_chat = add_chat(doc_id, None, answer, is_user_message=False)
        return {"answer": answer, "user_chat": user_chat, "ai_chat": ai_chat}

@app.get("/chats/{doc_id}")
async def get_chats(doc_id: str):
    chats = get_chats_by_document(doc_id)
    return {"chats": chats}