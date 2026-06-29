from google import genai
from google.genai import types
import os
import json

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

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

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            max_output_tokens=1500,
            temperature=0.3,
        )
    )

    raw = response.text
    start = raw.find("[")
    end = raw.rfind("]") + 1
    raw = raw[start:end]

    try:
        cards = json.loads(raw)
    except json.JSONDecodeError:
        raise ValueError("LLM did not return valid JSON")

    return cards