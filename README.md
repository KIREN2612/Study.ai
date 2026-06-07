---
title: JEE RAG Assistant
emoji: 📚
colorFrom: green
colorTo: green
sdk: docker
app_port: 7860
pinned: false
---

# JEE / NEET RAG Study Assistant

A Retrieval-Augmented Generation (RAG) app for JEE and NEET students.

## Stack
- **Frontend** — Vanilla HTML + Tailwind CSS
- **Backend** — FastAPI
- **Embeddings** — `all-MiniLM-L6-v2` (sentence-transformers)
- **Retrieval** — FAISS + BM25 hybrid
- **LLM** — Llama 3.1 8B via Groq API

## Usage
1. Upload any NCERT PDF using the Upload button
2. Ask questions — the app retrieves relevant chunks and answers via Llama 3.1

## Environment Variables
Set `GROQ_API_KEY` in Space Secrets.