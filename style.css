// WebSocket server configuration
const WS_SERVER_URL = (() => {
    // Use environment-specific URLs
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'ws://localhost:8080';
    } else {
        // Replace with your actual Deno server URL
        return 'wss://your-deno-server.deno.dev';
    }
})();

// Game configuration
const GAME_CONFIG = {
    // Game types
    gameTypes: {
        '75ball': {
            name: '75-ቢንጎ',
            numbers: 75,
            boardSize: '5x5',
            patterns: ['row', 'column', 'diagonal', 'four-corners', 'full-house']
        },
        '90ball': {
            name: '90-ቢንጎ',
            numbers: 90,
            boardSize: '9x3',
            patterns: ['one-line', 'two-lines', 'full-house']
        },
        '30ball': {
            name: '30-ቢንጎ',
            numbers: 30,
            boardSize: '3x3',
            patterns: ['full-house']
        },
        'pattern': {
            name: 'ንድፍ ቢንጎ',
            numbers: 75,
            boardSize: '5x5',
            patterns: ['x-pattern', 'frame', 'postage-stamp', 'small-diamond']
        }
    },
    
    // Stake amounts (in Birr)
    stakeAmounts: [25, 50, 100, 200, 500, 1000, 2000, 5000],
    
    // Max players per room
    maxPlayers: 90,
    
    // Time settings (in milliseconds)
    timeSettings: {
        numberCallInterval: 7000,
        gameStartDelay: 10000,
        autoEndGame: 3600000, // 1 hour
        reconnectTimeout: 30000
    },
    
    // Admin settings
    admin: {
        password: 'asse2123',
        allowedCommands: [
            'create-room',
            'delete-room',
            'start-game',
            'end-game',
            'kick-player',
            'broadcast',
            'restart-server',
            'get-logs'
        ]
    },
    
    // RTC configuration
    rtc: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
        ],
        dataChannel: {
            ordered: true,
            maxRetransmits: 3
        }
    },
    
    // UI texts in Amharic
    uiTexts: {
        waiting: 'ተጫዋቾችን እየጠበቅን ነው...',
        starting: 'ጨዋታ እየጀመረ ነው...',
        active: 'ጨዋታ በሂደት ላይ',
        ended: 'ጨዋታ አልቋል',
        bingo: 'ቢንጎ! 🎉',
        winner: 'አሸናፊ',
        joinSuccess: 'በተሳካ ሁኔታ ተቀላቀልዎ!',
        roomFull: 'ጨዋታ ቤቱ ሙሉ ነው!',
        invalidCode: 'የተሳሳተ የጨዋታ ቁጥር!',
        connectionLost: 'ከሰርቨር ጋር ያለዎት ግንኙነት ተቋርጧል። እንደገና መሞከር ይችላሉ...'
    }
};

// Export configuration
window.WS_SERVER_URL = WS_SERVER_URL;
window.GAME_CONFIG = GAME_CONFIG;

// Utility functions
function getGameTypeName(type) {
    return GAME_CONFIG.gameTypes[type]?.name || type;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('am-ET', {
        style: 'currency',
        currency: 'ETB'
    }).format(amount);
}

function generateRoomCode() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

function generateInviteCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function validateRoomCode(code) {
    return /^\d{4}$/.test(code);
}

function validateInviteCode(code) {
    return /^\d{6}$/.test(code);
}

// Local storage utilities
const Storage = {
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.error('LocalStorage set error:', e);
        }
    },
    
    get: (key) => {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : null;
        } catch (e) {
            console.error('LocalStorage get error:', e);
            return null;
        }
    },
    
    remove: (key) => {
        localStorage.removeItem(key);
    },
    
    clear: () => {
        localStorage.clear();
    }
};

window.Storage = Storage;