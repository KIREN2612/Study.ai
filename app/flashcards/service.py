from app.llm import client,MODEL
import json

FLASHCARD_PROMPT = """
You are an expert JEE/NEET tutor. Generate {num_cards} flashcards from the context below.

Each flashcard should test ONE specific concept, formula, or fact.
Questions should be concise. Answers should be 1-3 sentences.

Return ONLY valid JSON in this exact format, no other text:
[
  {{"question": "...", "answer": "..."}},
  ...
]

CONTEXT:
{context}
"""

def generate_flashcards(context:str,num_cards:int)->list[dict]:
    prompt = FLASHCARD_PROMPT.format(num_cards=num_cards,context=context)
    
    response = client.chat.completions.create(
        model = MODEL,
        messages = [{"role":"user","content":prompt}],
        max_tokens = 1500,
        temperature=0.3
    )
    
    raw = response.choices[0].message.content
    
    start = raw.find("[")
    end = raw.rfind("]") + 1
    raw = raw[start:end]
    
    try:
        cards = json.loads(raw)
    except json.JSONDecodeError: 
        raise ValueError("LLM did not return valid json")
    return cards
        