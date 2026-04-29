from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ValidationError
from classifier import classify_return
import json

app = FastAPI(title="Mumzworld Return Classifier")

# Allow React dev server to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST"],
    allow_headers=["*"],
)


class ClassifyRequest(BaseModel):
    text: str


@app.post("/classify")
def classify(req: ClassifyRequest):
    text = req.text.strip()

    if not text:
        raise HTTPException(status_code=400, detail="text cannot be empty")

    if len(text) > 2000:
        raise HTTPException(status_code=400, detail="text too long (max 2000 chars)")

    try:
        result = classify_return(text)
        return result.model_dump()

    except json.JSONDecodeError:
        # AI returned non-JSON — explicit failure, not silent
        raise HTTPException(status_code=502, detail="AI returned malformed JSON")

    except ValidationError as e:
        # AI returned JSON but wrong schema
        raise HTTPException(status_code=502, detail=f"Schema validation failed: {e.errors()}")

    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
def health():
    return {"status": "ok"}
