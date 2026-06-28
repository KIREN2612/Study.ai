from fastapi import FastAPI, Request, Depends
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel
from contextlib import asynccontextmanager
from app.retrieval import retrieve
from app.llm import generate_answer
from app.database import engine, Base, get_db
from app.auth.router import router as auth_router
from app.documents.router import router as documents_router
from app.flashcards.router import router as flashcard_router
from app.flashcards.models import FlashCard
from app.reranker import rerank
from app.dependencies import get_current_user
from app.auth.models import User
from app.websearch import web_search
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import faiss
import pickle
import os

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

os.makedirs("data", exist_ok=True)
os.makedirs("models", exist_ok=True)
os.makedirs("indices", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    print("RAG Assistant ready to rock and roll")
    app.state.model = SentenceTransformer(EMBEDDING_MODEL)
    print("Study.ai-upload a pdf to get started")
    yield

app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(auth_router)
app.include_router(documents_router)
app.include_router(flashcard_router)

class Query(BaseModel):
    question: str
    web_search: bool = False

@app.get("/health")
def get_health():
    return {"status": "ok"}

@app.post("/ask")
def ask(
    query: Query,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    model = request.app.state.model

    user_results = []
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

    web_results = []
    if query.web_search:
        web_results = web_search(query.question)

    combined_results = user_results + web_results

    if not combined_results:
        return {
            "question": query.question,
            "answer": "No results found. Upload a PDF or enable web search.",
            "sources": []
        }

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