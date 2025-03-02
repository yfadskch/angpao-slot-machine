let balance = 200;
let freeSpins = 0;
let isSpinning = false;
let isAutoSpin = false;
let isFreeSpinActive = false; // 标记是否处于免费旋转状态
let autoSpinInterval;
let missCount = 0;
const symbols = ["💰", "🎉", "⭐", "💎", "🎁", "🧧", "🎰"];
const SPIN_DELAY = 1500; // 旋转动画延迟时间（1.5 秒）
const STOP_DELAY = 500; // 每个格子停止的间隔时间（0.5 秒）

// 记录红包雨的结果
let redPacketResults = {
    redPackets: 0, // 获得的红包数量
    freeSpins: 0, // 获得的免费旋转次数
};

// Ensure events are bound after the page loads
window.addEventListener('load', () => {
    document.getElementById('spinButton').addEventListener('click', startSpin);
    document.getElementById('autoSpinButton').addEventListener('click', toggleAutoSpin);
});

function toggleAutoSpin() {
    if (isSpinning) return; // Prevent conflicts
    
    isAutoSpin = !isAutoSpin;
    const btn = document.getElementById('autoSpinButton');
    
    if (isAutoSpin) {
        btn.classList.add('active');
        btn.textContent = '⏹ Stop Auto';
        startAutoSpin();
    } else {
        stopAutoSpin();
        btn.classList.remove('active');
        btn.textContent = '⚡ Auto Spin';
    }
}

function startAutoSpin() {
    // Clear existing interval
    if (autoSpinInterval) clearInterval(autoSpinInterval);
    
    autoSpinInterval = setInterval(() => {
        if (canSpin()) startSpin();
        else {
            stopAutoSpin();
            alert('Insufficient balance, auto spin stopped');
        }
    }, SPIN_DELAY);
}

function stopAutoSpin() {
    clearInterval(autoSpinInterval);
    isAutoSpin = false;
    const btn = document.getElementById('autoSpinButton');
    btn.classList.remove('active');
    btn.textContent = '⚡ Auto Spin';
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
        alert('Cannot spin! Insufficient balance');
        return;
    }

    isSpinning = true;
    disableControls(true);

    // Only deduct balance if not using free spins
    if (freeSpins === 0) {
        balance -= bet;
    }
    document.getElementById('balance').textContent = balance;
    document.getElementById('freespins').textContent = freeSpins;

    // Reset slot display before starting animation
    resetSlots();

    // Start spinning animation for all slots
    startSlotAnimation();

    // Generate results
    const results = generateResults();

    // Stop slots one by one
    stopSlotsOneByOne(results, bet);
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

        // Calculate win amount based on symbol
        switch (symbol) {
            case '💰':
                winAmount = bet * 1; // 1x
                break;
            case '🎉':
                winAmount = bet * 2; // 2x
                break;
            case '⭐':
                winAmount = bet * 3; // 3x
                break;
            case '💎':
                winAmount = bet * 15; // 15x
                break;
            case '🎁':
                // Pause auto spin
                if (isAutoSpin) stopAutoSpin();

                // If already in free spin mode, add free spins directly
                if (isFreeSpinActive) {
                    const freeSpinCount = Math.floor(Math.random() * 5) + 1; // Random 1 to 5 free spins
                    freeSpins += freeSpinCount; // 累加免费旋转次数
                    document.getElementById('freespins').textContent = freeSpins;
                    showFreeSpinEffect(freeSpinCount);
                } else {
                    // Show free spin popup
                    showFreeSpinPopup();
                }
                break;
            case '🧧':
                // Pause auto spin
                if (isAutoSpin) stopAutoSpin();
                // Start red packet rain
                startRedPacketRain();
                break;
            case '🎰':
                // Random multiplier between 50x and 125x
                const randomMultiplier = Math.floor(Math.random() * 76) + 50; // 50 to 125
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

function resetSlots() {
    const slots = document.querySelectorAll('.slot');
    slots.forEach(slot => {
        slot.textContent = '🎰'; // Reset to default symbol
        slot.style.animation = ''; // Clear animation
        slot.classList.remove('result-animation'); // Remove result animation
    });
}

function stopSlotsOneByOne(results, bet) {
    const slots = document.querySelectorAll('.slot');

    // Stop first slot
    setTimeout(() => {
        slots[0].style.animation = '';
        slots[0].textContent = results[0];
        slots[0].classList.add('result-animation');
    }, STOP_DELAY);

    // Stop second slot
    setTimeout(() => {
        slots[1].style.animation = '';
        slots[1].textContent = results[1];
        slots[1].classList.add('result-animation');
    }, STOP_DELAY * 2);

    // Stop third slot
    setTimeout(() => {
        slots[2].style.animation = '';
        slots[2].textContent = results[2];
        slots[2].classList.add('result-animation');

        // After all slots stop, check win
        setTimeout(() => {
            checkWin(results, bet);
            isSpinning = false;
            disableControls(false);
        }, 500); // Wait a bit before checking win
    }, STOP_DELAY * 3);
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
    effect.textContent = `You got ${count} free spins!`;
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 3000);
}

// Red Packet Rain Logic
function startRedPacketRain() {
    const redPacketRain = document.getElementById('redPacketRain');
    redPacketRain.style.display = 'flex';

    // Reset red packet results
    redPacketResults = {
        redPackets: 0,
        freeSpins: 0,
    };

    // Generate 9 to 15 red packets
    const packetCount = Math.floor(Math.random() * 7) + 9;
    for (let i = 0; i < packetCount; i++) {
        const packet = document.createElement('div');
        packet.className = 'red-packet';

        // Random horizontal position (5% to 95%)
        packet.style.left = `${Math.random() * 90 + 5}%`;

        // Random animation duration (3s to 8s)
        const animationDuration = `${Math.random() * 5 + 3}s`;
        packet.style.animationDuration = animationDuration;

        packet.textContent = '🧧';
        packet.addEventListener('click', () => handleRedPacketClick(packet));
        redPacketRain.appendChild(packet);
    }

    // End red packet rain after 10 seconds
    setTimeout(() => {
        redPacketRain.style.display = 'none';
        redPacketRain.innerHTML = ''; // Clear red packets

        // Show total results after red packet rain ends
        showRedPacketResults();

        // If free spins were obtained, prioritize them
        if (redPacketResults.freeSpins > 0) {
            freeSpins += redPacketResults.freeSpins;
            document.getElementById('freespins').textContent = freeSpins;
            isFreeSpinActive = true;
            startFreeSpin(redPacketResults.freeSpins);
        } else if (isAutoSpin) {
            startAutoSpin();
        }
    }, 10000);
}

// Handle red packet click
function handleRedPacketClick(packet) {
    const bet = parseInt(document.getElementById('betAmount').value);
    const rewardType = Math.random();

    if (rewardType < 0.6) {
        // 60% chance: Small reward (1x to 5x)
        const multiplier = Math.floor(Math.random() * 5) + 1;
        const reward = bet * multiplier;
        balance += reward;
        redPacketResults.redPackets += reward; // Record red packet reward
    } else if (rewardType < 0.9) {
        // 30% chance: Free spins (1, 2, or 3)
        const freeSpinCount = Math.floor(Math.random() * 3) + 1;
        redPacketResults.freeSpins += freeSpinCount; // Record free spins
    } else {
        // 10% chance: Special reward (double bonus)
        alert('Congratulations! You got a double bonus!');
        // Add double bonus logic here if needed
    }

    packet.remove(); // Remove the packet after clicking
}

// Show total red packet results
function showRedPacketResults() {
    const message = `You got ${redPacketResults.redPackets} red packets and ${redPacketResults.freeSpins} free spins!`;
    alert(message); // Show total results
}

// Free Spin Popup Logic
function showFreeSpinPopup() {
    const freeSpinPopup = document.getElementById('freeSpinPopup');
    const freeSpinButtons = freeSpinPopup.querySelectorAll('.free-spin-option');

    // Randomly assign free spin counts (5, 8, 11)
    const freeSpinOptions = [5, 8, 11];
    freeSpinButtons.forEach(button => {
        const randomIndex = Math.floor(Math.random() * freeSpinOptions.length);
        const freeSpinCount = freeSpinOptions.splice(randomIndex, 1)[0];
        button.dataset.freeSpins = freeSpinCount; // Store count in data attribute
        button.textContent = '？'; // Reset button text to "？"
    });

    // Randomize button positions
    const buttonsContainer = freeSpinPopup.querySelector('.free-spin-buttons');
    for (let i = buttonsContainer.children.length; i >= 0; i--) {
        buttonsContainer.appendChild(buttonsContainer.children[Math.random() * i | 0]);
    }

    // Show popup
    freeSpinPopup.style.display = 'flex';

    // Bind button click events
    freeSpinButtons.forEach(button => {
        // Remove existing event listeners to avoid duplicates
        button.removeEventListener('click', handleFreeSpinOptionClick);
        // Add new event listener
        button.addEventListener('click', () => handleFreeSpinOptionClick(button, freeSpinButtons));
    });
}

// Handle free spin option click
function handleFreeSpinOptionClick(selectedButton, allButtons) {
    const freeSpinCount = parseInt(selectedButton.dataset.freeSpins);
    freeSpins += freeSpinCount;
    document.getElementById('freespins').textContent = freeSpins;

    // Show selected free spin count
    selectedButton.textContent = `${freeSpinCount} spins`;

    // Disable all buttons after selection
    allButtons.forEach(button => {
        button.disabled = true;
    });

    // Close popup after 2 seconds
    setTimeout(() => {
        document.getElementById('freeSpinPopup').style.display = 'none';

        // Mark free spin as active
        isFreeSpinActive = true;

        // Start free spins
        startFreeSpin(freeSpinCount);
    }, 2000);
}

// Start free spins
function startFreeSpin(totalFreeSpins) {
    if (totalFreeSpins > 0) {
        startSpin(); // Start the spin
        totalFreeSpins--; // Decrement the remaining free spins
        freeSpins = totalFreeSpins; // Update the global freeSpins variable
        document.getElementById('freespins').textContent = freeSpins;

        // If there are remaining free spins, continue
        if (totalFreeSpins > 0) {
            setTimeout(() => startFreeSpin(totalFreeSpins), SPIN_DELAY); // Delay 1.5 seconds before next spin
        } else {
            // Free spins ended, reset the flag
            isFreeSpinActive = false;
        }
    }
}