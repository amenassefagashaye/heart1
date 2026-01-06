// Game state manager
class GameManager {
    constructor() {
        this.state = {
            roomId: null,
            gameType: '75ball',
            players: [],
            admin: null,
            gameStatus: 'waiting', // waiting, starting, active, ended
            calledNumbers: [],
            markedNumbers: new Set(),
            boardNumbers: [],
            winners: [],
            startTime: null,
            endTime: null,
            stakeAmount: 25,
            maxPlayers: 90
        };
        
        this.boardElements = new Map();
        this.playerBoard = [];
    }

    // Initialize game with room data
    initialize(roomData) {
        this.state = {
            ...this.state,
            ...roomData,
            calledNumbers: [],
            markedNumbers: new Set(),
            winners: []
        };
        
        this.updateUI();
    }

    // Generate bingo board based on game type
    generateBoard(gameType, playerId) {
        this.playerBoard = [];
        
        switch (gameType) {
            case '75ball':
                return this.generate75BallBoard(playerId);
            case '90ball':
                return this.generate90BallBoard(playerId);
            case '30ball':
                return this.generate30BallBoard(playerId);
            case 'pattern':
                return this.generatePatternBoard(playerId);
            default:
                return this.generate75BallBoard(playerId);
        }
    }

    // Generate 75-ball bingo board (5x5)
    generate75BallBoard(playerId) {
        const board = [];
        const columnRanges = [
            [1, 15],   // B
            [16, 30],  // I
            [31, 45],  // N
            [46, 60],  // G
            [61, 75]   // O
        ];
        
        // Generate unique numbers for each column
        for (let col = 0; col < 5; col++) {
            const [min, max] = columnRanges[col];
            const columnNumbers = new Set();
            
            while (columnNumbers.size < 5) {
                columnNumbers.add(Math.floor(Math.random() * (max - min + 1)) + min);
            }
            
            board[col] = Array.from(columnNumbers).sort((a, b) => a - b);
        }
        
        // Transpose to get rows
        const rows = [];
        for (let row = 0; row < 5; row++) {
            rows[row] = [];
            for (let col = 0; col < 5; col++) {
                rows[row][col] = board[col][row];
            }
        }
        
        // Free space in the middle
        rows[2][2] = 'FREE';
        
        this.playerBoard = rows;
        return rows;
    }

    // Generate 90-ball bingo board (9x3)
    generate90BallBoard(playerId) {
        const board = [];
        const numbers = Array.from({length: 90}, (_, i) => i + 1);
        
        // Shuffle numbers
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        
        // Distribute numbers in 3 rows, 9 columns
        for (let row = 0; row < 3; row++) {
            board[row] = [];
            for (let col = 0; col < 9; col++) {
                // Get next number for this position
                const numIndex = row * 9 + col;
                board[row][col] = numbers[numIndex] || 0;
            }
        }
        
        this.playerBoard = board;
        return board;
    }

    // Generate 30-ball bingo board (3x3)
    generate30BallBoard(playerId) {
        const board = [];
        const numbers = new Set();
        
        while (numbers.size < 9) {
            numbers.add(Math.floor(Math.random() * 30) + 1);
        }
        
        const numberArray = Array.from(numbers);
        for (let i = 0; i < 3; i++) {
            board[i] = numberArray.slice(i * 3, (i + 1) * 3);
        }
        
        this.playerBoard = board;
        return board;
    }

    // Generate pattern bingo board
    generatePatternBoard(playerId) {
        return this.generate75BallBoard(playerId);
    }

    // Check if number is called
    isNumberCalled(number) {
        return this.state.calledNumbers.includes(number);
    }

    // Mark number on board
    markNumber(number) {
        if (!this.isNumberCalled(number)) {
            return false;
        }
        
        this.state.markedNumbers.add(number);
        
        // Update UI
        this.updateBoardCell(number);
        
        // Check for win
        if (this.checkWinCondition()) {
            this.declareWin();
        }
        
        return true;
    }

    // Update board cell UI
    updateBoardCell(number) {
        // Find and mark the cell with this number
        for (let row = 0; row < this.playerBoard.length; row++) {
            for (let col = 0; col < this.playerBoard[row].length; col++) {
                if (this.playerBoard[row][col] === number) {
                    const cellId = `cell-${row}-${col}`;
                    const cell = document.getElementById(cellId);
                    if (cell) {
                        cell.classList.add('marked');
                    }
                    return;
                }
            }
        }
    }

    // Check win conditions
    checkWinCondition() {
        const gameType = this.state.gameType;
        
        switch (gameType) {
            case '75ball':
                return this.check75BallWin();
            case '90ball':
                return this.check90BallWin();
            case '30ball':
                return this.check30BallWin();
            case 'pattern':
                return this.checkPatternWin();
            default:
                return false;
        }
    }

    // Check 75-ball win patterns
    check75BallWin() {
        const board = this.playerBoard;
        const marked = this.state.markedNumbers;
        
        // Check rows
        for (let row = 0; row < 5; row++) {
            let rowComplete = true;
            for (let col = 0; col < 5; col++) {
                const num = board[row][col];
                if (num !== 'FREE' && !marked.has(num)) {
                    rowComplete = false;
                    break;
                }
            }
            if (rowComplete) return { type: 'row', row: row + 1 };
        }
        
        // Check columns
        for (let col = 0; col < 5; col++) {
            let colComplete = true;
            for (let row = 0; row < 5; row++) {
                const num = board[row][col];
                if (num !== 'FREE' && !marked.has(num)) {
                    colComplete = false;
                    break;
                }
            }
            if (colComplete) return { type: 'column', column: col + 1 };
        }
        
        // Check diagonals
        let diag1Complete = true;
        let diag2Complete = true;
        for (let i = 0; i < 5; i++) {
            const num1 = board[i][i];
            const num2 = board[i][4 - i];
            
            if (num1 !== 'FREE' && !marked.has(num1)) diag1Complete = false;
            if (num2 !== 'FREE' && !marked.has(num2)) diag2Complete = false;
        }
        
        if (diag1Complete) return { type: 'diagonal', diagonal: 1 };
        if (diag2Complete) return { type: 'diagonal', diagonal: 2 };
        
        // Check four corners
        const corners = [
            board[0][0], board[0][4],
            board[4][0], board[4][4]
        ];
        if (corners.every(num => num === 'FREE' || marked.has(num))) {
            return { type: 'four-corners' };
        }
        
        // Check full house
        let fullHouse = true;
        for (let row = 0; row < 5; row++) {
            for (let col = 0; col < 5; col++) {
                const num = board[row][col];
                if (num !== 'FREE' && !marked.has(num)) {
                    fullHouse = false;
                    break;
                }
            }
            if (!fullHouse) break;
        }
        if (fullHouse) return { type: 'full-house' };
        
        return null;
    }

    // Check 90-ball win patterns
    check90BallWin() {
        const marked = this.state.markedNumbers;
        const board = this.playerBoard;
        
        // Check rows for one line
        let completedRows = 0;
        for (let row = 0; row < 3; row++) {
            let rowComplete = true;
            for (let col = 0; col < 9; col++) {
                if (board[row][col] !== 0 && !marked.has(board[row][col])) {
                    rowComplete = false;
                    break;
                }
            }
            if (rowComplete) completedRows++;
        }
        
        if (completedRows === 1) return { type: 'one-line' };
        if (completedRows === 2) return { type: 'two-lines' };
        if (completedRows === 3) return { type: 'full-house' };
        
        return null;
    }

    // Check 30-ball win (full house only)
    check30BallWin() {
        const marked = this.state.markedNumbers;
        const board = this.playerBoard;
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                if (!marked.has(board[row][col])) {
                    return null;
                }
            }
        }
        return { type: 'full-house' };
    }

    // Check pattern win
    checkPatternWin() {
        // Implement pattern checking logic
        // This would check for specific patterns like X, frame, etc.
        return this.check75BallWin(); // Default to 75-ball win check
    }

    // Declare win
    declareWin() {
        const winCondition = this.checkWinCondition();
        if (!winCondition) return;
        
        const playerName = localStorage.getItem('playerName') || 'Player';
        const winData = {
            playerId: localStorage.getItem('playerId'),
            playerName: playerName,
            winCondition: winCondition,
            timestamp: new Date().toISOString(),
            markedNumbers: Array.from(this.state.markedNumbers),
            stakeAmount: this.state.stakeAmount
        };
        
        // Send win declaration to server
        sendToServer({
            type: 'declare-bingo',
            ...winData
        });
        
        return winData;
    }

    // Update UI based on game state
    updateUI() {
        // Update player count
        document.getElementById('playerCount').textContent = this.state.players.length;
        
        // Update called numbers display
        this.updateCalledNumbersDisplay();
        
        // Update game status
        const statusElement = document.getElementById('gameStatus');
        if (statusElement) {
            statusElement.textContent = this.getStatusText();
        }
    }

    // Update called numbers display
    updateCalledNumbersDisplay() {
        const container = document.getElementById('calledNumbers');
        if (!container) return;
        
        container.innerHTML = '';
        this.state.calledNumbers.forEach(number => {
            const span = document.createElement('span');
            span.className = 'called-number';
            span.textContent = number;
            container.appendChild(span);
        });
    }

    // Get status text in Amharic
    getStatusText() {
        switch (this.state.gameStatus) {
            case 'waiting':
                return 'ተጫዋቾችን እየጠበቅን ነው...';
            case 'starting':
                return 'ጨዋታ እየጀመረ ነው...';
            case 'active':
                return `ጨዋታ በሂደት ላይ - ${this.state.calledNumbers.length} ቁጥሮች ተጠርተዋል`;
            case 'ended':
                return 'ጨዋታ አልቋል';
            default:
                return 'ጨዋታ ሁኔታ';
        }
    }

    // Reset game
    reset() {
        this.state.calledNumbers = [];
        this.state.markedNumbers.clear();
        this.state.winners = [];
        this.state.startTime = null;
        this.state.endTime = null;
        this.playerBoard = [];
        
        // Clear board UI
        const board = document.getElementById('bingoBoard');
        if (board) {
            board.innerHTML = '';
        }
    }
}

// Global game manager instance
const gameManager = new GameManager();

// UI functions
function initializeGameBoard(gameType, boardNumbers = null) {
    const board = document.getElementById('bingoBoard');
    board.innerHTML = '';
    
    let boardData;
    if (boardNumbers) {
        boardData = boardNumbers;
        gameManager.playerBoard = boardNumbers;
    } else {
        boardData = gameManager.generateBoard(gameType, localStorage.getItem('playerId'));
    }
    
    // Create board based on game type
    switch (gameType) {
        case '75ball':
        case 'pattern':
            create5x5Board(boardData, gameType);
            break;
        case '90ball':
            create9x3Board(boardData);
            break;
        case '30ball':
            create3x3Board(boardData);
            break;
    }
}

function create5x5Board(boardData, gameType) {
    const container = document.createElement('div');
    container.className = 'board-5x5';
    
    // Add BINGO header
    const header = document.createElement('div');
    header.className = 'bingo-header';
    'BINGO'.split('').forEach(letter => {
        const letterDiv = document.createElement('div');
        letterDiv.className = 'bingo-letter';
        letterDiv.textContent = letter;
        header.appendChild(letterDiv);
    });
    container.appendChild(header);
    
    // Create board cells
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 5; col++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.id = `cell-${row}-${col}`;
            
            const number = boardData[row][col];
            cell.textContent = number;
            
            if (number === 'FREE') {
                cell.classList.add('free-cell');
                cell.textContent = 'FREE';
            } else {
                cell.dataset.number = number;
                cell.addEventListener('click', () => {
                    if (gameManager.isNumberCalled(number)) {
                        gameManager.markNumber(number);
                    }
                });
            }
            
            container.appendChild(cell);
        }
    }
    
    document.getElementById('bingoBoard').appendChild(container);
}

function create9x3Board(boardData) {
    const container = document.createElement('div');
    container.className = 'board-9x3';
    
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 9; col++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.id = `cell-${row}-${col}`;
            
            const number = boardData[row][col];
            if (number === 0) {
                cell.classList.add('blank-cell');
                cell.textContent = '';
            } else {
                cell.textContent = number;
                cell.dataset.number = number;
                cell.addEventListener('click', () => {
                    if (gameManager.isNumberCalled(number)) {
                        gameManager.markNumber(number);
                    }
                });
            }
            
            container.appendChild(cell);
        }
    }
    
    document.getElementById('bingoBoard').appendChild(container);
}

function create3x3Board(boardData) {
    const container = document.createElement('div');
    container.className = 'board-3x3';
    
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.id = `cell-${row}-${col}`;
            
            const number = boardData[row][col];
            cell.textContent = number;
            cell.dataset.number = number;
            
            cell.addEventListener('click', () => {
                if (gameManager.isNumberCalled(number)) {
                    gameManager.markNumber(number);
                }
            });
            
            container.appendChild(cell);
        }
    }
    
    document.getElementById('bingoBoard').appendChild(container);
}

function updateCalledNumbers(number) {
    gameManager.state.calledNumbers.push(number);
    gameManager.updateCalledNumbersDisplay();
}

function updateCurrentNumber(number) {
    const element = document.getElementById('currentNumber');
    if (element) {
        element.querySelector('span').textContent = number;
        element.classList.add('pulse');
        setTimeout(() => element.classList.remove('pulse'), 1000);
    }
}

function updatePlayersList(players) {
    const container = document.getElementById('playersList');
    if (!container) return;
    
    container.innerHTML = '';
    players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-item';
        div.innerHTML = `
            <span class="player-name">${player.name}</span>
            <span class="player-status">${player.ready ? '✓' : '...'}</span>
        `;
        container.appendChild(div);
    });
}

function addPlayerToList(player) {
    const container = document.getElementById('playersList');
    if (!container) return;
    
    const div = document.createElement('div');
    div.className = 'player-item';
    div.innerHTML = `
        <span class="player-name">${player.name}</span>
        <span class="player-status">✓</span>
    `;
    container.appendChild(div);
}

function removePlayerFromList(playerId) {
    // Implementation depends on how players are identified in the list
    const items = document.querySelectorAll('.player-item');
    items.forEach(item => {
        if (item.dataset.playerId === playerId) {
            item.remove();
        }
    });
}

function displayChatMessage(sender, text, timestamp) {
    const container = document.getElementById('chatMessages');
    if (!container) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'chat-message';
    
    const time = new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    
    messageDiv.innerHTML = `
        <div class="chat-sender">${sender}</div>
        <div class="chat-text amharic-text">${text}</div>
        <div class="chat-time">${time}</div>
    `;
    
    container.appendChild(messageDiv);
    container.scrollTop = container.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    const message = {
        type: 'chat',
        text: text,
        timestamp: new Date().toISOString()
    };
    
    // Send via RTC if available, otherwise via WebSocket
    if (rtcManager.broadcast({ type: 'chat', ...message })) {
        // Also display locally
        const playerName = localStorage.getItem('playerName') || 'You';
        displayChatMessage(playerName, text, new Date().toISOString());
    } else {
        // Fallback to WebSocket
        sendToServer({
            type: 'chat',
            text: text
        });
    }
    
    input.value = '';
}

function showWinner(winData) {
    document.getElementById('winnerName').textContent = winData.playerName;
    document.getElementById('winPattern').textContent = getWinPatternText(winData.winCondition);
    document.getElementById('winTime').textContent = new Date(winData.timestamp).toLocaleTimeString();
    
    showSection('winnerSection');
}

function getWinPatternText(winCondition) {
    const patterns = {
        'row': 'ረድፍ',
        'column': 'አምድ',
        'diagonal': 'ዲያግናል',
        'four-corners': 'አራት ማእዘኖች',
        'full-house': 'ሙሉ ቤት',
        'one-line': 'አንድ ረድፍ',
        'two-lines': 'ሁለት ረድፍ'
    };
    
    return patterns[winCondition.type] || winCondition.type;
}

// Admin functions
function createGameRoom(adminName, gameType, stakeAmount, maxPlayers) {
    sendToServer({
        type: 'create-room',
        adminName: adminName,
        gameType: gameType,
        stakeAmount: parseInt(stakeAmount),
        maxPlayers: parseInt(maxPlayers)
    });
}

function startGame() {
    sendToServer({
        type: 'start-game'
    });
}

function endGame() {
    sendToServer({
        type: 'end-game'
    });
}

function sendBroadcast(message) {
    sendToServer({
        type: 'broadcast',
        message: message
    });
}

function kickAllPlayers() {
    sendToServer({
        type: 'kick-all'
    });
}

function restartServer() {
    sendToServer({
        type: 'restart-server'
    });
}

function viewServerLogs() {
    sendToServer({
        type: 'get-logs'
    });
}

function joinRoomAsAdmin(roomId) {
    sendToServer({
        type: 'join-room-admin',
        roomId: roomId
    });
}

function deleteRoom(roomId) {
    if (confirm(`ቤት ${roomId} መሰረዝ ይፈልጋሉ?`)) {
        sendToServer({
            type: 'delete-room',
            roomId: roomId
        });
    }
}

// Export for use in other files
window.gameManager = gameManager;
window.initializeGameBoard = initializeGameBoard;
window.updateCalledNumbers = updateCalledNumbers;
window.updateCurrentNumber = updateCurrentNumber;