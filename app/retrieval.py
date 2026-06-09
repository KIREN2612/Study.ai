import faiss
import numpy as np
from app.reranker import rerank

TOP_K = 15  # increase return size to make expansion meaningful

def retrieve(query: str, model, faiss_index, chunks, bm25) -> list:

    embedded_query = np.array(model.encode([query]), dtype="float32")
    _, indices = faiss_index.search(embedded_query, TOP_K)

    # Context window expansion — only expand top 2 FAISS hits
    expanded_indices = set()
    for idx in indices[0].tolist()[:3]:
        expanded_indices.add(idx)

        if idx - 1 >= 0:           # bugfix: was > 0, missed index 1
            expanded_indices.add(idx - 1)

        if idx + 1 < len(chunks):
            expanded_indices.add(idx + 1)

    faiss_chunks = [chunks[i] for i in sorted(expanded_indices)]

    # BM25 retrieval
    texts = [c["text"] for c in chunks]
    bm25_results = bm25.get_top_n(query.lower().split(), texts, n=TOP_K)

    text_to_dict = {c["text"]: c for c in chunks}
    bm25_chunks = [text_to_dict[t] for t in bm25_results if t in text_to_dict]

    # Deduplicate — FAISS results get priority
    seen = set()
    combined = []
    for chunk in faiss_chunks + bm25_chunks:
        key = (chunk["source"], chunk["chunk_id"])
        if key not in seen:
            seen.add(key)
            combined.append(chunk)

    return rerank(query, combined, top_k=5)