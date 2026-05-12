from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import pickle

EMBEDDING_MODEL = "all-MiniLM-L6-v2"
FAISS_INDEX_PATH = "models/faiss.index"
CHUNKS_PATH = "models/chunks.pkl"
BM25_PATH = "models/bm25.pkl"
TOP_K = 5

def retrieve(query:str)->str:
    with open(CHUNKS_PATH,"rb") as f:
        chunks = pickle.load(f)
        
    with open(BM25_PATH,"rb") as f:
        bm25 = pickle.load(f)
        
    faiss_index = faiss.read_index(FAISS_INDEX_PATH)
    model = SentenceTransformer(EMBEDDING_MODEL)
    
    embedded_query = np.array(model.encode([query]),dtype = "float32")
    
    _, indices = faiss_index.search(embedded_query,TOP_K)
    faiss_chunks = [chunks[i] for i in indices[0].tolist()]
    
    bm25_chunks = bm25.get_top_n(query.lower().split(),chunks,n=TOP_K)
    
    combined = list(dict.fromkeys(faiss_chunks + bm25_chunks))
    return combined[:TOP_K]

#if __name__ == "__main__":
    #retrieve("What is the speed of light")

    
         
        