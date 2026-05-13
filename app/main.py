from fastapi import FastAPI, UploadFile, File,Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sentence_transformers import SentenceTransformer
from pydantic import BaseModel
from contextlib import asynccontextmanager
from app.ingest import extract_text, chunk_text, build_index
from app.retrieval import retrieve
from app.llm import generate_answer
import shutil
import faiss
import os

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
FAISS_INDEX_PATH = "models/faiss.index"

# Ensure required directories exist on startup
os.makedirs("data", exist_ok=True)
os.makedirs("models", exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("RAG Assistant ready to rock and roll")
    app.state.model = SentenceTransformer(EMBEDDING_MODEL)
    print("Model loaded")
    
    if os.path.exists(FAISS_INDEX_PATH):
        app.state.index = faiss.read_index(FAISS_INDEX_PATH)
        print("faiss index loaded")
    else:
        app.state.index = None
        print("No Index file found")
    yield

app = FastAPI(lifespan=lifespan)

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

    text = extract_text(pdf_path)
    chunks = chunk_text(text)
    build_index(chunks)
    
    request.app.state.index = faiss.read_index(FAISS_INDEX_PATH)

    # Fixed: was f"Indexed len{chunks}..." — should be len(chunks)
    return {"message": f"Indexed {len(chunks)} chunks from {file.filename}"}

@app.post("/ask")
def ask(query: Query,request:Request):
    
    model = request.app.state.model
    index = request.app.state.index
    
    if index is None:
        return {"error":"No pdf uploaded yet,please upload a pdf"}
    
    
    chunks = retrieve(query.question,model,index)
    answer = generate_answer(query.question, chunks)
    return {
        "question": query.question,
        "answer": answer,
        "sources": chunks[:2]
    }

app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
def serve():
    return FileResponse("frontend/index.html")