from fastapi import FastAPI, UploadFile, File,Request,Depends
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel
from contextlib import asynccontextmanager
from app.ingest import extract_text_by_page, chunk_pages, build_index
from app.retrieval import retrieve
from app.llm import generate_answer
from app.corpus import prepare_corpus
from app.database import engine,Base
from app.auth.router import router as auth_router
from app.documents.router import router as documents_router
from app.reranker import rerank
from app.dependencies import get_current_user
from app.auth.models import User
from app.database import get_db
from app.flashcards.router import router as flashcard_router
from sqlalchemy.orm import Session
from app.websearch import web_search
from fastapi.middleware.cors import CORSMiddleware
import shutil
import faiss
import pickle
import os

EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Ensure required directories exist on startup
os.makedirs("data", exist_ok=True)
os.makedirs("models", exist_ok=True)
os.makedirs("indices", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine) #creates tables if not already exists
    print("RAG Assistant ready to rock and roll")
    app.state.model = SentenceTransformer(EMBEDDING_MODEL)
    print("Model loaded")
    
    index,chunks,bm25 = prepare_corpus(app.state.model)
    app.state.global_index = index
    app.state.global_chunks = chunks
    app.state.global_bm25 = bm25
    
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)  #adds auth
app.include_router(documents_router) #adds multiple documents from users.
app.include_router(flashcard_router) #adds flashcards

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    question: str
    web_search:bool = False #false by default
    search_mode :str = "both" #corpus,user_docs,both

@app.get("/health")
def get_health():
    return {"status": "ok"}

@app.post("/upload")
async def upload_pdf(request:Request,file: UploadFile = File(...)):
    pdf_path = f"data/{file.filename}"
    with open(pdf_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    pages = extract_text_by_page(pdf_path)
    chunk_dicts = chunk_pages(pages)
    
    user_index,user_chunks,user_bm25 = build_index(
        chunk_dicts,
        request.app.state.model,
        source_name = file.filename
    )
    request.app.state.user_index = user_index
    request.app.state.user_chunks = user_chunks
    request.app.state.user_bm25 = user_bm25

    # Fixed: was f"Indexed len{chunks}..." — should be len(chunks)
    return {"message": f"Indexed {len(chunk_dicts)} chunks from {file.filename}"}

@app.post("/ask")
def ask(
    query: Query,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    model = request.app.state.model
    global_index = request.app.state.global_index
    global_chunks = request.app.state.global_chunks
    global_bm25 = request.app.state.global_bm25

    # corpus retrieval
    global_results = []
    if query.search_mode in ("corpus", "both"):
        global_results = retrieve(query.question, model, global_index, global_chunks, global_bm25)

    # per-user disk-based retrieval
    user_results = []
    if query.search_mode in ("user_docs", "both"):
        user_dir = f"indices/{current_user.id}"
        if os.path.exists(user_dir):
            index_files = [f for f in os.listdir(user_dir) if f.endswith(".index")]
            for index_file in index_files:
                doc_id = index_file.replace(".index", "")
                index_path = f"{user_dir}/{doc_id}.index"
                chunks_path = f"{user_dir}/{doc_id}_chunks.pkl"
                bm25_path = f"{user_dir}/{doc_id}_bm25.pkl"
                if not all(os.path.exists(p) for p in [index_path, chunks_path, bm25_path]):
                    continue
                doc_index = faiss.read_index(index_path)
                with open(chunks_path, "rb") as f:
                    doc_chunks = pickle.load(f)
                with open(bm25_path, "rb") as f:
                    doc_bm25 = pickle.load(f)
                results = retrieve(query.question, model, doc_index, doc_chunks, doc_bm25)
                user_results.extend(results)

    # web search
    web_results = []
    if query.web_search:
        web_results = web_search(query.question)

    # deduplicate
    combined_results = []
    seen = set()
    for chunk in global_results + user_results:
        key = (chunk["source"], chunk["chunk_id"])
        if key not in seen:
            seen.add(key)
            combined_results.append(chunk)

    combined_results = combined_results + web_results
    combined_results = rerank(query.question, combined_results, top_k=5)

    answer = generate_answer(query.question, combined_results)

    sources = [
        {
            "source": c["source"],
            "chunk_id": c["chunk_id"],
            "page_num": c.get("page_number", "?"),
            "excerpt": c["text"][:150] + "...",
            "full_text": c["text"],
        }
        for c in combined_results[:3]
    ]

    return {
        "question": query.question,
        "answer": answer,
        "sources": sources,
    }
    
@app.delete("/clear-upload")
def clear_upload(request: Request):
    request.app.state.user_index = None
    request.app.state.user_chunks = []
    request.app.state.user_bm25 = None
    return {
    "message":"Uploaded Documents are deleted"
    }
