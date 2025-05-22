import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database import add_document, get_document
from app.pdf_utils import extract_text_from_pdf
from app.llm_utils import get_answer_once, get_answer_stream

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:3000",
    # add other origins you want to allow
]

app.add_middleware(
    CORSMiddleware,
    # allow_origins=origins,         # or ["*"] to allow all origins (not recommended for production)
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],           # allow all methods like GET, POST, etc.
    allow_headers=["*"],           # allow all headers
)

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    file_bytes = await file.read()
    text_content = extract_text_from_pdf(file_bytes)
    if not text_content.strip():
        raise HTTPException(status_code=400, detail="Failed to extract text from PDF.")
    
    doc_id = str(uuid.uuid4())
    add_document(doc_id, file.filename, text_content)
    return {"doc_id": doc_id, "filename": file.filename}

@app.post("/ask")
async def ask_question(request: Request):
    body = await request.json()
    doc_id = body.get("doc_id")
    question = body.get("question")
    stream = body.get("stream", False)
    doc = get_document(doc_id)
    print('doc', doc)
    if not doc:
        print('doc not found')
        raise HTTPException(status_code=404, detail="Document not found")

    if stream:
        print('stream', stream)
        async def token_generator():
            async for chunk in get_answer_stream(doc_id, doc["content"], question):
                yield chunk
        return StreamingResponse(token_generator(), media_type="text/plain")
    else:
        print('stream not found')
        answer = get_answer_once(doc_id, doc["content"], question)
        return {"answer": answer}
