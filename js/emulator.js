/**
 * Carrega uma ROM específica da API pelo ID
 */
async function loadRomById(romId) {
    try {
        const response = await fetch(`/api/roms/${romId}`);
        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error('Falha ao carregar ROM');
        }
        return await response.json();
    } catch (error) {
        console.error('Erro ao carregar ROM:', error);
        return null;
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
        // Usa dados embutidos se disponíveis
        if (window.ROM_DATA) {
            showGameStart(window.ROM_DATA);
            return;
        }
        
        // Fallback: carrega da API
        const identifier = getIdentifierFromUrl();
        loadRomById(identifier).then(rom => {
            if (rom) {
                showGameStart(rom);
            }
        });
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
    // Verifica se há dados da ROM injetados no HTML
    if (window.ROM_DATA) {
        // Usa os dados embutidos - sem chamada à API
        showGameStart(window.ROM_DATA);
        return;
    }

    const identifier = getIdentifierFromUrl();
    
    // Se não houver identificador, não faz nada (página inicial)
    if (!identifier) return;

    // Tenta carregar a ROM específica da API (fallback)
    const rom = await loadRomById(identifier);
    
    if (rom) {
        // ROM encontrada, mostra tela de iniciar jogo
        showGameStart(rom);
        return;
    }

    // Se não for ROM, o backend já deve ter feito o redirecionamento da tag
    // Se chegou aqui, o recurso não existe
    showError(`Recurso "${identifier}" não encontrado.`);
}

document.addEventListener('DOMContentLoaded', init);
