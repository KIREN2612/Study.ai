from pydantic import BaseModel,ConfigDict
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class FlashCardGenerateRequest(BaseModel):
    topic: str | None = None
    doc_id: str | None = None
    num_cards: int = Field(default=10, ge=1, le=20)

    
class FlashCardItem(BaseModel):
    question: str
    answer: str

    model_config = ConfigDict(from_attributes=True)

class FlashCardResponse(BaseModel):
    flashcards : list[FlashCardItem]
    
