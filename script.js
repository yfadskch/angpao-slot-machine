let balance = 3000;
let freeSpins = 0;
let comboCount = 0;
let isSpinning = false;
let isAutoSpin = false;
let diamonds = 0;

const symbols = ['🍊', '🍒', '🍀', '💰', '🎁', '🧧', '🌟'];
const winConditions = {
    '🧧🧧🧧': { multiplier: 5, freeSpins: 3 },
    '🍀🍀🍀': { multiplier: 3, freeSpins: 2 },
    '💰💰💰': { multiplier: 2, freeSpins: 1 }
};

const shopItems = [
    { name: '双倍奖励卡', cost: 100, effect: () => balance += 1000 },
    { name: '免费旋转券', cost: 50, effect: () => freeSpins += 5 }
];

function updateUI() {
    document.getElementById('balance').textContent = balance;
    document.getElementById('freeSpins').textContent = freeSpins;
    document.getElementById('combo').textContent = comboCount;
    document.getElementById('diamonds').textContent = diamonds;
    document.getElementById('spinBtn').disabled = isSpinning;
}

function getRandomSymbol() {
    return symbols[Math.floor(Math.random() * symbols.length)];
}

function checkWin(reels) {
    const combination = reels.join('');
    for (const [pattern, reward] of Object.entries(winConditions)) {
        if (combination.match(new RegExp(pattern.replace(/🧧/g, '[🧧🌟]')))) {
            return reward;
        }
    }
    return null;
}

function triggerRedEnvelopeRain(count = 5) {
    const container = document.getElementById('redEnvelopeRain');
    for (let i = 0; i < count; i++) {
        const envelope = document.createElement('div');
        envelope.className = 'red-envelope';
        envelope.style.left = `${Math.random() * 90}vw`;
        envelope.onclick = () => {
            balance += 100;
            comboCount++;
            envelope.remove();
            updateUI();
        };
        container.appendChild(envelope);
        setTimeout(() => envelope.remove(), 3000);
    }
}

async function startSpin() {
    if (isSpinning) return;
    
    isSpinning = true;
    updateUI();
    
    // 消耗余额或免费次数
    if (freeSpins > 0) {
        freeSpins--;
    } else {
        balance -= 60;
    }

    // 随机生成结果
    const reels = [
        getRandomSymbol(),
        getRandomSymbol(),
        getRandomSymbol()
    ];

    // 动画效果
    document.querySelectorAll('.reel').forEach((reel, i) => {
        reel.style.transform = 'rotateX(360deg)';
        setTimeout(() => {
            reel.textContent = reels[i];
            reel.style.transform = 'rotateX(0)';
        }, 1000 + i * 300);
    });

    // 检查奖励
    setTimeout(() => {
        const result = checkWin(reels);
        if (result) {
            balance += 60 * result.multiplier;
            freeSpins += result.freeSpins;
            comboCount = 0;
            if (result.multiplier >= 3) triggerRedEnvelopeRain();
        } else {
            comboCount++;
            if (comboCount >= 5) { // 连击保底机制
                freeSpins += Math.floor(comboCount / 5);
                comboCount = 0;
            }
        }

        isSpinning = false;
        updateUI();

        // 自动旋转
        if (isAutoSpin && balance >= 60) {
            startSpin();
        }
    }, 2000);
}

function toggleAutoSpin() {
    isAutoSpin = !isAutoSpin;
    document.getElementById('autoSpinBtn').textContent = isAutoSpin ? '停止自动' : '自动旋转';
    if (isAutoSpin && !isSpinning) startSpin();
}

function checkDailyReward() {
    const lastLogin = localStorage.getItem('lastLogin');
    const today = new Date().toDateString();
    
    if (lastLogin !== today) {
        balance += 300; // 每日奖励
        localStorage.setItem('lastLogin', today);
        alert('每日登录奖励：¥300！');
        updateUI();
    }
}

function updateLeaderboard() {
    const playerName = prompt('请输入您的名字：', '玩家1');
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    leaderboard.push({ name: playerName, balance });
    leaderboard.sort((a, b) => b.balance - a.balance);
    localStorage.setItem('leaderboard', JSON.stringify(leaderboard.slice(0, 5)));
}

function showLeaderboard() {
    const leaderboard = JSON.parse(localStorage.getItem('leaderboard') || '[]');
    alert('排行榜：\n' + leaderboard.map((p, i) => `${i + 1}. ${p.name} - ¥${p.balance}`).join('\n'));
}

function inviteFriend() {
    freeSpins += 1;
    updateUI();
    alert('邀请成功！获得1次免费旋转！');
}

function buyItem(index) {
    const item = shopItems[index];
    if (diamonds >= item.cost) {
        diamonds -= item.cost;
        item.effect();
        updateUI();
        alert(`购买成功：${item.name}！`);
    } else {
        alert('钻石不足！');
    }
}

function watchAd() {
    if (confirm('观看广告可获得100钻石，是否观看？')) {
        diamonds += 100;
        updateUI();
        alert('广告观看完成，获得100钻石！');
    }
}

function purchaseDiamonds(amount) {
    if (confirm(`确认购买${amount}钻石？`)) {
        diamonds += amount;
        updateUI();
        alert(`购买成功，获得${amount}钻石！`);
    }
}

// 初始化
updateUI();
checkDailyReward();