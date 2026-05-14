import os
import faiss
import numpy as np
import pickle
from app.ingest import extract_text_by_page,chunk_pages,build_index
from rank_bm25 import BM25Okapi

CORPUS_DIR = os.path.join("corpus", "jee")
INDEX_PATH = "models/jee_physics.index"
CHUNKS_PATH = "models/jee_physics_chunks.pkl"
BM25_PATH = "models/jee_physics_bm25.pkl"

def build_corpus_index(model):
        pdf_files = [
        os.path.join(CORPUS_DIR, f)
        for f in os.listdir(CORPUS_DIR)
        if f.endswith(".pdf")
        ]
        print(f"Found {len(pdf_files)} PDFs in corpus")
        all_chunks_dicts = []
        
        for pdf_path in pdf_files:
            print(f"Processing {pdf_path}...")
            pages = extract_text_by_page(pdf_path)
            chunks = chunk_pages(pages)
            
            #get the chunk source files
            source_name = os.path.basename(pdf_path)
            
            _,chunk_dicts,_ = build_index(chunks, model,source_name)
            all_chunks_dicts.extend(chunk_dicts)
            
        print(f"Total Chunks across the pdfs are :{len(all_chunks_dicts)}")
        
        #embed everything into one big index
        texts = [c["text"] for c in all_chunks_dicts]
        embeddings = model.encode(texts,show_progress_bar=True)
        embeddings = np.array(embeddings,dtype = "float32")
        
        dimension = embeddings.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(embeddings)
        
        #save the embeddings
        faiss.write_index(index,INDEX_PATH)
        
        with open(CHUNKS_PATH,"wb") as f:
            pickle.dump(all_chunks_dicts,f)
        
        tokenized = [c["text"].lower().split() for c in all_chunks_dicts]
        bm25 = BM25Okapi(tokenized)
        
        with open(BM25_PATH,"wb") as f:
            pickle.dump(bm25,f)
            
        print("Corpus index built and saved")
        return index,all_chunks_dicts,bm25
    
def load_corpus_index():
    with open(CHUNKS_PATH,"rb") as f:
        chunks = pickle.load(f)
    
    with open(BM25_PATH,"rb") as f:
        bm25 = pickle.load(f)
        
    index = faiss.read_index(INDEX_PATH)
    
    print("Corpus index loaded from disk")
    return index,chunks,bm25

def prepare_corpus(model):
    
    if not os.path.exists(INDEX_PATH):
        raise FileNotFoundError(
            "Prebuilt corpus index not found."
        )

    return load_corpus_index()