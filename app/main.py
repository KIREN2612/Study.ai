from fastapi import FastAPI,UploadFile,File
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager
from app.ingest import extract_text,chunk_text,build_index
from app.retrieval import retrieve
from app.llm import generate_answer
import shutil
import os

@asynccontextmanager
async def lifespan(app:FastAPI):
    print("RAG Assistant ready to rock and roll")
    yield
    
app = FastAPI(lifespan = lifespan)

class Query(BaseModel):
    question:str
    
@app.get("/health")
def get_health():
    return {"status":"ok"}

@app.post("/upload")
async def upload_pdf(file:UploadFile = File(...)):
    pdf_path = f"data/{file.filename}"
    with open(pdf_path,"wb") as f:
        shutil.copyfileobj(file.file,f)
        
    text = extract_text(pdf_path)
    chunks = chunk_text(text)
    build_index(chunks)
    
    return {"Message":f"Indexed len{chunks} chunks from {file.filename}"}

@app.post("/ask")
def ask(query: Query):
    chunks = retrieve(query.question)
    answer = generate_answer(query.question,chunks)
    return {
        "question":query.question,
        "answer" : answer,
        "sources":chunks[:2]
    }
    
app.mount("/static",StaticFiles(directory="frontend"),name="static")

@app.get("/")
def serve():
    return FileResponse("frontend/index.html")