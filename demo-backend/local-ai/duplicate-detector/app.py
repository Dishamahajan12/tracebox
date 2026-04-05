from functools import lru_cache
import os

import numpy as np
from fastapi import FastAPI
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer

MODEL_NAME = os.getenv("DUPLICATE_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")


class SimilarityCandidate(BaseModel):
    ticketId: int
    text: str


class SimilarityRequest(BaseModel):
    draftText: str = Field(min_length=1)
    candidates: list[SimilarityCandidate] = Field(default_factory=list)


class SimilarityResponse(BaseModel):
    bestMatchTicketId: int | None = None
    bestMatchScore: float | None = None
    candidateCount: int


@lru_cache(maxsize=1)
def get_model() -> SentenceTransformer:
    return SentenceTransformer(MODEL_NAME)


app = FastAPI(title="Tracebox Local Duplicate Detector")


@app.get("/health")
def health() -> dict[str, str]:
    get_model()
    return {"status": "UP", "modelName": MODEL_NAME}


@app.post("/api/similarity/duplicate-ticket", response_model=SimilarityResponse)
def duplicate_ticket_similarity(request: SimilarityRequest) -> SimilarityResponse:
    cleaned_candidates = [
        candidate for candidate in request.candidates if candidate.text and candidate.text.strip()
    ]
    if not request.draftText.strip() or not cleaned_candidates:
        return SimilarityResponse(candidateCount=len(cleaned_candidates))

    model = get_model()
    texts = [request.draftText] + [candidate.text for candidate in cleaned_candidates]
    embeddings = model.encode(texts, normalize_embeddings=True)

    draft_embedding = embeddings[0]
    candidate_embeddings = embeddings[1:]
    scores = np.matmul(candidate_embeddings, draft_embedding)
    best_index = int(np.argmax(scores))

    return SimilarityResponse(
        bestMatchTicketId=cleaned_candidates[best_index].ticketId,
        bestMatchScore=round(float(scores[best_index]), 6),
        candidateCount=len(cleaned_candidates),
    )
