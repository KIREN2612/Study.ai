from fastapi import FastAPI, UploadFile, File,Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel
from contextlib import asynccontextmanager
from app.ingest import extract_text_by_page, chunk_pages, build_index
from app.retrieval import retrieve
from app.llm import generate_answer
from app.corpus import prepare_corpus
from app.database import engine,Base
from app.auth.router import router as auth_router
import shutil
import os

EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Ensure required directories exist on startup
os.makedirs("data", exist_ok=True)
os.makedirs("models", exist_ok=True)

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
    
    #temproary docs
    app.state.user_index = None
    app.state.user_chunks = []
    app.state.user_bm25 = None
    
    yield

app = FastAPI(lifespan=lifespan)
app.include_router(auth_router)  #adds auth

class Query(BaseModel):
    question: str

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
def ask(query: Query,request:Request):
    
    model = request.app.state.model
    global_index = request.app.state.global_index
    global_chunks = request.app.state.global_chunks
    global_bm25 = request.app.state.global_bm25
    
    user_index = request.app.state.user_index
    user_chunks = request.app.state.user_chunks
    user_bm25 = request.app.state.user_bm25
    
    global_results = retrieve(query.question,model,global_index,global_chunks,global_bm25)
    
    user_results = []
    if user_index is  not None:
        user_results = retrieve(
        query.question,
        model,
        user_index,
        user_chunks,
        user_bm25
    )
    
    combined_results = []
    seen = set()
    for chunk in global_results + user_results:
        key = chunk["source"],chunk["chunk_id"]
        if key not in seen:
            seen.add(key)
            combined_results.append(chunk)
    
    answer = generate_answer(query.question, combined_results)
    
    # format sources cleanly for the frontend
    sources = [
        {
            "source": c["source"],
            "chunk_id": c["chunk_id"],
            "page_num" : c.get("page_number","?"),
            "excerpt": c["text"][:150] + "...",
            "full_text":c["text"],
        }
        for c in combined_results[:3]
    ]
    
    return {
        "question": query.question,
        "answer": answer,
        "sources": sources
    }
    
@app.delete("/clear-upload")
def clear_upload(request: Request):
    request.app.state.user_index = None
    request.app.state.user_chunks = []
    request.app.state.user_bm25 = None
    return {
    "message":"Uploaded Documents are deleted"
    }

app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
def serve():
    return FileResponse("frontend/index.html")