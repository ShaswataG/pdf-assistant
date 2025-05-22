import os
from dotenv import load_dotenv
load_dotenv()

from typing import AsyncGenerator

from llama_index import VectorStoreIndex, ServiceContext, Document
from llama_index.readers import SimpleDirectoryReader
# from llama_index.core import Settings

# from llama_index.core.query_engine import RetrieverQueryEngine
from llama_index.llms.openai import OpenAI as LlamaOpenAI

from langchain_community.chat_models import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.callbacks.base import AsyncCallbackHandler
from langchain_core.callbacks.manager import AsyncCallbackManager

# Use the same OpenAI API key
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise EnvironmentError("OPENAI_API_KEY is not set. Please check your .env file or environment variables.")

# Setup a basic in-memory index cache
index_cache = {}


# === 1. Build index from PDF text ===
def build_index_from_text(document_id: str, document_text: str):
    # Create index for the text using LlamaIndex
    print('building index')
    service_context = ServiceContext.from_defaults(
        llm=LlamaOpenAI(api_key=OPENAI_API_KEY, model="gpt-3.5-turbo", temperature=0)
    )
    documents = [Document(text=document_text)]
    index = VectorStoreIndex.from_documents(
        documents,
        service_context=service_context
    )
    print('index built')
    index_cache[document_id] = index
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
def get_answer_once(document_id: str, document_text: str, question: str) -> str:
    # Build or retrieve index
    print('get_answer_once')
    print('document_id: ', document_id)
    print('document_text: ', document_text)
    print('question: ', question)
    if document_id not in index_cache:
        print('document_id not in index_cache')
        build_index_from_text(document_id, document_text)
    print('document_id in index_cache')
    # Get context
    context = get_context_from_index(document_id, question)

    # Build messages
    messages = [
        SystemMessage(content="You are a helpful assistant. Use the provided context to answer the question."),
        HumanMessage(content=f"Context:\n{context}\n\nQuestion: {question}")
    ]

    llm = ChatOpenAI(
        model_name="gpt-3.5-turbo",
        temperature=0.2,
        streaming=False
    )
    response = llm(messages)
    return response.content


# === 4. Streaming Handler ===
class MyAsyncHandler(AsyncCallbackHandler):
    def __init__(self):
        self.buffer = ""

    async def on_llm_new_token(self, token: str, **kwargs) -> None:
        self.buffer += token


# === 5. LangChain LLM call (streaming) ===
async def get_answer_stream(document_id: str, document_text: str, question: str) -> AsyncGenerator[str, None]:
    # Build or retrieve index
    print('document_id', document_id)
    if document_id not in index_cache:
        build_index_from_text(document_id, document_text)
    print('index built')
    # Get context
    context = get_context_from_index(document_id, question)
    print('context', context)

    # LangChain Streaming
    handler = MyAsyncHandler()
    manager = AsyncCallbackManager([handler])
    print('manager', manager)
    llm = ChatOpenAI(
        model_name="gpt-3.5-turbo",
        temperature=0.2,
        streaming=True,
        callback_manager=manager
    )

    messages = [
        SystemMessage(content="You are a helpful assistant. Use the provided context to answer the question."),
        HumanMessage(content=f"Context:\n{context}\n\nQuestion: {question}")
    ]

    async for chunk in llm.astream(messages):
        yield chunk.content or ""
