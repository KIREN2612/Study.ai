from fastapi import APIRouter,Depends,HTTPException,UploadFile,File,Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.auth.models import User
from app.documents.models import Document
from app.documents.schemas import DocumentUploadResponse,DocumentList,DocumentListItem
from app.ingest import extract_text_by_page,chunk_pages,build_index
import faiss,pickle,os,shutil
from uuid import uuid4


router = APIRouter(prefix="/documents",tags=["documents"])

@router.post("/upload")
def upload(
    request:Request,
    file:UploadFile = File(...),
    current_user : User = Depends(get_current_user),
    db:Session = Depends(get_db)
):
    doc_id = str(uuid4())
    
    with open(f"data/{doc_id}.pdf","wb") as f:
        shutil.copyfileobj(file.file,f)
        
    text = extract_text_by_page(f"data/{doc_id}.pdf")
    chunks = chunk_pages(text)
    index,chunk_dicts,bm25 = build_index(chunks,request.app.state.model,file.filename)
    
    os.makedirs(f"indices/{current_user.id}",exist_ok=True)
    faiss.write_index(index,f"indices/{current_user.id}/{doc_id}.index")
    with open(f"indices/{current_user.id}/{doc_id}_chunks.pkl","wb") as f:
        pickle.dump(chunk_dicts,f)
    with open(f"indices/{current_user.id}/{doc_id}_bm25.pkl","wb") as f:
        pickle.dump(bm25,f)
    
    doc = Document(
        user_id = current_user.id,
        filename = file.filename,
        doc_id = doc_id
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    return DocumentUploadResponse(
        doc_id = doc_id,
        filename = file.filename,
        message = f"Indexed {len(chunk_dicts)} chunks sucessfully"
    )
    
@router.get("/")
def list_documents(current_user:User=Depends(get_current_user),db:Session = Depends(get_db)):
    docs = db.query(Document).filter(Document.user_id==current_user.id).all()
    items = [DocumentListItem(doc_id = d.doc_id,filename=d.filename,created_at=d.created_at)for d in docs]
    return DocumentList(documents= items)

@router.delete("/{doc_id}")
def delete_document(
    doc_id:str,
    current_user: User = Depends(get_current_user),
    db:Session = Depends(get_db)
):
    doc = db.query(Document).filter(
        Document.doc_id == doc_id,
        Document.user_id == current_user.id,
    ).first()
    if not doc:
        raise HTTPException(status_code=404,detail="Document not found")
    for path in [
        f"indices/{current_user.id}/{doc_id}.index",
        f"indices/{current_user.id}/{doc_id}_chunks.pkl",
        f"indices/{current_user.id}/{doc_id}_bm25.pkl"
    ]:
        if os.path.exists(path):
            os.remove(path)
    db.delete(doc)
    db.commit()
    return {"message":"deleted"}
