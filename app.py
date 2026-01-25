from fastapi import FastAPI, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy import create_engine, Column, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel
from pathlib import Path

# Database setup
Base = declarative_base()
engine = create_engine('sqlite:///./database.db')
SessionLocal = sessionmaker(bind=engine)

# Models
class Rom(Base):
    __tablename__ = "roms"
    id = Column(String, primary_key=True)
    file = Column(String)
    name = Column(String)

class Tag(Base):
    __tablename__ = "tags"
    id = Column(String, primary_key=True)
    resource = Column(String)

Base.metadata.create_all(bind=engine)

# Pydantic schemas
class RomSchema(BaseModel):
    id: str
    file: str
    name: str
    
    class Config:
        from_attributes = True

class TagSchema(BaseModel):
    id: str
    resource: str
    
    class Config:
        from_attributes = True

# FastAPI app
app = FastAPI(title="Emulador Web")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ROM endpoints
@app.get("/api/roms", response_model=list[RomSchema])
def list_roms(db: Session = Depends(get_db)):
    """Lista todas as ROMs"""
    return db.query(Rom).all()

@app.get("/api/roms/{rom_id}", response_model=RomSchema)
def get_rom(rom_id: str, db: Session = Depends(get_db)):
    """Obtém uma ROM específica"""
    rom = db.query(Rom).filter(Rom.id == rom_id).first()
    if not rom:
        raise HTTPException(status_code=404, detail="ROM não encontrada")
    return rom

@app.post("/api/roms", response_model=RomSchema)
def create_rom(rom: RomSchema, db: Session = Depends(get_db)):
    """Cria uma nova ROM"""
    new_rom = Rom(**rom.dict())
    db.add(new_rom)
    db.commit()
    db.refresh(new_rom)
    return new_rom

@app.put("/api/roms/{rom_id}", response_model=RomSchema)
def update_rom(rom_id: str, rom: RomSchema, db: Session = Depends(get_db)):
    """Atualiza uma ROM"""
    db_rom = db.query(Rom).filter(Rom.id == rom_id).first()
    if not db_rom:
        raise HTTPException(status_code=404, detail="ROM não encontrada")
    for key, value in rom.dict().items():
        setattr(db_rom, key, value)
    db.commit()
    db.refresh(db_rom)
    return db_rom

@app.delete("/api/roms/{rom_id}")
def delete_rom(rom_id: str, db: Session = Depends(get_db)):
    """Deleta uma ROM"""
    db_rom = db.query(Rom).filter(Rom.id == rom_id).first()
    if not db_rom:
        raise HTTPException(status_code=404, detail="ROM não encontrada")
    db.delete(db_rom)
    db.commit()
    return {"detail": "ROM deletada"}

# TAG endpoints
@app.get("/api/tags", response_model=list[TagSchema])
def list_tags(db: Session = Depends(get_db)):
    """Lista todas as tags"""
    return db.query(Tag).all()

@app.get("/api/tags/{tag_id}", response_model=TagSchema)
def get_tag(tag_id: str, db: Session = Depends(get_db)):
    """Obtém uma tag específica"""
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag não encontrada")
    return tag

@app.post("/api/tags", response_model=TagSchema)
def create_tag(tag: TagSchema, db: Session = Depends(get_db)):
    """Cria uma nova tag"""
    new_tag = Tag(**tag.dict())
    db.add(new_tag)
    db.commit()
    db.refresh(new_tag)
    return new_tag

@app.put("/api/tags/{tag_id}", response_model=TagSchema)
def update_tag(tag_id: str, tag: TagSchema, db: Session = Depends(get_db)):
    """Atualiza uma tag"""
    db_tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not db_tag:
        raise HTTPException(status_code=404, detail="Tag não encontrada")
    for key, value in tag.dict().items():
        setattr(db_tag, key, value)
    db.commit()
    db.refresh(db_tag)
    return db_tag

@app.delete("/api/tags/{tag_id}")
def delete_tag(tag_id: str, db: Session = Depends(get_db)):
    """Deleta uma tag"""
    db_tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not db_tag:
        raise HTTPException(status_code=404, detail="Tag não encontrada")
    db.delete(db_tag)
    db.commit()
    return {"detail": "Tag deletada"}

# Rota catch-all para servir arquivos estáticos e index.html
@app.get("/{path:path}")
async def serve_static(path: str):
    """Serve arquivos estáticos, voltando ao index.html para rotas de aplicação"""
    file_path = Path(path)
    
    # Verifica se é um arquivo que existe
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    
    # Para qualquer outra rota, retorna index.html (SPA routing)
    return FileResponse("index.html")

# Rota raiz para index.html
@app.get("/")
async def root():
    """Retorna o arquivo index.html"""
    return FileResponse("index.html")
