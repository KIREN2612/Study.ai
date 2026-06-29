import google.generativeai as genai
from dotenv import load_dotenv
import os

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-flash")

def generate_answer(query: str, chunks: list) -> str:
    context = "\n\n".join([c["text"] for c in chunks])

    prompt = """You are a helpful study assistant. Answer student questions using the context provided.

INSTRUCTIONS:
1. Read the context carefully and extract relevant information to answer the question.
2. Even if the context doesn't use the exact same words as the question, reason about what the context is describing and answer accordingly.
3. Be generous in interpreting the context — if it clearly relates to the question topic, use it.
4. Only say the context is insufficient if it is genuinely about a completely different topic.
5. Never fabricate formulas or facts not present in the context.
6. Format answers clearly with key points highlighted.

CONTEXT:
{context}

QUESTION: {query}

You MUST attempt an answer if the context contains anything relevant to the question."""

    response = model.generate_content(
        prompt.format(context=context, query=query),
        generation_config=genai.GenerationConfig(
            max_output_tokens=800,
            temperature=0.1,
        )
    )

    return response.text