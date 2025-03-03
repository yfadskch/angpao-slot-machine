let balance = 3000;
let freeSpins = 0;
let comboCount = 0;
let isSpinning = false;
let isAutoSpin = false;

const symbols = ['🍊', '🍒', '🍀', '💰', '🎁', '🧧'];
const winConditions = {
    '🧧🧧🧧': { multiplier: 5, freeSpins: 3 },
    '🍀🍀🍀': { multiplier: 3, freeSpins: 2 },
    '💰💰💰': { multiplier: 2, freeSpins: 1 }
};

function updateUI() {
    document.getElementById('balance').textContent = balance;
    document.getElementById('freeSpins').textContent = freeSpins;
    document.getElementById('combo').textContent = comboCount;
    document.getElementById('spinBtn').disabled = isSpinning;
}

function getRandomSymbol() {
    return symbols[Math.floor(Math.random() * symbols.length)];
}

function checkWin(reels) {
    const combination = reels.join('');
    return winConditions[combination] || null;
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

// 初始化
updateUI();