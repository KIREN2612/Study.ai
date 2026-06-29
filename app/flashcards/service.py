from groq import Groq
import os
import json

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "qwen/qwen3-32b"

FLASHCARD_PROMPT = """
You are an expert tutor. Generate {num_cards} flashcards from the context below.

Each flashcard should test ONE specific concept, formula, or fact.
Questions should be concise. Answers should be 1-3 sentences.

Return ONLY valid JSON in this exact format, no other text, no markdown backticks:
[
  {{"question": "...", "answer": "..."}},
  ...
]

CONTEXT:
{context}
"""

def generate_flashcards(context: str, num_cards: int) -> list[dict]:
    prompt = FLASHCARD_PROMPT.format(num_cards=num_cards, context=context)

    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1500,
        temperature=0.3,
        reasoning_effort="none"  # disables thinking tokens for qwen3
    )

    raw = response.choices[0].message.content
    
    # strip think tags if present
    import re
    raw = re.sub(r'<think>.*?</think>', '', raw, flags=re.DOTALL).strip()
    
    # strip markdown code fences if present
    raw = re.sub(r'```json|```', '', raw).strip()
    
    start = raw.find("[")
    end = raw.rfind("]") + 1
    
    if start == -1 or end == 0:
        raise ValueError("LLM did not return valid JSON")
    
    raw = raw[start:end]

    try:
        cards = json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError("LLM did not return valid JSON")

    return cards