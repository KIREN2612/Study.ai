from pydantic import BaseModel,ConfigDict
from datetime import datetime

class FlashCardGenerateRequest(BaseModel):
    topic :str|None=None
    doc_id :str|None=None
    num_cards : int = 10
    
class FlashCardItem(BaseModel):
    question: str
    answer: str

    model_config = ConfigDict(from_attributes=True)

class FlashCardResponse(BaseModel):
    flashcards : list[FlashCardItem]
    
