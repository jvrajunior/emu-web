let ROM_DATABASE = {};
let TAG_DATABASE = {};

/**
 * Carrega o banco de dados de ROMs da API
 */
async function loadRomDatabase() {
    try {
        const response = await fetch('/api/roms');
        if (!response.ok) {
            throw new Error('Falha ao carregar banco de dados de ROMs');
        }
        const roms = await response.json();
        ROM_DATABASE = Object.fromEntries(roms.map(rom => [rom.id, rom]));
        return true;
    } catch (error) {
        console.error('Erro ao carregar ROMs:', error);
        return false;
    }
}

/**
 * Carrega o banco de dados de tags da API
 */
async function loadTagDatabase() {
    try {
        const response = await fetch('/api/tags');
        if (!response.ok) {
            throw new Error('Falha ao carregar banco de dados de tags');
        }
        const tags = await response.json();
        TAG_DATABASE = Object.fromEntries(tags.map(tag => [tag.id, tag]));
        return true;
    } catch (error) {
        console.error('Erro ao carregar tags:', error);
        return false;
    }
}

/**
 * Extrai o identificador da URL (pathname)
 */
function getIdentifierFromUrl() {
    const path = window.location.pathname;
    // Remove barra inicial se existir
    const identifier = path.startsWith('/') ? path.substring(1) : path;
    // Retorna apenas se não estiver vazio e não for um arquivo HTML
    return identifier && !identifier.endsWith('.html') ? identifier : null;
}

/**
 * Redireciona para o resource associado à tag
 */
function redirectToTagResource(tag) {
    const resource = TAG_DATABASE[tag].resource;
    
    // Verifica se é URL externa
    if (resource.startsWith('http://') || resource.startsWith('https://')) {
        window.location.href = resource;
    } else {
        // Redireciona para resource interno
        window.location.href = resource;
    }
}

function showGameStart(rom) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="game-start">
            <button id="start-game-btn" class="start-button">Jogar</button>
            <button id="help-btn" class="help-button">❓ Ajuda</button>
        </div>
    `;

    document.getElementById('start-game-btn').addEventListener('click', () => loadEmulator(rom));
    document.getElementById('help-btn').addEventListener('click', showHelpModal);
}

function showHelpModal() {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="help-modal">
            <div class="help-content">
                <h2>❓ Como Usar</h2>
                <div class="help-text">
                    <p><strong>🎮 Para Jogar:</strong><br>
                    Clique em "Jogar" para iniciar automaticamente em tela cheia.</p>
                    
                    <p><strong>🎯 Controles:</strong><br>
                    Use setas do teclado ou toque na tela (mobile).</p>
                    
                    <p><strong>📱 Compatibilidade:</strong><br>
                    Funciona em computadores, tablets e smartphones.</p>
                </div>
                <button id="back-btn" class="back-button">← Voltar</button>
            </div>
        </div>
    `;

    document.getElementById('back-btn').addEventListener('click', () => {
        const identifier = getIdentifierFromUrl();
        if (identifier && ROM_DATABASE[identifier]) {
            showGameStart(ROM_DATABASE[identifier]);
        }
    });
}

function showError(message) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="error-message">
            <h2>⚠️ Erro</h2>
            <p>${message}</p>
        </div>
    `;
}

function showLoading() {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <p>Carregando...</p>
        </div>
    `;
}

function loadEmulator(rom) {
    showLoading();

    window.EJS_player = '#game';
    window.EJS_core = 'segaMD';
    window.EJS_gameUrl = rom.file;
    window.EJS_gameName = rom.name;
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
    window.EJS_startOnLoaded = true;
    window.EJS_fullscreenOnLoaded = true;
    window.EJS_language = 'pt-BR';
    window.EJS_color = '#fff';
    // window.EJS_Buttons = {
    //     'fullscreen': true
    // }

    setTimeout(() => {
        const container = document.getElementById('game-container');
        container.innerHTML = '<div id="game"></div>';

        const script = document.createElement('script');
        script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
        document.body.appendChild(script);
    }, 5000);
}

async function init() {
    // Carrega ambos os bancos de dados
    await Promise.all([loadRomDatabase(), loadTagDatabase()]);
    
    const identifier = getIdentifierFromUrl();
    
    if (!identifier) return;

    // Verifica se é uma ROM
    if (ROM_DATABASE[identifier]) {
        showGameStart(ROM_DATABASE[identifier]);
        return;
    }

    // Verifica se é uma tag
    if (TAG_DATABASE[identifier]) {
        redirectToTagResource(identifier);
        return;
    }

    // Não encontrado
    showError(`Recurso "${identifier}" não encontrado.`);
}

document.addEventListener('DOMContentLoaded', init);
