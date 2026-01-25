let currentRomEdit = null;
let currentTagEdit = null;

// Navegação entre tabs
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        // Remove active de todas as tabs
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        
        // Adiciona active na tab clicada
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-section`).classList.add('active');
    });
});

// ===== ROMS =====

async function loadRoms() {
    try {
        const response = await fetch('/api/roms');
        const roms = await response.json();
        
        const romsList = document.getElementById('roms-list');
        
        if (roms.length === 0) {
            romsList.innerHTML = '<div class="empty-state">Nenhuma ROM cadastrada</div>';
            return;
        }
        
        romsList.innerHTML = roms.map(rom => `
            <div class="item">
                <div class="item-info">
                    <strong>${rom.name}</strong>
                    <small>ID: ${rom.id} | Arquivo: ${rom.file}</small>
                </div>
                <div class="item-actions">
                    <button class="btn btn-edit" onclick="editRom('${rom.id}')">✏️ Editar</button>
                    <button class="btn btn-delete" onclick="deleteRom('${rom.id}')">🗑️ Deletar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar ROMs:', error);
        document.getElementById('roms-list').innerHTML = '<div class="empty-state">Erro ao carregar ROMs</div>';
    }
}

function openRomModal(rom = null) {
    currentRomEdit = rom;
    const modal = document.getElementById('rom-modal');
    const title = document.getElementById('rom-modal-title');
    const idGroup = document.getElementById('rom-id').parentElement;
    
    if (rom) {
        title.textContent = 'Editar ROM';
        document.getElementById('rom-id').value = rom.id;
        document.getElementById('rom-id').disabled = true;
        document.getElementById('rom-name').value = rom.name;
        document.getElementById('rom-file').value = rom.file;
        idGroup.style.display = 'block';
    } else {
        title.textContent = 'Adicionar ROM';
        document.getElementById('rom-form').reset();
        document.getElementById('rom-id').disabled = false;
        idGroup.style.display = 'none';
    }
    
    modal.classList.add('active');
}

function closeRomModal() {
    document.getElementById('rom-modal').classList.remove('active');
    currentRomEdit = null;
}

async function editRom(romId) {
    try {
        const response = await fetch(`/api/roms/${romId}`);
        const rom = await response.json();
        openRomModal(rom);
    } catch (error) {
        console.error('Erro ao carregar ROM:', error);
        alert('Erro ao carregar ROM para edição');
    }
}

async function deleteRom(romId) {
    if (!confirm('Tem certeza que deseja deletar esta ROM?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/roms/${romId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadRoms();
        } else {
            alert('Erro ao deletar ROM');
        }
    } catch (error) {
        console.error('Erro ao deletar ROM:', error);
        alert('Erro ao deletar ROM');
    }
}

document.getElementById('rom-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const rom = {
        name: document.getElementById('rom-name').value,
        file: document.getElementById('rom-file').value
    };
    
    // Adiciona ID apenas ao editar
    if (currentRomEdit) {
        rom.id = document.getElementById('rom-id').value;
    }
    
    try {
        let response;
        if (currentRomEdit) {
            // Editar
            response = await fetch(`/api/roms/${rom.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(rom)
            });
        } else {
            // Criar
            response = await fetch('/api/roms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(rom)
            });
        }
        
        if (response.ok) {
            closeRomModal();
            loadRoms();
        } else {
            const error = await response.json();
            alert(`Erro: ${error.detail || 'Erro ao salvar ROM'}`);
        }
    } catch (error) {
        console.error('Erro ao salvar ROM:', error);
        alert('Erro ao salvar ROM');
    }
});

// ===== TAGS =====

async function loadTags() {
    try {
        const response = await fetch('/api/tags');
        const tags = await response.json();
        
        const tagsList = document.getElementById('tags-list');
        
        if (tags.length === 0) {
            tagsList.innerHTML = '<div class="empty-state">Nenhuma tag cadastrada</div>';
            return;
        }
        
        tagsList.innerHTML = tags.map(tag => `
            <div class="item">
                <div class="item-info">
                    <strong>${tag.id}</strong>
                    <small>Resource: ${tag.resource}</small>
                </div>
                <div class="item-actions">
                    <button class="btn btn-edit" onclick="editTag('${tag.id}')">✏️ Editar</button>
                    <button class="btn btn-delete" onclick="deleteTag('${tag.id}')">🗑️ Deletar</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar tags:', error);
        document.getElementById('tags-list').innerHTML = '<div class="empty-state">Erro ao carregar tags</div>';
    }
}

function openTagModal(tag = null) {
    currentTagEdit = tag;
    const modal = document.getElementById('tag-modal');
    const title = document.getElementById('tag-modal-title');
    
    if (tag) {
        title.textContent = 'Editar Tag';
        document.getElementById('tag-id').value = tag.id;
        document.getElementById('tag-id').disabled = true;
        document.getElementById('tag-resource').value = tag.resource;
    } else {
        title.textContent = 'Adicionar Tag';
        document.getElementById('tag-form').reset();
        document.getElementById('tag-id').disabled = false;
    }
    
    modal.classList.add('active');
}

function closeTagModal() {
    document.getElementById('tag-modal').classList.remove('active');
    currentTagEdit = null;
}

async function editTag(tagId) {
    try {
        const response = await fetch(`/api/tags/${tagId}`);
        const tag = await response.json();
        openTagModal(tag);
    } catch (error) {
        console.error('Erro ao carregar tag:', error);
        alert('Erro ao carregar tag para edição');
    }
}

async function deleteTag(tagId) {
    if (!confirm('Tem certeza que deseja deletar esta tag?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/tags/${tagId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadTags();
        } else {
            alert('Erro ao deletar tag');
        }
    } catch (error) {
        console.error('Erro ao deletar tag:', error);
        alert('Erro ao deletar tag');
    }
}

document.getElementById('tag-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const tag = {
        id: document.getElementById('tag-id').value,
        resource: document.getElementById('tag-resource').value
    };
    
    try {
        let response;
        if (currentTagEdit) {
            // Editar
            response = await fetch(`/api/tags/${tag.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tag)
            });
        } else {
            // Criar
            response = await fetch('/api/tags', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(tag)
            });
        }
        
        if (response.ok) {
            closeTagModal();
            loadTags();
        } else {
            const error = await response.json();
            alert(`Erro: ${error.detail || 'Erro ao salvar tag'}`);
        }
    } catch (error) {
        console.error('Erro ao salvar tag:', error);
        alert('Erro ao salvar tag');
    }
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadRoms();
    loadTags();
});
