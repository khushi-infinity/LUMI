import json
import urllib.request

BASE = "http://localhost:3100"

def post(path, payload, method="POST"):
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method=method,
    )
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

quiz = post("/api/quiz/generate", {"topic": "Binary Search"})

all_wrong = {q["id"]: [o for o in q["options"] if o != q["correct_answer"]][0] for q in quiz["questions"]}
result = post("/api/quiz/submit", {"quiz": quiz, "answers": all_wrong, "durationMinutes": 5})
print("all-wrong:", result["score"], "/", result["total"], "| weaknesses:", result["weaknesses"][:3])

all_right = {q["id"]: q["correct_answer"] for q in quiz["questions"]}
result = post("/api/quiz/submit", {"quiz": quiz, "answers": all_right, "durationMinutes": 10})
print("all-right:", result["score"], "/", result["total"], "| rec:", result["recommendation"][:80])

progress = json.loads(urllib.request.urlopen(BASE + "/api/progress").read())
bs = [m for m in progress["mastery"] if m["concept"] == "binary_search_boundary"]
print("boundary mastery after wrong-then-right:", round(bs[0]["mastery_score"], 2) if bs else "n/a")
print("events:", [e["type"] for e in progress["events"][:6]])
