from fastapi import APIRouter, Depends, HTTPException, Request as FastAPIRequest
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User
from app.flashcards.schemas import (
    FlashCardGenerateRequest,
    FlashCardResponse
)
from app.flashcards.models import FlashCard
from app.flashcards.service import generate_flashcards
from app.flashcards.schemas import FlashCardItem

import pickle

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


@router.post("/generate", response_model=FlashCardResponse)
def generate(
    request: FlashCardGenerateRequest,
    fastapi_request: FastAPIRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    if request.doc_id:

        chunks_path = f"indices/{current_user.id}/{request.doc_id}_chunks.pkl"
        
        print("DOC ID:", request.doc_id)
        print("PATH:", chunks_path)
        
        try:
            with open(chunks_path, "rb") as f:
                doc_chunks = pickle.load(f)

        except FileNotFoundError:
            raise HTTPException(
                status_code=404,
                detail="Document chunks not found"
            )

        # Take first 20 chunks max to stay within token limits
        context = "\n\n".join(c["text"] for c in doc_chunks[:20])

    elif request.topic:
        raise HTTPException(
        status_code=400,
        detail="Topic-based flashcards require a document. Please upload a PDF first."
    )

    else:
        raise HTTPException(
            status_code=400,
            detail="Provide either topic or doc_id"
        )

    cards = generate_flashcards(context, request.num_cards)

    for card in cards:

        flashcard = FlashCard(
            user_id=current_user.id,
            doc_id=request.doc_id,
            topic=request.topic,
            question=card["question"],
            answer=card["answer"]
        )

        db.add(flashcard)

    db.commit()

    return FlashCardResponse(flashcards=cards)

@router.get("/{doc_id}", response_model=FlashCardResponse)
def get_flashcards(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    flashcards = (
        db.query(FlashCard)
        .filter(
            FlashCard.user_id == current_user.id,
            FlashCard.doc_id == doc_id
        )
        .all()
    )

    if not flashcards:
        raise HTTPException(
            status_code=404,
            detail="No flashcards found for this document"
        )

    cards = [FlashCardItem(question=card.question, answer=card.answer) for card in flashcards]

    return FlashCardResponse(flashcards=cards)