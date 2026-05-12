# RAG Chatbot for EdTech

A production-grade Retrieval-Augmented Generation system built for competitive exam preparation (JEE/NEET). Students upload their study material as PDFs and ask questions — the system retrieves the most relevant excerpts and generates accurate, cited answers using a large language model.

Built targeting the core problem in Indian EdTech: students have access to material but no intelligent way to query it. This system closes that gap.

---

## The Problem

A JEE or NEET student has 600 pages of NCERT textbooks and wants a specific answer. Searching manually takes time. Generic AI models hallucinate answers not grounded in the actual material. This system solves both problems — it only answers from what is in the uploaded document, and it shows the exact source excerpts it used.

---

## System Architecture

```
PDF Upload
    |
    v
Text Extraction (PyMuPDF)
    |
    v
Text Chunking (LangChain RecursiveCharacterTextSplitter)
    |
    v
Dual Indexing
    |-- FAISS Vector Index (semantic search via sentence-transformers)
    |-- BM25 Index (keyword search via rank-bm25)
    |
    v
Student Question
    |
    v
Hybrid Retrieval (FAISS + BM25 results merged and deduplicated)
    |
    v
Prompt Template (context + question + system instructions)
    |
    v
LLM Generation (Llama 3 via Groq API)
    |
    v
Answer with Source Excerpts
```

The key architectural decision is hybrid search — combining semantic similarity (FAISS) with keyword matching (BM25). Semantic search alone fails on exact terminology like equation names, article numbers, and formula references. BM25 alone misses conceptually related content. The combination handles both cases.

---

## Project Structure

```
jee-rag-assistant/
|
|-- app/
|   |-- main.py          FastAPI application, endpoints, lifespan
|   |-- ingest.py        PDF extraction, chunking, index building
|   |-- retrieval.py     Hybrid FAISS + BM25 retrieval
|   |-- llm.py           Groq LLM integration, prompt template
|
|-- frontend/
|   |-- index.html       Chat UI served by FastAPI
|
|-- data/                PDF storage (gitignored)
|-- models/              FAISS index and BM25 pickle files (gitignored)
|-- .env                 API keys (gitignored)
|-- requirements.txt
|-- README.md
```

---

## API Reference

### POST /upload
Upload and index a PDF file.

**Request:** multipart/form-data with a PDF file

**Response:**
```json
{
  "message": "Indexed 95 chunks from physics.pdf"
}
```

### POST /ask
Ask a question against the indexed material.

**Request:**
```json
{
  "question": "What is dimensional analysis?"
}
```

**Response:**
```json
{
  "question": "What is dimensional analysis?",
  "answer": "Dimensional analysis is the process of analyzing...",
  "sources": [
    "The dimensional equation can be obtained from...",
    "A number of exercises at the end of this chapter..."
  ]
}
```

### GET /health
Returns system status.

```json
{"status": "ok"}
```

---

## How to Run Locally

**1. Clone the repository**
```bash
git clone https://github.com/KIREN2612/RAG_CHATBOT_FOR_EDUTECH.git
cd RAG_CHATBOT_FOR_EDUTECH
```

**2. Create virtual environment**
```bash
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
```

**3. Install dependencies**
```bash
pip install -r requirements.txt
```

**4. Add API key**

Create a `.env` file in the root:
```
GROQ_API_KEY=your_groq_api_key_here
```

Get a free key at console.groq.com — no credit card required.

**5. Add a PDF and build the index**

Place any PDF in the `data/` folder, then:
```bash
python app/ingest.py
```

This extracts text, chunks it, and builds both the FAISS and BM25 indexes. Run once per document.

**6. Start the server**
```bash
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000` in your browser.

---

## Technical Decisions

| Decision | Rationale |
|---|---|
| Hybrid search (FAISS + BM25) | Semantic search alone misses exact formula and term references common in NCERT material. BM25 covers keyword precision; FAISS covers conceptual similarity. |
| RecursiveCharacterTextSplitter | Respects sentence and paragraph boundaries before splitting on characters. Produces more coherent chunks than fixed-size splitting. |
| chunk_size=500, overlap=50 | Balances retrieval precision with context completeness. Overlap prevents answers from being cut mid-sentence across chunk boundaries. |
| Groq + Llama 3 | Free tier with 14,400 requests/day, sub-second latency. Reliable for deployment without infrastructure cost. |
| all-MiniLM-L6-v2 embeddings | 384 dimensions, fast inference, strong semantic understanding for English text. Runs on CPU without GPU. |
| FastAPI static file serving | Eliminates the need for a separate frontend server. Single deployment serves both API and UI. |

---

## Stack

- Python 3.10
- FastAPI + Uvicorn
- PyMuPDF (PDF text extraction)
- LangChain (text splitting)
- sentence-transformers (embeddings)
- FAISS (vector similarity search)
- rank-bm25 (keyword search)
- Groq API with Llama 3 8B (answer generation)

---

## Target Use Case

Built specifically for Indian EdTech platforms serving competitive exam students. The immediate application is NCERT textbook Q&A for JEE and NEET preparation, but the system is document-agnostic — any structured PDF can be indexed and queried.

Applicable to: PhysicsWallah, Unacademy, BYJU's, and any platform where students need to query their own study material intelligently.

---

## Roadmap

- [x] PDF ingestion pipeline
- [x] Hybrid FAISS + BM25 retrieval
- [x] Groq LLM answer generation with source citations
- [x] FastAPI REST endpoints
- [x] Chat UI with PDF upload
- [ ] Multi-document support with document switching
- [ ] Chat history and follow-up question handling
- [ ] Confidence score per answer
- [ ] Docker deployment to HuggingFace Spaces
- [ ] Support for Hindi-medium PDFs

---

## Built By

Kiren S — AI Engineer
Portfolio: kirenportfolio.netlify.app
GitHub: github.com/KIREN2612
LinkedIn: linkedin.com/in/kiren-s-178021322