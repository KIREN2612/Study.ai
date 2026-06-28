import requests, os, time
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
API_URL = "http://localhost:8000/ask"

test_cases = [
    ("What is the principle of superposition of forces?",
     "The net force on a particle is the vector sum of all individual forces acting on it."),
    ("What is the work-energy theorem?",
     "The net work done on an object equals its change in kinetic energy."),
    ("State Newton's first law of motion.",
     "An object remains at rest or uniform motion unless acted upon by a net external force."),
    ("What is Hooke's law?",
     "Force needed to extend or compress a spring is proportional to displacement: F = -kx."),
    ("What is the law of conservation of momentum?",
     "Total momentum of an isolated system remains constant."),
    ("What is the difference between distance and displacement?",
     "Distance is total path length; displacement is shortest straight line from start to end."),
    ("What is projectile motion?",
     "Curved path of an object thrown horizontally under gravity alone."),
    ("State Newton's third law with an example.",
     "Every action has equal and opposite reaction. Example: rocket expels gas down, moves up."),
    ("Define power and give its SI unit.",
     "Power is the rate of doing work. SI unit is the watt (W)."),
    ("Define gravitational potential energy.",
     "Energy stored due to position in a gravitational field, given by mgh."),
]

def call_groq(prompt):
    time.sleep(4)  # stay under TPM limit
    r = requests.post(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"},
        json={
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 50,
            "temperature": 0.0
        }
    )
    return r.json()["choices"][0]["message"]["content"].strip()

def parse_score(s):
    for token in s.split():
        try:
            val = float(''.join(c for c in token if c.isdigit() or c == '.'))
            if 0 <= val <= 10:
                return val
        except:
            pass
    return 5.0

def evaluate(question, answer, contexts, ground_truth):
    ctx = "\n---\n".join(contexts[:2])[:800]  # keep tokens low

    f = call_groq(
        f"Rate 0-10: Is every claim in this answer supported by the context? "
        f"Context: {ctx}\nAnswer: {answer}\nReply with ONLY a number."
    )
    r = call_groq(
        f"Rate 0-10: Does this answer directly address the question? "
        f"Question: {question}\nAnswer: {answer}\nReply with ONLY a number."
    )
    cp = call_groq(
        f"Rate 0-10: How relevant is this context to the question? "
        f"Question: {question}\nContext: {ctx}\nReply with ONLY a number."
    )
    cr = call_groq(
        f"Rate 0-10: Does this context contain enough info to produce the ground truth? "
        f"Ground truth: {ground_truth}\nContext: {ctx}\nReply with ONLY a number."
    )

    return {
        "faithfulness": parse_score(f),
        "relevancy": parse_score(r),
        "ctx_precision": parse_score(cp),
        "ctx_recall": parse_score(cr),
    }

print("Querying RAG API...\n")
print(f"{'#':<4} {'Faith':>6} {'Relev':>6} {'CtxP':>6} {'CtxR':>6}  Question")
print("-" * 75)

all_scores = []

for i, (q, gt) in enumerate(test_cases):
    try:
        resp = requests.post(API_URL, json={"question": q}, timeout=30)
        data = resp.json()
        answer = data.get("answer", "")
        contexts = [s["full_text"] for s in data.get("sources", [])]

        if not answer:
            print(f"[{i+1:02d}] EMPTY — skipping")
            continue

        scores = evaluate(q, answer, contexts, gt)
        all_scores.append(scores)

        print(f"{i+1:<4} {scores['faithfulness']:>6.1f} {scores['relevancy']:>6.1f} "
              f"{scores['ctx_precision']:>6.1f} {scores['ctx_recall']:>6.1f}  {q[:40]}...")

    except Exception as e:
        print(f"[{i+1:02d}] ERROR — {e}")

if all_scores:
    avg = {k: sum(s[k] for s in all_scores) / len(all_scores) for k in all_scores[0]}
    print("\n" + "=" * 50)
    print("EVAL RESULTS (out of 10)")
    print("=" * 50)
    print(f"Faithfulness      : {avg['faithfulness']:.2f}/10")
    print(f"Answer Relevancy  : {avg['relevancy']:.2f}/10")
    print(f"Context Precision : {avg['ctx_precision']:.2f}/10")
    print(f"Context Recall    : {avg['ctx_recall']:.2f}/10")
    print("=" * 50)
    overall = sum(avg.values()) / 4
    print(f"Overall           : {overall:.2f}/10")
    print("=" * 50)