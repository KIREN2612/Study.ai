from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.1-8b-instant"

def generate_answer(query: str, chunks: list) -> str:
    context = "\n\n".join(chunks)
    
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": "You are a helpful JEE/NEET study assistant. Answer using ONLY the context provided. If the answer isn't in the context, say so."
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {query}"
            }
        ],
        max_tokens=300,
        temperature=0.3,
    )
    
    return response.choices[0].message.content