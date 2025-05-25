from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.base import Path
from ..schemas.base import PathCreate, Path as PathSchema

router = APIRouter()

@router.post("/", response_model=PathSchema)
def create_path(path: PathCreate, db: Session = Depends(get_db)):
    db_path = Path(**path.model_dump())
    db.add(db_path)
    db.commit()
    db.refresh(db_path)
    return db_path

@router.get("/", response_model=List[PathSchema])
def get_paths(
    floor_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Path)
    if floor_id is not None:
        query = query.filter(Path.floor_id == floor_id)
    paths = query.offset(skip).limit(limit).all()
    return paths

@router.get("/{path_id}", response_model=PathSchema)
def get_path(path_id: int, db: Session = Depends(get_db)):
    path = db.query(Path).filter(Path.id == path_id).first()
    if path is None:
        raise HTTPException(status_code=404, detail="Path not found")
    return path

@router.put("/{path_id}", response_model=PathSchema)
def update_path(path_id: int, path: PathCreate, db: Session = Depends(get_db)):
    db_path = db.query(Path).filter(Path.id == path_id).first()
    if db_path is None:
        raise HTTPException(status_code=404, detail="Path not found")
    
    for key, value in path.model_dump().items():
        setattr(db_path, key, value)
    
    db.commit()
    db.refresh(db_path)
    return db_path

@router.delete("/{path_id}")
def delete_path(path_id: int, db: Session = Depends(get_db)):
    db_path = db.query(Path).filter(Path.id == path_id).first()
    if db_path is None:
        raise HTTPException(status_code=404, detail="Path not found")
    
    db.delete(db_path)
    db.commit()
    return {"message": "Path deleted successfully"} 