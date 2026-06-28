from pydantic import BaseModel
from datetime import datetime

class DocumentUploadResponse(BaseModel):
    doc_id:str
    filename:str
    message:str
    
class DocumentListItem(BaseModel):
    doc_id:str
    filename:str
    created_at:datetime
    
class DocumentList(BaseModel):
    documents : list[DocumentListItem]