// WebSocket connection manager
class WebSocketManager {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.messageQueue = [];
        this.isConnected = false;
        this.connectionCallbacks = {
            onOpen: [],
            onClose: [],
            onError: [],
            onMessage: []
        };
    }

    // Connect to WebSocket server
    connect(url) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return Promise.resolve();
        }

        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(url);
                
                this.socket.onopen = (event) => {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    console.log('WebSocket connected');
                    
                    // Process any queued messages
                    this.processMessageQueue();
                    
                    // Notify callbacks
                    this.connectionCallbacks.onOpen.forEach(callback => callback(event));
                    
                    resolve();
                };
                
                this.socket.onclose = (event) => {
                    this.isConnected = false;
                    console.log('WebSocket disconnected:', event.code, event.reason);
                    
                    // Notify callbacks
                    this.connectionCallbacks.onClose.forEach(callback => callback(event));
                    
                    // Attempt reconnection
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        setTimeout(() => {
                            this.reconnectAttempts++;
                            console.log(`Reconnecting attempt ${this.reconnectAttempts}...`);
                            this.connect(url);
                        }, this.reconnectDelay * this.reconnectAttempts);
                    }
                };
                
                this.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    
                    // Notify callbacks
                    this.connectionCallbacks.onError.forEach(callback => callback(error));
                    
                    reject(error);
                };
                
                this.socket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.handleMessage(message);
                        
                        // Notify callbacks
                        this.connectionCallbacks.onMessage.forEach(callback => callback(message));
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                };
            } catch (error) {
                reject(error);
            }
        });
    }

    // Handle incoming messages
    handleMessage(message) {
        switch (message.type) {
            case 'welcome':
                handleWelcome(message);
                break;
            case 'room-joined':
                handleRoomJoined(message);
                break;
            case 'player-joined':
                handlePlayerJoined(message);
                break;
            case 'player-left':
                handlePlayerLeft(message);
                break;
            case 'room-info':
                handleRoomInfo(message);
                break;
            case 'game-started':
                handleGameStarted(message);
                break;
            case 'game-ended':
                handleGameEnded(message);
                break;
            case 'number-called':
                handleNumberCalled(message);
                break;
            case 'bingo-declared':
                handleBingoDeclared(message);
                break;
            case 'chat-message':
                handleChatMessage(message);
                break;
            case 'error':
                handleErrorMessage(message);
                break;
            case 'rtc-signal':
                handleRTCSignal(message);
                break;
            case 'admin-stats':
                handleAdminStats(message);
                break;
            case 'room-list':
                handleRoomList(message);
                break;
            default:
                console.log('Unknown message type:', message.type);
        }
    }

    // Send message to server
    send(message) {
        if (this.isConnected && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
            return true;
        } else {
            // Queue message for later sending
            this.messageQueue.push(message);
            console.log('Message queued, connection not ready');
            return false;
        }
    }

    // Process queued messages
    processMessageQueue() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (!this.send(message)) {
                // Put back if still can't send
                this.messageQueue.unshift(message);
                break;
            }
        }
    }

    // Add event listeners
    on(event, callback) {
        if (this.connectionCallbacks[event]) {
            this.connectionCallbacks[event].push(callback);
        }
    }

    // Remove event listeners
    off(event, callback) {
        if (this.connectionCallbacks[event]) {
            this.connectionCallbacks[event] = this.connectionCallbacks[event].filter(cb => cb !== callback);
        }
    }

    // Disconnect from server
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.isConnected = false;
        }
        this.messageQueue = [];
    }

    // Get connection status
    getStatus() {
        return {
            connected: this.isConnected,
            readyState: this.socket?.readyState || 3, // 3 = CLOSED
            reconnectAttempts: this.reconnectAttempts,
            queuedMessages: this.messageQueue.length
        };
    }
}

// Global WebSocket manager instance
const wsManager = new WebSocketManager();

// Message handlers
function handleWelcome(message) {
    console.log('Welcome to server:', message);
    localStorage.setItem('playerId', message.playerId);
}

function handleRoomJoined(message) {
    console.log('Joined room:', message.room);
    showSection('lobbySection');
    document.getElementById('roomDisplay').textContent = message.room.id;
    document.getElementById('roomTitle').textContent = `ጨዋታ ቤት: ${message.room.id}`;
    
    // Update players list
    updatePlayersList(message.room.players);
}

function handlePlayerJoined(message) {
    console.log('Player joined:', message.player);
    addPlayerToList(message.player);
    playSound('joinSound');
}

function handlePlayerLeft(message) {
    console.log('Player left:', message.playerId);
    removePlayerFromList(message.playerId);
}

function handleRoomInfo(message) {
    console.log('Room info:', message);
    if (message.gameState) {
        syncGameState(message.gameState);
    }
}

function handleGameStarted(message) {
    console.log('Game started:', message);
    showSection('gameSection');
    document.getElementById('gameRoomTitle').textContent = `ጨዋታ: ${message.roomId}`;
    
    // Initialize game board
    initializeGameBoard(message.gameType, message.boardNumbers);
    
    playSound('callSound');
}

function handleGameEnded(message) {
    console.log('Game ended:', message);
    showSection('lobbySection');
    alert('ጨዋታ አልቋል!');
}

function handleNumberCalled(message) {
    console.log('Number called:', message.number);
    updateCalledNumbers(message.number);
    updateCurrentNumber(message.number);
    playSound('callSound');
}

function handleBingoDeclared(message) {
    console.log('Bingo declared:', message);
    showWinner(message);
    playSound('winSound');
}

function handleChatMessage(message) {
    console.log('Chat message:', message);
    displayChatMessage(message.sender, message.text, message.timestamp);
}

function handleErrorMessage(message) {
    console.error('Server error:', message);
    alert(`ስህተት: ${message.message}`);
}

function handleRTCSignal(message) {
    console.log('RTC signal received:', message);
    handleRTCMessage(message);
}

function handleAdminStats(message) {
    console.log('Admin stats:', message);
    if (typeof updateStatistics === 'function') {
        updateStatistics(message.stats);
    }
}

function handleRoomList(message) {
    console.log('Room list:', message);
    if (typeof updateRoomList === 'function') {
        updateRoomList(message.rooms);
    }
}

// Utility functions
function playSound(soundId) {
    const audio = document.getElementById(soundId);
    if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log('Audio play failed:', e));
    }
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        section.classList.add('hidden');
    });
    
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.remove('hidden');
        section.classList.add('active');
    }
}

// Export for use in other files
window.wsManager = wsManager;
window.connectToServer = function(playerName, roomCode, inviteCode) {
    const serverUrl = `${WS_SERVER_URL}?name=${encodeURIComponent(playerName)}&room=${roomCode}&invite=${inviteCode}`;
    return wsManager.connect(serverUrl);
};

window.connectAsAdmin = function() {
    const serverUrl = `${WS_SERVER_URL}?admin=true`;
    return wsManager.connect(serverUrl);
};

window.sendToServer = wsManager.send.bind(wsManager);