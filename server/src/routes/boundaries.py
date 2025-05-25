from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.base import Boundary
from ..schemas.base import BoundaryCreate, Boundary as BoundarySchema

router = APIRouter()

@router.post("/", response_model=BoundarySchema)
def create_boundary(boundary: BoundaryCreate, db: Session = Depends(get_db)):
    db_boundary = Boundary(**boundary.model_dump())
    db.add(db_boundary)
    db.commit()
    db.refresh(db_boundary)
    return db_boundary

@router.get("/", response_model=List[BoundarySchema])
def get_boundaries(
    floor_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(Boundary)
    if floor_id is not None:
        query = query.filter(Boundary.floor_id == floor_id)
    boundaries = query.offset(skip).limit(limit).all()
    return boundaries

@router.get("/{boundary_id}", response_model=BoundarySchema)
def get_boundary(boundary_id: int, db: Session = Depends(get_db)):
    boundary = db.query(Boundary).filter(Boundary.id == boundary_id).first()
    if boundary is None:
        raise HTTPException(status_code=404, detail="Boundary not found")
    return boundary

@router.put("/{boundary_id}", response_model=BoundarySchema)
def update_boundary(boundary_id: int, boundary: BoundaryCreate, db: Session = Depends(get_db)):
    db_boundary = db.query(Boundary).filter(Boundary.id == boundary_id).first()
    if db_boundary is None:
        raise HTTPException(status_code=404, detail="Boundary not found")
    
    for key, value in boundary.model_dump().items():
        setattr(db_boundary, key, value)
    
    db.commit()
    db.refresh(db_boundary)
    return db_boundary

@router.delete("/{boundary_id}")
def delete_boundary(boundary_id: int, db: Session = Depends(get_db)):
    db_boundary = db.query(Boundary).filter(Boundary.id == boundary_id).first()
    if db_boundary is None:
        raise HTTPException(status_code=404, detail="Boundary not found")
    
    db.delete(db_boundary)
    db.commit()
    return {"message": "Boundary deleted successfully"} 