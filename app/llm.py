from groq import Groq
import os

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "qwen/qwen3-32b"

def generate_answer(query: str, chunks: list) -> str:
    context = "\n\n".join([c["text"] for c in chunks])

    prompt = """You are a helpful study assistant. Answer student questions using the context provided.

INSTRUCTIONS:
1. Read the context carefully and extract relevant information to answer the question.
2. Be generous in interpreting the context — if it clearly relates to the question topic, use it.
3. Only say the context is insufficient if it is genuinely about a completely different topic.
4. Never fabricate formulas or facts not present in the context.
5. Format answers clearly with key points highlighted.

CONTEXT:
{context}

QUESTION: {query}""".format(context=context, query=query)

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=800,
        temperature=0.1,
    )

    return response.choices[0].message.content