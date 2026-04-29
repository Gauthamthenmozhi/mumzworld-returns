# Mumzworld Return Reason Classifier

**Track: A — AI Engineering Intern**

## Project Summary

This is an AI-powered return reason classifier built for Mumzworld, the largest baby and kids e-commerce platform in the Middle East. It takes a free-text return reason typed by a customer in English or Arabic and classifies it into one of four actions — refund, exchange, store_credit, or escalate — with a confidence score, bilingual reasoning (native English and Arabic), and an escalate flag that triggers human review when the AI is uncertain. The system is designed for Mumzworld's operations team to automate return routing, reduce manual triage time, and ensure low-confidence or high-risk cases always reach a human agent.

Free-text return reason → `refund | exchange | store_credit | escalate` with confidence score and bilingual reasoning (EN + AR).

---

## Setup and Run (under 5 minutes)

### Prerequisites
- Python 3.10+
- Node.js 18+
- Free Groq API key → [console.groq.com](https://console.groq.com) (sign up, copy key)

### 1. Clone and install

```bash
git clone <repo-url>
cd mumzworld-returns

# Python backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

### 2. Set your API key

Edit `.env`:
```
GROQ_API_KEY=gsk-your-key-here
```

### 3. Run the backend

```bash
uvicorn app:app --reload
# → http://localhost:8000
```

### 4. Run the frontend (new terminal)

```bash
cd frontend
npm install
npm start
# → http://localhost:3000
```

### 5. Run evals

```bash
# In the root folder with venv active
python evals.py
```

---

## What It Does

Customer types a return reason (English or Arabic) → AI classifies it into one of:

| Decision | When |
|---|---|
| `refund` | Damaged, defective, wrong item, safety concern |
| `exchange` | Wants replacement or different size/color |
| `store_credit` | Mild dissatisfaction, change of mind |
| `escalate` | Legal threat, repeat complaint, too ambiguous |
| `null` | Not a return reason at all |

Every response includes:
- Confidence score (0.0–1.0)
- Reasoning in English
- Reasoning in Arabic (native copy, not a translation)
- Language detected
- Escalate flag (true if decision=escalate OR confidence < 0.5)

---

## Evals

### Rubric

| Criterion | Pass condition |
|---|---|
| Decision match | Predicted decision == expected decision |
| Confidence floor | confidence >= min_confidence for that case |
| Escalate flag | flag is true iff decision=escalate or confidence<0.5 |
| Out-of-scope refusal | decision=null for non-return inputs |
| Schema validity | Pydantic validates without error |

### Test Cases (12 total)

| # | Input (truncated) | Expected | Min Conf | Type |
|---|---|---|---|---|
| 1 | "The stroller arrived with a broken wheel..." | refund | 0.80 | Clear damage |
| 2 | "وصل المنتج مكسوراً تماماً..." (AR) | refund | 0.80 | Arabic refund |
| 3 | "This is a safety hazard. Cracked buckle..." | refund | 0.85 | Safety concern |
| 4 | "I ordered size 3 diapers but received size 5..." | exchange | 0.80 | Wrong item |
| 5 | "أريد تبديل هذا المنتج بلون مختلف..." (AR) | exchange | 0.75 | Arabic exchange |
| 6 | "The product is fine but I changed my mind..." | store_credit | 0.70 | Change of mind |
| 7 | "I don't really like the design, maybe I'll keep it..." | store_credit | 0.50 | Ambiguous |
| 8 | "Third time returning. I will take legal action..." | escalate | 0.80 | Legal threat |
| 9 | "سأتصل بالمحكمة إذا لم يتم حل هذه المشكلة..." (AR) | escalate | 0.80 | Arabic legal threat |
| 10 | "What time does your store open?" | null | 0.0 | Out of scope |
| 11 | "كيف أتتبع طلبي؟" (AR) | null | 0.0 | Arabic out of scope |
| 12 | "asdfjkl qwerty 12345" | null | 0.0 | Gibberish |

### Known Failure Modes

- **Case 7 (ambiguous)**: Confidence can vary run-to-run. Sometimes classified as `store_credit`, sometimes `escalate`. This is expected — the escalate_flag catches it.
- **Arabic reasoning**: Occasionally the model produces reasoning that reads slightly formal. Acceptable for ops use, not ideal for customer-facing copy.
- **Very short inputs** ("broken"): Model classifies correctly but confidence is lower (~0.65). Escalate flag triggers, which is the right behavior.

---

## Architecture

```
User (browser)
    ↓ POST /classify {text}
FastAPI (app.py)
    ↓
classifier.py
    ├── builds system prompt with decision rules
    ├── calls Llama 3.3 70B via OpenRouter
    ├── strips markdown fences if present
    ├── json.loads() → explicit JSONDecodeError if malformed
    └── Pydantic validation → explicit ValidationError if schema fails
    ↓
ReturnDecision (validated)
    ↓
JSON response to frontend
    ↓
React UI (EN/AR toggle, confidence bar, escalate flag)
```

---

## Tradeoffs

### Why this problem
Every e-commerce platform drowns in free-text returns. A classifier that routes correctly and expresses uncertainty saves ops hours daily. It's also a clean eval target — ground truth labels exist, confidence calibration is measurable, and adversarial inputs are easy to construct.

### What I rejected
- **Review synthesizer**: harder to eval (no ground truth), longer latency
- **Gift finder**: requires a product catalog; without real data it's a demo
- **Email triage**: similar to this but harder to scope tightly in 5 hours

### Model choice
Llama 3.3 70B via Groq (free). Strong Arabic support, follows JSON instructions reliably at temperature=0.1, and has generous free tier limits with no rate limiting issues. Originally tried OpenRouter but switched to Groq for better free tier reliability.

### Uncertainty handling
- `confidence < 0.5` → `escalate_flag = true` → human reviews it
- Out-of-scope input → `decision = null`, `confidence = 0.0` — never forced into a category
- Malformed AI output → explicit HTTP 502 with reason, not silent empty fields

### What I cut
- Auth/rate limiting (not needed for a prototype)
- Streaming responses (latency is ~2s, acceptable)
- Fine-tuning (Llama 3.3 70B zero-shot is good enough; fine-tuning would need labeled data)

### What I'd build next
1. Confidence calibration plot (are 80% confidence predictions right 80% of the time?)
2. Human-in-the-loop queue for escalate_flag=true cases
3. Logging to a database for drift detection
4. Fine-tune on real Mumzworld return data once labels exist

---

## AI Usage Note

- **Llama 3.3 70B Versatile** via Groq (free) — core classification model, chosen for strong Arabic support and reliable JSON output
- **Amazon Q in VS Code** — pair-coding: scaffolded all files, iterated on system prompt, wrote eval harness
- **Groq API** — free inference gateway, no rate limit issues unlike OpenRouter
- System prompt written and refined manually — Q's first version lacked explicit null handling and escalate_flag logic, both overruled and rewritten
- temperature=0.1 chosen deliberately for consistent structured JSON output

---

## Time Log

- Problem selection + architecture planning — 30 mins
- classifier.py + system prompt iteration — 60 mins
- app.py + Pydantic schema + error handling — 30 mins
- evals.py + 12 test cases + debugging — 90 mins (API key issues took longer than expected)
- React frontend + styling + README + docs — 90 mins
- **Total: ~5.5 hours. Went slightly over due to OpenRouter rate limits — switched to Groq mid-way, which added ~45 mins of unplanned debugging.**

## Video Walkthrough

https://www.loom.com/share/0a07a3f8fe3747f298a2cf57d6fac0f0

---

## Tooling

| Tool | Used for |
|---|---|
| Amazon Q (Claude) in VS Code | Pair-coding: scaffolded all files, iterated on system prompt, wrote eval harness |
| Groq | Free gateway to Llama 3.3 70B with generous rate limits |
| Llama 3.3 70B Versatile (free) | Classification + bilingual reasoning |
| FastAPI + Pydantic | API server + schema validation |
| React 19 | Frontend UI |

**How I used Amazon Q**: Pair-coding mode — I described each component's purpose and constraints, Q generated the implementation, I reviewed and corrected the system prompt (the original was too permissive about out-of-scope inputs) and the escalate_flag logic (Q initially set it only on decision=escalate, missing the confidence<0.5 case).

**What worked**: Q's first-pass code for classifier.py and app.py was ~90% correct. The Pydantic schema and error handling were solid out of the box.

**What I overruled**: The system prompt. Q's first version said "classify into one of four categories" without explicit null handling. I rewrote the out-of-scope rule and the escalate_flag definition to match the eval rubric exactly.

**Key system prompt decision**: `temperature=0.1` — low temperature gives consistent JSON structure. Higher temperature caused occasional markdown-wrapped responses (handled by the fence-stripping code) and inconsistent confidence values.
