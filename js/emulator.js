let ROM_DATABASE = {};

/**
 * Carrega o banco de dados de ROMs do arquivo JSON
 */
async function loadRomDatabase() {
    try {
        const response = await fetch('data/roms.json');
        if (!response.ok) {
            throw new Error('Falha ao carregar banco de dados de ROMs');
        }
        ROM_DATABASE = await response.json();
        return true;
    } catch (error) {
        console.error('Erro ao carregar ROMs:', error);
        return false;
    }
}

function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return params.get('rom');
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
        const romId = getUrlParams();
        if (romId && ROM_DATABASE[romId]) {
            showGameStart(ROM_DATABASE[romId]);
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
    window.EJS_Buttons = {
        'fullscreen': true
    }

    setTimeout(() => {
        const container = document.getElementById('game-container');
        container.innerHTML = '<div id="game"></div>';

        const script = document.createElement('script');
        script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
        document.body.appendChild(script);
    }, 1000);
}

async function init() {
    const loaded = await loadRomDatabase();
    const romId = getUrlParams();

    if (!romId) return;

    if (!ROM_DATABASE[romId]) {
        showError(`ROM "${romId}" não encontrada.`);
        return;
    }

    showGameStart(ROM_DATABASE[romId]);
}

document.addEventListener('DOMContentLoaded', init);
