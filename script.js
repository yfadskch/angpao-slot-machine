let balance = 200;
let freeSpins = 0;
let isSpinning = false;
let isAutoSpin = false;
let autoSpinInterval;
let missCount = 0;
const symbols = ["💰", "🎉", "⭐", "💎", "🎁", "🧧", "🎰"];
const AUTO_SPIN_DELAY = 1500;

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
    }, AUTO_SPIN_DELAY);
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
                // Show free spin popup
                showFreeSpinPopup();
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
    effect.textContent = `You got ${count} free spins!`;
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 3000);
}

// Red Packet Rain Logic
function startRedPacketRain() {
    const redPacketRain = document.getElementById('redPacketRain');
    redPacketRain.style.display = 'flex';

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

        // Resume auto spin if it was active
        if (isAutoSpin) startAutoSpin();
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
        document.getElementById('balance').textContent = balance;
        showWinEffect(reward);
    } else if (rewardType < 0.9) {
        // 30% chance: Free spins (1, 2, or 3)
        const freeSpinCount = Math.floor(Math.random() * 3) + 1;
        freeSpins += freeSpinCount;
        document.getElementById('freespins').textContent = freeSpins;
        showFreeSpinEffect(freeSpinCount);
    } else {
        // 10% chance: Special reward (double bonus)
        alert('Congratulations! You got a double bonus!');
        // Add double bonus logic here if needed
    }

    packet.remove(); // Remove the packet after clicking
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
        button.addEventListener('click', () => handleFreeSpinOptionClick(button));
    });
}

// Handle free spin option click
function handleFreeSpinOptionClick(button) {
    const freeSpinCount = parseInt(button.dataset.freeSpins);
    freeSpins += freeSpinCount;
    document.getElementById('freespins').textContent = freeSpins;

    // Show free spin count
    button.textContent = `${freeSpinCount} spins`;

    // Close popup after 2 seconds
    setTimeout(() => {
        document.getElementById('freeSpinPopup').style.display = 'none';

        // Resume auto spin if it was active
        if (isAutoSpin) startAutoSpin();
    }, 2000);

    // Start free spins
    startFreeSpin();
}

// Start free spins
function startFreeSpin() {
    if (freeSpins > 0) {
        startSpin(); // Start the spin
        freeSpins--; // Decrement free spins by 1
        document.getElementById('freespins').textContent = freeSpins;

        // If there are remaining free spins, continue
        if (freeSpins > 0) {
            setTimeout(startFreeSpin, 1500); // Delay 1.5 seconds before next spin
        }
    }
}