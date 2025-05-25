from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.database import Base

class Floor(Base):
    __tablename__ = "floors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    level = Column(Integer, nullable=False)
    map_data = Column(JSON, nullable=False)  # Store all map data as JSON
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    markers = relationship("Marker", back_populates="floor")
    paths = relationship("Path", back_populates="floor")
    boundaries = relationship("Boundary", back_populates="floor")

class Marker(Base):
    __tablename__ = "markers"

    id = Column(Integer, primary_key=True, index=True)
    floor_id = Column(Integer, ForeignKey("floors.id"))
    name = Column(String, nullable=False)
    description = Column(String)
    position = Column(JSON, nullable=False)  # {lat: float, lng: float}
    type = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    floor = relationship("Floor", back_populates="markers")

class Path(Base):
    __tablename__ = "paths"

    id = Column(Integer, primary_key=True, index=True)
    floor_id = Column(Integer, ForeignKey("floors.id"))
    name = Column(String, nullable=False)
    description = Column(String)
    points = Column(JSON, nullable=False)  # Array of {lat: float, lng: float}
    type = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    floor = relationship("Floor", back_populates="paths")

class Boundary(Base):
    __tablename__ = "boundaries"

    id = Column(Integer, primary_key=True, index=True)
    floor_id = Column(Integer, ForeignKey("floors.id"))
    name = Column(String, nullable=False)
    description = Column(String)
    points = Column(JSON, nullable=False)  # Array of {lat: float, lng: float}
    type = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    floor = relationship("Floor", back_populates="boundaries") 