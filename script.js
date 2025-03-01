let balance = 200;
let freeSpins = 0;
let isSpinning = false;
let isAutoSpin = false;
let autoSpinInterval;
let missCount = 0;
const symbols = ["💰", "🎉", "⭐", "💎", "🎁", "🧧", "🎰"];
const AUTO_SPIN_DELAY = 1500;

// 确保页面加载完成后绑定事件
window.addEventListener('load', () => {
    document.getElementById('spinButton').addEventListener('click', startSpin);
    document.getElementById('autoSpinButton').addEventListener('click', toggleAutoSpin);
});

function toggleAutoSpin() {
    if (isSpinning) return; // 防止冲突
    
    isAutoSpin = !isAutoSpin;
    const btn = document.getElementById('autoSpinButton');
    
    if (isAutoSpin) {
        btn.classList.add('active');
        btn.textContent = '⏹ 停止自动';
        startAutoSpin();
    } else {
        stopAutoSpin();
        btn.classList.remove('active');
        btn.textContent = '⚡ 自动旋转';
    }
}

function startAutoSpin() {
    // 先停止已有定时器
    if (autoSpinInterval) clearInterval(autoSpinInterval);
    
    autoSpinInterval = setInterval(() => {
        if (canSpin()) startSpin();
        else {
            stopAutoSpin();
            alert('余额不足，自动停止');
        }
    }, AUTO_SPIN_DELAY);
}

function stopAutoSpin() {
    clearInterval(autoSpinInterval);
    isAutoSpin = false;
    const btn = document.getElementById('autoSpinButton');
    btn.classList.remove('active');
    btn.textContent = '⚡ 自动旋转';
}

function canSpin() {
    const bet = parseInt(document.getElementById('betAmount').value);
    return (balance >= bet || freeSpins > 0);
}

function startSpin() {
    if (isSpinning) return;
    
    const bet = parseInt(document.getElementById('betAmount').value);
    
    if (!canSpin()) {
        if (isAutoSpin) stopAutoSpin();
        alert('无法旋转！余额不足');
        return;
    }

    isSpinning = true;
    disableControls(true);

    if (freeSpins > 0) {
        freeSpins--;
    } else {
        balance -= bet;
    }
    document.getElementById('balance').textContent = balance;
    document.getElementById('freespins').textContent = freeSpins;

    startSlotAnimation();

    setTimeout(() => {
        const results = generateResults();
        updateSlots(results);
        checkWin(results, bet);
        
        isSpinning = false;
        disableControls(false);
    }, 1500);
}

function generateResults() {
    const probability = getCurrentProbability();
    const shouldWin = Math.random() < probability;

    if (shouldWin) {
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        return [symbol, symbol, symbol];
    } else {
        return [
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)],
            symbols[Math.floor(Math.random() * symbols.length)]
        ];
    }
}

function getCurrentProbability() {
    const baseProbability = 0.1;
    const increment = 0.15;
    return Math.min(baseProbability + (missCount * increment), 1);
}

function checkWin(results, bet) {
    if (results[0] === results[1] && results[1] === results[2]) {
        const symbol = results[0];
        let winAmount = 0;

        // 根据符号类型计算奖金
        switch (symbol) {
            case '💰':
                winAmount = bet * 1; // 1 倍
                break;
            case '🎉':
                winAmount = bet * 2; // 2 倍
                break;
            case '⭐':
                winAmount = bet * 3; // 3 倍
                break;
            case '💎':
                winAmount = bet * 15; // 15 倍
                break;
            case '🎁':
                // 暂停自动旋转
                if (isAutoSpin) stopAutoSpin();
                // 触发盲盒式免费旋转弹窗
                showFreeSpinPopup();
                break;
            case '🧧':
                // 暂停自动旋转
                if (isAutoSpin) stopAutoSpin();
                // 触发红包雨
                startRedPacketRain();
                break;
            case '🎰':
                // 随机 50 倍到 125 倍
                const randomMultiplier = Math.floor(Math.random() * 76) + 50; // 50 到 125
                winAmount = bet * randomMultiplier;
                break;
        }

        if (winAmount > 0) {
            balance += winAmount;
            document.getElementById('balance').textContent = balance;
            showWinEffect(winAmount);
        }

        missCount = 0;
    } else {
        missCount++;
    }
}

function startSlotAnimation() {
    document.querySelectorAll('.slot').forEach(slot => {
        slot.style.animation = 'slotShake 0.2s infinite';
    });
}

function updateSlots(results) {
    const slots = document.querySelectorAll('.slot');
    slots.forEach((slot, index) => {
        slot.style.animation = '';
        slot.textContent = results[index];
        slot.classList.add('result-animation');
        setTimeout(() => slot.classList.remove('result-animation'), 500);
    });
}

function disableControls(disabled) {
    document.getElementById('spinButton').disabled = disabled;
    document.getElementById('autoSpinButton').disabled = disabled;
}

function showWinEffect(amount) {
    const effect = document.createElement('div');
    effect.className = 'win-effect';
    effect.textContent = `+${amount}`;
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 2000);
}

function showFreeSpinEffect(count) {
    const effect = document.createElement('div');
    effect.className = 'free-spin-effect';
    effect.textContent = `获得 ${count} 次免费旋转！`;
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 3000);
}

// 红包雨逻辑
function startRedPacketRain() {
    const redPacketRain = document.getElementById('redPacketRain');
    redPacketRain.style.display = 'flex';

    // 生成 9 到 15 个红包
    const packetCount = Math.floor(Math.random() * 7) + 9;
    for (let i = 0; i < packetCount; i++) {
        const packet = document.createElement('div');
        packet.className = 'red-packet';
        packet.style.left = `${Math.random() * 90 + 5}%`; // 随机水平位置
        packet.textContent = '🧧';
        packet.addEventListener('click', () => handleRedPacketClick(packet));
        redPacketRain.appendChild(packet);
    }

    // 10 秒后结束红包雨
    setTimeout(() => {
        redPacketRain.style.display = 'none';
        redPacketRain.innerHTML = ''; // 清空红包

        // 如果之前是自动旋转模式，恢复自动旋转
        if (isAutoSpin) startAutoSpin();
    }, 10000);
}

// 处理红包点击事件
function handleRedPacketClick(packet) {
    const bet = parseInt(document.getElementById('betAmount').value);
    const rewardType = Math.random();

    if (rewardType < 0.6) {
        // 60% 概率：小额奖金（1 倍到 5 倍）
        const multiplier = Math.floor(Math.random() * 5) + 1;
        const reward = bet * multiplier;
        balance += reward;
        document.getElementById('balance').textContent = balance;
        showWinEffect(reward);
    } else if (rewardType < 0.9) {
        // 30% 概率：免费旋转（1 次、2 次或 3 次）
        const freeSpinCount = Math.floor(Math.random() * 3) + 1;
        freeSpins += freeSpinCount;
        document.getElementById('freespins').textContent = freeSpins;
        showFreeSpinEffect(freeSpinCount);
    } else {
        // 10% 概率：特殊奖励（双倍奖金）
        alert('恭喜！获得双倍奖金奖励！');
        // 这里可以添加双倍奖金的逻辑
    }

    packet.remove(); // 点击后移除红包
}

// 盲盒式免费旋转弹窗逻辑
function showFreeSpinPopup() {
    const freeSpinPopup = document.getElementById('freeSpinPopup');
    const freeSpinButtons = freeSpinPopup.querySelectorAll('.free-spin-option');

    // 随机分配免费旋转次数（5、8、11）
    const freeSpinOptions = [5, 8, 11];
    freeSpinButtons.forEach(button => {
        const randomIndex = Math.floor(Math.random() * freeSpinOptions.length);
        const freeSpinCount = freeSpinOptions.splice(randomIndex, 1)[0];
        button.dataset.freeSpins = freeSpinCount; // 将次数存储在 data 属性中
    });

    // 随机排列按钮位置
    const buttonsContainer = freeSpinPopup.querySelector('.free-spin-buttons');
    for (let i = buttonsContainer.children.length; i >= 0; i--) {
        buttonsContainer.appendChild(buttonsContainer.children[Math.random() * i | 0]);
    }

    // 显示弹窗
    freeSpinPopup.style.display = 'flex';

    // 绑定按钮点击事件
    freeSpinButtons.forEach(button => {
        button.addEventListener('click', () => handleFreeSpinOptionClick(button));
    });
}

// 处理盲盒按钮点击事件
function handleFreeSpinOptionClick(button) {
    const freeSpinCount = parseInt(button.dataset.freeSpins);
    freeSpins += freeSpinCount;
    document.getElementById('freespins').textContent = freeSpins;

    // 显示免费旋转次数
    button.textContent = `${freeSpinCount} 次`;

    // 关闭弹窗
    setTimeout(() => {
        document.getElementById('freeSpinPopup').style.display = 'none';

        // 如果之前是自动旋转模式，恢复自动旋转
        if (isAutoSpin) startAutoSpin();
    }, 2000);

    // 开始免费旋转
    startFreeSpin();
}

// 开始免费旋转
function startFreeSpin() {
    if (freeSpins > 0) {
        startSpin();
        freeSpins--;
        document.getElementById('freespins').textContent = freeSpins;

        // 如果还有免费旋转次数，继续旋转
        if (freeSpins > 0) {
            setTimeout(startFreeSpin, 1500); // 延迟 1.5 秒后继续
        }
    }
}