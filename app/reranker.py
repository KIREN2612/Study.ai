from sentence_transformers import CrossEncoder

MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"

reranker = CrossEncoder(MODEL_NAME)

def rerank(query:str,chunks:list,top_k:int=5)->list:
    pairs = [(query,chunk["text"])for chunk in chunks]
    scores = reranker.predict(pairs)
    
    for i,score in enumerate(scores):
        chunks[i]["rerank_score"] = score
    
    chunks.sort(key=lambda x:x["rerank_score"],reverse=True)
    return chunks[:top_k]