import os
import json
import httpx
from pydantic import BaseModel, field_validator
from typing import Literal, Optional
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).parent / ".env")

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.3-70b-versatile"

# --- Schema ---
# Every field is required. Pydantic will raise if AI returns malformed output.
class ReturnDecision(BaseModel):
    decision: Optional[Literal["refund", "exchange", "store_credit", "escalate"]] = None
    confidence: float
    reasoning_en: str
    reasoning_ar: str
    language_detected: Literal["en", "ar", "other"]
    escalate_flag: bool

    @field_validator("confidence")
    @classmethod
    def confidence_range(cls, v):
        if not 0.0 <= v <= 1.0:
            raise ValueError("confidence must be between 0 and 1")
        return round(v, 2)


SYSTEM_PROMPT = """You are a return-reason classifier for Mumzworld, a Middle East baby and kids e-commerce platform.

Your job:
1. Read the customer's return reason (may be in English or Arabic).
2. Classify it into exactly one of: refund, exchange, store_credit, escalate.
3. If the input is NOT a return reason (e.g. a general question, gibberish, or unrelated text), set decision to null and confidence to 0.0.

Decision rules:
- refund: customer wants money back, product is damaged/defective/wrong item, safety concern
- exchange: customer wants a replacement or different size/color
- store_credit: customer is mildly dissatisfied, wants credit, or is unsure
- escalate: threat, legal mention, repeat complaint, or too ambiguous to decide safely

Output ONLY valid JSON matching this exact schema, no extra text:
{
  "decision": "refund" | "exchange" | "store_credit" | "escalate" | null,
  "confidence": <float 0.0-1.0>,
  "reasoning_en": "<one sentence in English>",
  "reasoning_ar": "<one sentence in Arabic — native copy, not a translation>",
  "language_detected": "en" | "ar" | "other",
  "escalate_flag": <true if decision is escalate or confidence < 0.5, else false>
}"""


def classify_return(text: str) -> ReturnDecision:
    """
    Send return reason text to Llama 3.3 70B via Groq.
    Returns a validated ReturnDecision or raises on schema failure.
    """
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY not set in .env")

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text.strip()},
        ],
        "temperature": 0.1,
        "max_tokens": 300,
    }

    response = httpx.post(
        GROQ_URL,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=30.0,
    )
    response.raise_for_status()

    raw = response.json()["choices"][0]["message"]["content"].strip()

    # Strip markdown code fences if model wraps output in ```json ... ```
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    parsed = json.loads(raw)  # raises json.JSONDecodeError if malformed
    return ReturnDecision(**parsed)  # raises ValidationError if schema fails
