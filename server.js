// 服务器端代码 - 支持老虎机游戏的多用户同步
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// 创建Express应用
const app = express();
const server = http.createServer(app);

// 设置WebSocket服务器
const wss = new WebSocket.Server({ server });

// 游戏状态数据
let gameState = {
    activeUsers: 0,
    lastWinner: null,
    jackpot: 5000,  // 初始奖池金额
    recentWins: []  // 最近的获胜记录
};

// 存储所有连接的客户端
const clients = new Set();

// 处理WebSocket连接
wss.on('connection', (ws) => {
    // 添加新客户端到集合
    clients.add(ws);
    gameState.activeUsers = clients.size;
    
    // 发送当前游戏状态给新连接的客户端
    ws.send(JSON.stringify({
        type: 'gameState',
        data: gameState
    }));
    
    // 向所有客户端广播用户数量更新
    broadcastGameState();
    
    // 处理来自客户端的消息
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            // 处理不同类型的消息
            switch(data.type) {
                case 'spin':
                    // 处理玩家旋转消息
                    handleSpin(data, ws);
                    break;
                case 'win':
                    // 处理玩家获胜消息
                    handleWin(data);
                    break;
                case 'jackpotContribution':
                    // 处理奖池贡献
                    gameState.jackpot += data.amount;
                    broadcastGameState();
                    break;
            }
        } catch (error) {
            console.error('消息处理错误:', error);
        }
    });
    
    // 处理连接关闭
    ws.on('close', () => {
        clients.delete(ws);
        gameState.activeUsers = clients.size;
        broadcastGameState();
    });
});

// 处理玩家旋转
function handleSpin(data, ws) {
    // 这里可以添加服务器端验证逻辑
    // 例如，验证玩家余额是否足够等
    
    // 向其他玩家广播有人在玩游戏
    broadcastToOthers(ws, {
        type: 'playerActivity',
        data: {
            action: 'spin',
            betAmount: data.betAmount
        }
    });
}

// 处理玩家获胜
function handleWin(data) {
    // 更新最近获胜记录
    gameState.lastWinner = data.username || '匿名玩家';
    gameState.recentWins.unshift({
        username: data.username || '匿名玩家',
        amount: data.amount,
        symbols: data.symbols,
        timestamp: new Date().toISOString()
    });
    
    // 只保留最近10条记录
    if (gameState.recentWins.length > 10) {
        gameState.recentWins.pop();
    }
    
    // 广播游戏状态更新
    broadcastGameState();
}

// 向所有客户端广播游戏状态
function broadcastGameState() {
    const message = JSON.stringify({
        type: 'gameState',
        data: gameState
    });
    
    for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

// 向除特定客户端外的所有客户端广播消息
function broadcastToOthers(ws, data) {
    const message = JSON.stringify(data);
    
    for (const client of clients) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    }
}

// 提供静态文件
app.use(express.static(path.join(__dirname)));

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
});