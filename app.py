from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse, HTMLResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy import create_engine, Column, String
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel
from pathlib import Path
import uuid
import json

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
    id: str | None = None
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
templates = Jinja2Templates(directory=".")

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
    rom_data = rom.dict()
    if not rom_data.get('id'):
        rom_data['id'] = str(uuid.uuid4())
    new_rom = Rom(**rom_data)
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

# Rota raiz para index.html
@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    """Retorna o arquivo index.html"""
    return templates.TemplateResponse("index.html", {"request": request, "rom_data": None})

# Rota catch-all para servir arquivos estáticos e resolver identificadores
@app.get("/{identifier:path}")
async def resolve_identifier(identifier: str, request: Request, db: Session = Depends(get_db)):
    """Resolve identificador (ROM UUID ou TAG) no backend antes de servir"""
    # Verifica se é um arquivo que existe
    file_path = Path(identifier)
    if file_path.exists() and file_path.is_file():
        return FileResponse(file_path)
    
    # Remove barra inicial se houver
    clean_identifier = identifier.lstrip('/')
    
    # Se estiver vazio, retorna index
    if not clean_identifier:
        return templates.TemplateResponse("index.html", {"request": request, "rom_data": None})
    
    # Verifica se é uma ROM (UUID)
    rom = db.query(Rom).filter(Rom.id == clean_identifier).first()
    if rom:
        # É uma ROM, serve o index.html com os dados da ROM embutidos
        rom_data = {
            "id": rom.id,
            "file": rom.file,
            "name": rom.name
        }
        return templates.TemplateResponse("index.html", {
            "request": request, 
            "rom_data": json.dumps(rom_data)
        })
    
    # Verifica se é uma TAG
    tag = db.query(Tag).filter(Tag.id == clean_identifier).first()
    if tag:
        # Redireciona para o resource da tag
        resource = tag.resource.lstrip('/')
        if resource.startswith('http://') or resource.startswith('https://'):
            # Redirecionamento externo
            return RedirectResponse(url=resource, status_code=302)
        else:
            # Redirecionamento interno - usa a URL base da requisição
            base_url = f"{request.url.scheme}://{request.url.netloc}"
            redirect_url = f"{base_url}/{resource}"
            return RedirectResponse(url=redirect_url, status_code=302)
    
    # Não encontrado - retorna index.html
    return templates.TemplateResponse("index.html", {"request": request, "rom_data": None})
