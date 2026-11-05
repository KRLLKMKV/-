const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelDisplay = document.getElementById('levelDisplay');
const fishDisplay = document.getElementById('fishDisplay');
const winScreen = document.getElementById('winScreen');
const blockSize = 30; 

const catImage = new Image();
catImage.src = 'cat1.png';

let player = { x: 0, y: 0, size: 22, speed: 3 };
let keys = {}; let fishList = []; let enemies = [];    

const levelStrings = [
    "11111111111111111111120F100000100F000001111010111010111111011000001010001000E101101111101111101101011010F000000000100101101011111111101011011E001000F000100010011111101111101111101110000E10001000F01001101111101011111011011010000010100010000110101111101010111101100F100000001000F03111111111111111111111",
    "111111111111111111111200E0100F0000100F3111111010111110101111100F10101000101000011010101010101011110110100E0010100F00010110111111101111110101100F0000000000010101111111101111110101011000E010100F010E0101101110101011011111011010100000100000000110101111111111111101100F000F00E000000F0111111111111111111111"
];

let currentLevelIndex = 0; let currentMap = [];

function parseMap(levelStr) {
    let map = []; fishList = []; enemies = [];
    for (let i = 0; i < 15; i++) {
        let rowStr = levelStr.substring(i * 20, (i + 1) * 20); let rowArr = [];
        for (let c = 0; c < rowStr.length; c++) {
            let char = rowStr[c];
            if (char === '1') rowArr.push(1);
            else if (char === '2') rowArr.push(2);
            else if (char === '3') rowArr.push(3);
            else if (char === 'F') { rowArr.push(0); fishList.push({ x: c * blockSize + 15, y: i * blockSize + 15, radius: 6 }); }
            else if (char === 'E') { rowArr.push(0); enemies.push({ x: c * blockSize + 5, y: i * blockSize + 5, size: 20, dx: Math.random() > 0.5 ? 1.5 : -1.5, dy: 0 }); }
            else rowArr.push(0);
        }
        map.push(rowArr);
    }
    return map;
}

function initLevel(index) {
    if (index >= levelStrings.length) { canvas.style.display = 'none'; winScreen.style.display = 'block'; return; }
    currentLevelIndex = index; levelDisplay.textContent = currentLevelIndex + 1;
    currentMap = parseMap(levelStrings[currentLevelIndex]); fishDisplay.textContent = fishList.length;
    resetPlayerPosition();
}

function resetPlayerPosition() {
    for (let r = 0; r < currentMap.length; r++) {
        for (let c = 0; c < currentMap[r].length; c++) {
            if (currentMap[r][c] === 2) {
                player.x = c * blockSize + (blockSize - player.size) / 2; player.y = r * blockSize + (blockSize - player.size) / 2;
            }
        }
    }
}

function checkCollision(x, y, size) {
    let corners = [{x: x, y: y}, {x: x + size, y: y}, {x: x, y: y + size}, {x: x + size, y: y + size}];
    for (let corner of corners) {
        let c = Math.floor(corner.x / blockSize); let r = Math.floor(corner.y / blockSize);
        if (r < 0 || r >= currentMap.length || c < 0 || c >= currentMap[r].length || currentMap[r][c] === 1) return true;
    }
    return false;
}

function update() {
    let nextX = player.x; let nextY = player.y;
    if (keys['ArrowUp'] || keys['w'] || keys['W'] || keys['ц'] || keys['Ц']) nextY -= player.speed;
    if (keys['ArrowDown'] || keys['s'] || keys['S'] || keys['ы'] || keys['Ы']) nextY += player.speed;
    if (!checkCollision(player.x, nextY, player.size)) player.y = nextY;
    if (keys['ArrowLeft'] || keys['a'] || keys['A'] || keys['ф'] || keys['Ф']) nextX -= player.speed;
    if (keys['ArrowRight'] || keys['d'] || keys['D'] || keys['в'] || keys['В']) nextX += player.speed;
    if (!checkCollision(nextX, player.y, player.size)) player.x = nextX;

    let pCenterX = player.x + player.size / 2; let pCenterY = player.y + player.size / 2;
    for (let i = fishList.length - 1; i >= 0; i--) {
        let fish = fishList[i]; let dist = Math.hypot(pCenterX - fish.x, pCenterY - fish.y);
        if (dist < player.size / 2 + fish.radius) { fishList.splice(i, 1); fishDisplay.textContent = fishList.length; }
    }

    for (let enemy of enemies) {
        let nextEx = enemy.x + enemy.dx; let nextEy = enemy.y + enemy.dy;
        if (checkCollision(nextEx, nextEy, enemy.size)) { enemy.dx = -enemy.dx; enemy.dy = -enemy.dy; } 
        else { enemy.x = nextEx; enemy.y = nextEy; }
        if (player.x < enemy.x + enemy.size && player.x + player.size > enemy.x && player.y < enemy.y + enemy.size && player.y + player.size > enemy.y) resetPlayerPosition();
    }

    if (fishList.length === 0) {
        let centerC = Math.floor(pCenterX / blockSize); let centerR = Math.floor(pCenterY / blockSize);
        if (currentMap[centerR] && currentMap[centerR][centerC] === 3) initLevel(currentLevelIndex + 1);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем карту лабиринта и выходы
    for (let r = 0; r < currentMap.length; r++) {
        for (let c = 0; c < currentMap[r].length; c++) {
            if (currentMap[r][c] === 1) { 
                ctx.fillStyle = '#2c3e50'; 
                ctx.fillRect(c * blockSize, r * blockSize, blockSize, blockSize); 
            } else if (currentMap[r][c] === 3) {
                ctx.fillStyle = fishList.length === 0 ? '#2ed573' : '#7bed9f'; 
                ctx.fillRect(c * blockSize, r * blockSize, blockSize, blockSize);
                if (fishList.length > 0) { 
                    ctx.fillStyle = '#333'; 
                    ctx.font = '12px Arial'; 
                    ctx.fillText('🔒', c * blockSize + 7, r * blockSize + 20); 
                }
            }
        }
    }
    
    // Рисуем рыбок
    for (let fish of fishList) { 
        ctx.beginPath(); 
        ctx.ellipse(fish.x, fish.y, fish.radius + 3, fish.radius, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#fffa65';
        ctx.fill();
        ctx.closePath();
    }

    // Рисуем врагов (красные кубики-пылесосы)
    for (let enemy of enemies) {
        ctx.fillStyle = '#ff4757';
        ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
    }

    // Рисуем главного героя — котика
    if (catImage.complete && catImage.naturalWidth !== 0) {
        ctx.drawImage(catImage, player.x, player.y, player.size, player.size);
    } else {
        // Запасной вариант, если картинка не загрузилась — рисуем оранжевый квадратик
        ctx.fillStyle = '#ffa500';
        ctx.fillRect(player.x, player.y, player.size, player.size);
    }
}

// Отслеживание нажатий клавиш
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// Главный игровой цикл
function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Старт игры
initLevel(0);
gameLoop();
