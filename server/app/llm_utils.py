import os
import requests
import logging
from dotenv import load_dotenv
load_dotenv()

from typing import AsyncGenerator

from llama_index import VectorStoreIndex, ServiceContext, Document
from llama_index.readers import SimpleDirectoryReader
from llama_index import ServiceContext, Document

# from llama_index.core import Settings

# from llama_index.core.query_engine import RetrieverQueryEngine
# from llama_index.llms.openai import OpenAI as LlamaOpenAI

# from langchain_community.chat_models import ChatOpenAI

from llama_index.llms.together import TogetherLLM
from llama_index.embeddings.huggingface import HuggingFaceEmbedding

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.callbacks.base import AsyncCallbackHandler
from langchain_core.callbacks.manager import AsyncCallbackManager

from app.database import get_document
from app.pdf_utils import extract_text_from_pdf

# Use the same OpenAI API key
# OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# if not OPENAI_API_KEY:
#     raise EnvironmentError("OPENAI_API_KEY is not set. Please check your .env file or environment variables.")

TOGETHER_API_KEY = os.getenv("TOGETHER_API_KEY")
if not TOGETHER_API_KEY:
    raise EnvironmentError("TOGETHER_API_KEY is not set.")

# Setup a basic in-memory index cache
index_cache = {}

logger = logging.getLogger("pdf-assistant")

# === 1. Build index from PDF text ===
def build_index_from_text(document_id: str, document_text: str):
    logger.info("build_index_from_text called")

    # Only create the embedding model
    embed_model = HuggingFaceEmbedding(model_name="BAAI/bge-small-en")
    logger.info("embedding model created")

    # Create service context with only the embedding model
    service_context = ServiceContext.from_defaults(embed_model=embed_model)
    logger.info("service_context created")

    documents = [Document(text=document_text)]
    index = VectorStoreIndex.from_documents(
        documents,
        service_context=service_context
    )
    logger.info("vector index built")

    index_cache[document_id] = index
    logger.info("vector index cached")
    return index


# === 2. Get top-k context for question ===
def get_context_from_index(document_id: str, question: str) -> str:
    index = index_cache.get(document_id)
    if not index:
        raise ValueError("Index not found for document.")

    retriever = index.as_retriever(similarity_top_k=3)
    context_nodes = retriever.retrieve(question)
    return "\n\n".join([n.get_content() for n in context_nodes])


# === 3. LangChain prompt-based LLM call (non-streaming) ===
def get_answer_once(document_id: str, question: str) -> str:
    # check if index exists in cache
    index = index_cache.get(document_id)
    if not index:
        # Fetch document from database
        doc = get_document(document_id)
        if not doc:
            raise ValueError("Document not found in database.")
        
        # download pdf from cloudinary URL]
        response = requests.get(doc["cloudinary_url"])
        if response.status_code != 200:
            raise ValueError("Failed to download PDF from Cloudinary.")
        
        # extract text from pdf
        text_content = extract_text_from_pdf(response.content)
        
        # vectorize the text and store in cache
        index = build_index_from_text(document_id, text_content)
        index_cache[document_id] = index
    else:
        logger.info('index found in cache')

    # get context
    context = get_context_from_index(document_id, question)

    llm = TogetherLLM(
        api_key=TOGETHER_API_KEY,
        model="mistralai/Mistral-7B-Instruct-v0.1",
        temperature=0.2
    )

    # Build messages
    prompt = f"""
        You are a helpful assistant. Answer the question based on the provided context.

        Context:
        {context}

        Question:
        {question}

        Answer:
        """

    response = llm.complete(prompt)
    return response.text


# === 4. Streaming Handler ===
class MyAsyncHandler(AsyncCallbackHandler):
    def __init__(self):
        self.buffer = ""

    async def on_llm_new_token(self, token: str, **kwargs) -> None:
        self.buffer += token


# === 5. LangChain LLM call (streaming) ===
async def get_answer_stream(document_id: str, question: str) -> AsyncGenerator[str, None]:
    # Check if index exists in cache
    index = index_cache.get(document_id)
    if not index:
        # Fetch document from database
        doc = get_document(document_id)
        if not doc:
            raise ValueError("Document not found in database.")
        
        # Download PDF from Cloudinary URL
        response = requests.get(doc["cloudinary_url"])
        if response.status_code != 200:
            raise ValueError("Failed to download PDF from Cloudinary.")
        
        # Extract text from PDF
        text_content = extract_text_from_pdf(response.content)
        
        # Vectorize the text and store in cache
        index = build_index_from_text(document_id, text_content)
        index_cache[document_id] = index

    # Get context
    context = get_context_from_index(document_id, question)

    # LangChain Streaming
    handler = MyAsyncHandler()
    AsyncCallbackManager([handler])
    llm = TogetherLLM(
        api_key=TOGETHER_API_KEY,
        model="mistralai/Mistral-7B-Instruct-v0.1",
        temperature=0.2
    )

    prompt = f"""
        You are a helpful assistant. Answer the question based on the provided context.

        Context:
        {context}

        Question:
        {question}

        Answer:
        """

    async for chunk in llm.stream_complete(prompt):
        yield chunk.text or ""
