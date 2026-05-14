import fitz
from langchain.text_splitter import RecursiveCharacterTextSplitter
import numpy as np
import faiss
from rank_bm25 import BM25Okapi

#0.Embedding Models and Database Paths
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

#1.First we Extract the text from the pdf using pymudf(imported as fitz here) and store it in a list.
def extract_text_by_page(pdf_path:str) -> list[dict]:
    doc = fitz.open(pdf_path)
    pages = []
    
    for page_num,page in enumerate(doc,start=1):
        text = page.get_text().strip()
        if text:
            pages.append({"page_num":page_num,"text":text})
    return pages

#2.Now we split the text into chunks(Chunking)

def chunk_pages(pages:list[dict])->list[dict]:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size = 800,
        chunk_overlap = 150,
        separators= ["\n\n","\n","."," "]
    )
    chunk_dicts = []
    chunk_id = 0
    
    for page in pages:
        splits = splitter.split_text(page["text"])
        for split in splits:
            chunk_dicts.append({
                "text":split,
                "page_number":page["page_num"],
                "chunk_id":chunk_id
            })
            chunk_id += 1
    return chunk_dicts
    
#3.Embed the text and save it to the Faiss database.

def build_index(chunk_dicts:list[dict],model,source_name:str = "uploaded_pdf"):
    print("Embedding the chunks standby")
    
    #wrap metadata along with the chunks
    for c in chunk_dicts:
        c["source"] = source_name
    texts = [c["text"]for c in chunk_dicts]
    embeddings = model.encode(texts,show_progress_bar = True)
    embeddings = np.array(embeddings,dtype = "float32")
    
    #3.1building the FAISS index
    dimension = embeddings.shape[1] #we create a np array which gets all the vectors of a chunk in a straight line and all the chunks as rows(downwards)
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
        
    print(f"FAISS index saved - {len(chunk_dicts)}chunks indexed")
    
    #3.4 Tokenize and save index for the BM25
    tokenized = [c["text"].lower().split() for c in chunk_dicts]
    bm25 = BM25Okapi(tokenized)
    
    return index,chunk_dicts,bm25

def extract_text(pdf_path:str)->str:
    pages = extract_text_by_page(pdf_path)
    return "\n".join(p["text"] for p in pages)

    