import fitz
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss
import pickle
import os
from rank_bm25 import BM25Okapi

#0.Embedding Models and Database Paths
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
FAISS_INDEX_PATH = "models/faiss.index"
CHUNKS_PATH = "models/chunks.pkl"
BM25_PATH = "models/bm25.pkl"

#1.First we Extract the text from the pdf using pymudf(imported as fitz here) and store it in a list.
def extract_text(pdf_path:str) -> str:
    doc = fitz.open(pdf_path)
    all_text = []
    
    for page in doc:
        text = page.get_text()
        all_text.append(text)
    return "\n".join(all_text)

#2.Now we split the text into chunks(Chunking)

def chunk_text(text:str)->list:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size = 500,
        chunk_overlap = 50,
        separators= ["\n\n","\n","."," "]
    )
    chunks = splitter.split_text(text)
    return chunks
    
#3.Embed the text and save it to the Faiss database.

def build_index(chunks:list):
    print("Loading Embedding Model")
    model = SentenceTransformer(EMBEDDING_MODEL)
    
    print("Embedding the chunks standby")
    embeddings = model.encode(chunks,show_progress_bar = True)
    embeddings = np.array(embeddings,dtype = "float32")
    
    #3.1building the FAISS index
    dimension = embeddings.shape[1] #we create a np array which gets all the vectors of a chunk in a straight line and all the chunks as rows(downwards)
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    
    #3.2save the faiss index
    faiss.write_index(index,FAISS_INDEX_PATH)
    
    #3.3save chunks
    with open(CHUNKS_PATH,"wb") as f:
        pickle.dump(chunks,f)
        
    print(f"FAISS index saved - {len(chunks)}chunks indexed")
    
    #3.4 Tokenize and save index for the BM25
    tokenized = [chunk.lower().split() for chunk in chunks]
    bm25 = BM25Okapi(tokenized)
    
    with open(BM25_PATH,"wb") as f:
        pickle.dump(bm25,f)
        
    print("BM25 index saved")
    
    return index,chunks

if __name__ == "__main__":
    text = extract_text("data\physics.pdf")
    chunks = chunk_text(text)
    build_index(chunks)

    