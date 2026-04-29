# TRADEOFFS.md — Mumzworld Return Reason Classifier

## Why This Problem

Every e-commerce platform drowns in free-text returns. A classifier that routes correctly and expresses uncertainty saves ops hours daily. It is also a clean eval target — ground truth labels exist, confidence calibration is measurable, and adversarial inputs are easy to construct. Mumzworld operates in English and Arabic, making bilingual output a hard requirement, not an afterthought.

---

## Architecture

```
User (browser)
    ↓ POST /classify {text}
FastAPI (app.py)
    ↓
classifier.py
    ├── builds system prompt with decision rules
    ├── calls Llama 3.3 70B via Groq
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

## Model Choice

**Llama 3.3 70B via Groq (free)**

- Strong Arabic support — one of the best free models for Arabic text
- Follows JSON instructions reliably at temperature=0.1
- Groq's free tier has generous rate limits with no daily cap issues
- Originally tried OpenRouter but hit rate limits; switched to Groq for reliability

---

## Uncertainty Handling

| Situation | How We Handle It |
|---|---|
| confidence < 0.5 | escalate_flag = true → human reviews it |
| Out-of-scope input | decision = null, confidence = 0.0 — never forced into a category |
| Malformed AI output | Explicit HTTP 502 with reason, not silent empty fields |
| Legal threat | Always escalate regardless of confidence |

---

## What I Cut

- Auth and rate limiting — not needed for a prototype
- Streaming responses — latency is ~2s, acceptable
- Fine-tuning — Llama 3.3 70B zero-shot is good enough; fine-tuning needs labeled data
- Database logging — would add for production drift detection

---

## What I Would Build Next

1. Confidence calibration plot — are 80% confidence predictions right 80% of the time?
2. Human-in-the-loop queue for escalate_flag=true cases
3. Logging to a database for drift detection
4. Fine-tune on real Mumzworld return data once labels exist
5. Batch processing for high-volume ops use

---

## What I Rejected

- **Review synthesizer** — harder to eval (no ground truth), longer latency
- **Gift finder** — requires a product catalog; without real data it becomes a demo
- **Email triage** — similar to this but harder to scope tightly in 5 hours
