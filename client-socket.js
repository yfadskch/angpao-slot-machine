// WebSocket客户端连接代码

// 建立WebSocket连接
let socket;
let username = '玩家' + Math.floor(Math.random() * 1000); // 生成随机用户名
let isConnected = false;

// 游戏状态数据
let globalGameState = {
    activeUsers: 0,
    lastWinner: null,
    jackpot: 5000,
    recentWins: []
};

// 初始化WebSocket连接
function initWebSocket() {
    // 确定WebSocket服务器地址
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port || (protocol === 'wss:' ? '443' : '3000');
    const wsUrl = `${protocol}//${host}:${port}`;
    
    // 创建WebSocket连接
    socket = new WebSocket(wsUrl);
    
    // 连接打开时的处理
    socket.onopen = function() {
        console.log('WebSocket连接已建立');
        isConnected = true;
        
        // 显示连接状态
        updateConnectionStatus(true);
        
        // 发送用户信息
        sendMessage({
            type: 'userInfo',
            username: username
        });
    };
    
    // 接收消息的处理
    socket.onmessage = function(event) {
        try {
            const message = JSON.parse(event.data);
            handleServerMessage(message);
        } catch (error) {
            console.error('解析消息错误:', error);
        }
    };
    
    // 连接关闭时的处理
    socket.onclose = function() {
        console.log('WebSocket连接已关闭');
        isConnected = false;
        updateConnectionStatus(false);
        
        // 尝试重新连接
        setTimeout(initWebSocket, 5000);
    };
    
    // 连接错误时的处理
    socket.onerror = function(error) {
        console.error('WebSocket错误:', error);
        isConnected = false;
        updateConnectionStatus(false);
    };
}

// 发送消息到服务器
function sendMessage(data) {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(data));
    } else {
        console.warn('WebSocket未连接，无法发送消息');
    }
}

// 处理从服务器接收的消息
function handleServerMessage(message) {
    switch(message.type) {
        case 'gameState':
            // 更新全局游戏状态
            globalGameState = message.data;
            updateGameStateUI();
            break;
            
        case 'playerActivity':
            // 显示其他玩家活动
            showPlayerActivity(message.data);
            break;
            
        default:
            console.log('收到未知类型消息:', message);
    }
}

// 更新连接状态UI
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        statusElement.textContent = connected ? '已连接' : '未连接';
        statusElement.className = connected ? 'connected' : 'disconnected';
    }
}

// 更新游戏状态UI
function updateGameStateUI() {
    // 更新在线玩家数量
    const playersElement = document.getElementById('online-players');
    if (playersElement) {
        playersElement.textContent = globalGameState.activeUsers;
    }
    
    // 更新奖池金额
    const jackpotElement = document.getElementById('jackpot-amount');
    if (jackpotElement) {
        jackpotElement.textContent = globalGameState.jackpot;
    }
    
    // 更新最近获胜记录
    updateRecentWins();
}

// 更新最近获胜记录
function updateRecentWins() {
    const winsContainer = document.getElementById('recent-wins');
    if (winsContainer && globalGameState.recentWins.length > 0) {
        // 清空容器
        winsContainer.innerHTML = '';
        
        // 添加最近的获胜记录
        globalGameState.recentWins.forEach(win => {
            const winItem = document.createElement('div');
            winItem.className = 'win-item';
            
            // 格式化时间
            const winTime = new Date(win.timestamp);
            const timeString = winTime.toLocaleTimeString();
            
            winItem.innerHTML = `
                <span class="win-user">${win.username}</span>
                <span class="win-amount">赢得 ${win.amount} 金币</span>
                <span class="win-symbols">${win.symbols.join(' ')}</span>
                <span class="win-time">${timeString}</span>
            `;
            
            winsContainer.appendChild(winItem);
        });
    }
}

// 显示其他玩家活动
function showPlayerActivity(activity) {
    // 创建一个临时消息元素
    const activityElement = document.createElement('div');
    activityElement.className = 'player-activity';
    
    // 根据活动类型设置消息内容
    switch(activity.action) {
        case 'spin':
            activityElement.textContent = `有玩家正在旋转，下注 ${activity.betAmount} 金币`;
            break;
            
        default:
            activityElement.textContent = `有玩家正在活动`;
    }
    
    // 添加到页面
    const activityContainer = document.getElementById('activity-feed');
    if (activityContainer) {
        activityContainer.appendChild(activityElement);
        
        // 3秒后移除消息
        setTimeout(() => {
            activityElement.classList.add('fade-out');
            setTimeout(() => {
                activityContainer.removeChild(activityElement);
            }, 500);
        }, 3000);
    }
}

// 发送旋转消息
function sendSpinMessage(betAmount) {
    sendMessage({
        type: 'spin',
        betAmount: betAmount
    });
}

// 发送获胜消息
function sendWinMessage(amount, symbols) {
    sendMessage({
        type: 'win',
        username: username,
        amount: amount,
        symbols: symbols
    });
    
    // 贡献一部分到奖池
    const contribution = Math.floor(amount * 0.05); // 5%贡献给奖池
    if (contribution > 0) {
        sendMessage({
            type: 'jackpotContribution',
            amount: contribution
        });
    }
}

// 在页面加载完成后初始化WebSocket
document.addEventListener('DOMContentLoaded', function() {
    // 初始化WebSocket连接
    initWebSocket();
    
    // 监听原始spin函数，添加网络同步功能
    const originalSpin = window.spin;
    if (typeof originalSpin === 'function') {
        window.spin = function() {
            // 调用原始spin函数
            const result = originalSpin.apply(this, arguments);
            
            // 发送旋转消息
            if (isConnected) {
                sendSpinMessage(currentBet);
            }
            
            return result;
        };
    }
    
    // 监听原始checkWin函数，添加网络同步功能
    const originalCheckWin = window.checkWin;
    if (typeof originalCheckWin === 'function') {
        window.checkWin = function(symbols) {
            // 调用原始checkWin函数
            const result = originalCheckWin.apply(this, arguments);
            
            // 如果赢了，发送获胜消息
            if (result && result.win && isConnected) {
                sendWinMessage(result.amount, symbols);
            }
            
            return result;
        };
    }
});