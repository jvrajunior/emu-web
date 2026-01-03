/**
 * Mega Drive Web Emulator
 * Módulo principal de gerenciamento do emulador
 */

// Banco de dados de ROMs (carregado do JSON)
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

/**
 * Obtém parâmetros da URL
 * @returns {Object} Objeto com romId e fullscreen
 */
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        romId: params.get('rom'),
        fullscreen: params.get('fullscreen') === 'true' || params.get('fullscreen') === '1'
    };
}

/**
 * Mostra a lista de jogos disponíveis
 */
function showGameList() {
    const container = document.getElementById('game-container');
    let html = '<div class="game-list">';
    
    for (const [id, rom] of Object.entries(ROM_DATABASE)) {
        
        html += `
            <a href="?rom=${id}" class="game-card">
                <h3>${rom.name}</h3>
            </a>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
}

/**
 * Mostra mensagem de erro
 * @param {string} message - Mensagem de erro
 */
function showError(message) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="error-message">
            <h2>⚠️ Erro</h2>
            <p>${message}</p>
            <p style="margin-top: 15px;"><a href="?">← Voltar para lista de jogos</a></p>
        </div>
    `;
}

/**
 * Inicializa o emulador com a ROM especificada
 * @param {Object} rom - Objeto com informações da ROM
 * @param {boolean} fullscreen - Se deve iniciar em tela cheia
 */
function initEmulator(rom, fullscreen) {
    if (fullscreen) {
        // Se fullscreen foi solicitado, inicia diretamente
        loadEmulator(rom, true);
    } else {
        // Se modo normal, mostra opções para o usuário
        showModeSelection(rom);
    }
}

/**
 * Mostra opções de modo de jogo (normal ou fullscreen)
 * @param {Object} rom - Objeto com informações da ROM
 */
function showModeSelection(rom) {
    const container = document.getElementById('game-container');
    container.innerHTML = `
        <div class="mode-selection">
            <h2>🎮 ${rom.name}</h2>
            <p>Escolha o modo de jogo:</p>
            <div class="mode-buttons">
                <button id="start-normal-btn" class="mode-btn normal-btn">
                    ▶ Jogar em Modo Normal
                </button>
                <button id="start-fullscreen-btn" class="mode-btn fullscreen-btn">
                    ▶ Jogar em Fullscreen
                </button>
            </div>
        </div>
    `;

    document.getElementById('start-normal-btn').addEventListener('click', () => {
        container.innerHTML = '<div id="game"></div>';
        loadEmulator(rom, false);
    });

    document.getElementById('start-fullscreen-btn').addEventListener('click', () => {
        container.innerHTML = '<div id="game"></div>';
        loadEmulator(rom, true);
    });
}

/**
 * Carrega o EmulatorJS com as configurações
 * @param {Object} rom - Objeto com informações da ROM
 * @param {boolean} fullscreen - Se deve iniciar em tela cheia
 */
function loadEmulator(rom, fullscreen) {
    // Configuração do EmulatorJS
    window.EJS_player = '#game';
    window.EJS_core = 'segaMD';
    window.EJS_gameUrl = rom.file;
    window.EJS_gameName = rom.name;
    window.EJS_pathtodata = 'https://cdn.emulatorjs.org/stable/data/';
    window.EJS_startOnLoaded = true;
    window.EJS_fullscreenOnLoaded = fullscreen;
    window.EJS_language = 'pt-BR';
    window.EJS_color = '#00d4ff';

    // Carrega o loader do EmulatorJS
    const script = document.createElement('script');
    script.src = 'https://cdn.emulatorjs.org/stable/data/loader.js';
    document.body.appendChild(script);
}

/**
 * Inicialização principal do emulador
 */
async function init() {
    // Carrega o banco de dados de ROMs
    const loaded = await loadRomDatabase();
    
    if (!loaded) {
        showError('Não foi possível carregar a lista de jogos. Tente novamente mais tarde.');
        return;
    }

    // Obtém parâmetros da URL
    const { romId, fullscreen } = getUrlParams();

    if (!romId) {
        // Sem parâmetro de ROM, mostra lista de jogos
        showGameList();
    } else if (!ROM_DATABASE[romId]) {
        // ROM não encontrada
        showError(`ROM "${romId}" não encontrada. Verifique o ID informado.`);
    } else {
        // Inicia o emulador com a ROM selecionada
        initEmulator(ROM_DATABASE[romId], fullscreen);
    }
}

// Inicia quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
