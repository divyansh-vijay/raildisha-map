from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func
from src.database import Base
from datetime import datetime

class Floor(Base):
    __tablename__ = "floors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    level = Column(Integer, nullable=False)
    map_data = Column(JSON, nullable=False, default={
        "objects": [],
        "routes": [],
        "boundaries": [],
        "innerBoundaries": []
    })
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "level": self.level,
            "map_data": self.map_data
        }

class MapData(Base):
    __tablename__ = "map_data"

    id = Column(Integer, primary_key=True, index=True)
    data = Column(JSON, nullable=False, default={
        "floors": [],
        "floorData": {},
        "selectedFloor": None
    })
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "data": self.data,
            "created_at": self.created_at,
            "updated_at": self.updated_at
        } 