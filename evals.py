"""
Evals for the Mumzworld Return Classifier.
Run: python evals.py

Each test case has:
  - input: the return reason text
  - expected_decision: what we expect (or None for out-of-scope)
  - min_confidence: minimum acceptable confidence
  - description: what this test is checking
"""

from classifier import classify_return
from pydantic import ValidationError
import json

TEST_CASES = [
    # --- Clear refund cases ---
    {
        "input": "The stroller arrived with a broken wheel. I want my money back.",
        "expected_decision": "refund",
        "min_confidence": 0.80,
        "description": "Clear damage + explicit refund request",
    },
    {
        "input": "وصل المنتج مكسوراً تماماً، أريد استرداد أموالي",
        "expected_decision": "refund",
        "min_confidence": 0.80,
        "description": "Arabic: broken product, refund request",
    },
    {
        "input": "This is a safety hazard. The car seat has a cracked buckle. Refund immediately.",
        "expected_decision": "refund",
        "min_confidence": 0.85,
        "description": "Safety concern — should be refund, high confidence",
    },

    # --- Clear exchange cases ---
    {
        "input": "I ordered size 3 diapers but received size 5. Please send the correct size.",
        "expected_decision": "exchange",
        "min_confidence": 0.80,
        "description": "Wrong item received, wants replacement",
    },
    {
        "input": "أريد تبديل هذا المنتج بلون مختلف، اللون الأزرق غير مناسب",
        "expected_decision": "exchange",
        "min_confidence": 0.75,
        "description": "Arabic: wants color exchange",
    },

    # --- Store credit cases ---
    {
        "input": "The product is fine but I changed my mind. Can I get store credit?",
        "expected_decision": "store_credit",
        "min_confidence": 0.70,
        "description": "Change of mind, explicitly asks for store credit",
    },
    {
        "input": "I don't really like the design, maybe I'll keep it or return it, not sure.",
        "expected_decision": "store_credit",
        "min_confidence": 0.50,
        "description": "Ambiguous/mild dissatisfaction — low confidence expected",
    },

    # --- Escalate cases ---
    {
        "input": "This is the third time I'm returning this. I will take legal action if not resolved.",
        "expected_decision": "escalate",
        "min_confidence": 0.80,
        "description": "Legal threat + repeat complaint = escalate",
    },
    {
        "input": "سأتصل بالمحكمة إذا لم يتم حل هذه المشكلة فوراً",
        "expected_decision": "escalate",
        "min_confidence": 0.80,
        "description": "Arabic: legal threat = escalate",
    },

    # --- Out of scope (should return null) ---
    {
        "input": "What time does your store open?",
        "expected_decision": None,
        "min_confidence": 0.0,
        "description": "Not a return reason — should return null",
    },
    {
        "input": "كيف أتتبع طلبي؟",
        "expected_decision": None,
        "min_confidence": 0.0,
        "description": "Arabic: order tracking question — not a return reason",
    },

    # --- Adversarial ---
    {
        "input": "asdfjkl qwerty 12345",
        "expected_decision": None,
        "min_confidence": 0.0,
        "description": "Gibberish — should return null, not hallucinate a decision",
    },
]


def run_evals():
    passed = 0
    failed = 0
    results = []

    print(f"\n{'='*60}")
    print("MUMZWORLD RETURN CLASSIFIER — EVAL RESULTS")
    print(f"{'='*60}\n")

    for i, case in enumerate(TEST_CASES, 1):
        try:
            result = classify_return(case["input"])

            decision_ok = result.decision == case["expected_decision"]
            confidence_ok = result.confidence >= case["min_confidence"]
            # escalate_flag must be True when decision is escalate or confidence < 0.5
            flag_ok = (
                result.escalate_flag == (result.decision == "escalate" or result.confidence < 0.5)
            )

            ok = decision_ok and confidence_ok and flag_ok
            status = "PASS ✅" if ok else "FAIL ❌"

            if ok:
                passed += 1
            else:
                failed += 1

            print(f"[{i:02d}] {status} | {case['description']}")
            print(f"      Input:      {case['input'][:70]}")
            print(f"      Expected:   decision={case['expected_decision']}, min_conf={case['min_confidence']}")
            print(f"      Got:        decision={result.decision}, confidence={result.confidence}, flag={result.escalate_flag}")
            if not decision_ok:
                print(f"      ⚠ Decision mismatch")
            if not confidence_ok:
                print(f"      ⚠ Confidence too low: {result.confidence} < {case['min_confidence']}")
            print()

            results.append({"case": i, "passed": ok, "result": result.model_dump()})

        except (ValidationError, json.JSONDecodeError) as e:
            failed += 1
            print(f"[{i:02d}] FAIL ❌ | {case['description']}")
            print(f"      Schema/JSON error: {e}")
            print()

        except Exception as e:
            failed += 1
            print(f"[{i:02d}] ERROR ❌ | {case['description']}")
            print(f"      {type(e).__name__}: {e}")
            print()

    total = passed + failed
    score = (passed / total) * 100 if total > 0 else 0

    print(f"{'='*60}")
    print(f"SCORE: {passed}/{total} passed ({score:.0f}%)")
    print(f"{'='*60}\n")

    return passed, failed


if __name__ == "__main__":
    run_evals()
