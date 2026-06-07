from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "llama-3.1-8b-instant"

def generate_answer(query: str, chunks: list) -> str:
    context = "\n\n".join([c["text"]for c in chunks])

    system_prompt = """You are a helpful JEE/NEET study assistant. Your job is to answer student questions using the textbook context provided.

INSTRUCTIONS:
1. Read the context carefully and extract relevant information to answer the question.
2. Even if the context doesn't use the exact same words as the question, reason about what the context is describing and answer accordingly.
3. Be generous in interpreting the context — if it clearly relates to the question topic, use it.
4. Only say the context is insufficient if it is genuinely about a completely different topic.
5. Never fabricate formulas or facts not present in the context.
6. Format answers clearly with key points highlighted.

You MUST attempt an answer if the context contains anything relevant to the question."""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": f"CONTEXT:\n{context}\n\nQUESTION: {query}"
            }
        ],
        max_tokens=800,
        temperature=0.1,
    )

    return response.choices[0].message.content