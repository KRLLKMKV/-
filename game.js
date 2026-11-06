const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const levelDisplay = document.getElementById('levelDisplay');
const fishDisplay = document.getElementById('fishDisplay');
const winScreen = document.getElementById('winScreen');
const blockSize = 30;
const catImage = new Image();
catImage.src = 'cat1.png';

let player = new Player(); // Убедитесь, что класс Player описан в вашем коде
let keys = {};
let fishList = [];
let entities = [];

// Длинные текстовые строчки — это зашифрованные карты уровней (15 строк по 20 символов)
const levelStrings = [
    // Уровень 1 - Рабочий
    "11111111111111111111" +
    "121.1V1.1V1F......F1" +
    "1.1.1.1.1.1.111111.1" +
    "1.1.1.1.1.1.1....1.1" +
    "1F.V.F.V.F..1....1.1" +
    "111111111111111111F1" +
    "1.................31" +
    "1..................1" +
    "1..................1" +
    "1..................1" +
    "1..................1" +
    "1..................1" +
    "1..................1" +
    "1..................1" +
    "11111111111111111111", // Запятая в конце обязательна

    // Уровень 2
    "11111111111111111111" +
    "12.F1.....1..F.....1" +
    "111.1.111.1.111111.1" +
    "1.....1.1...1...E1.1" +
    "1.11111.11111.11.1.1" +
    "1F1...........1.1.11" + // ИСПРАВЛЕНО: было 19 символов, добавлена '1' в конце
    "1.1.111111111.1.11.1" +
    "1E..1...F...1...1..1" +
    "11111.11111.11111.11" +
    "1....E1...1...F.1..1" +
    "1.11111.1.11111.11.1" +
    "1.1.....1.1...1....1" +
    "1.1.11111.1.1.1111.1" +
    "1..F1.......1...F.31" +
    "11111111111111111111"
];

let currentLevelIndex = 0;
let currentMap = [];

// === БЛОК 4: ФУНКЦИИ ЛОГИКИ ИГРЫ ===

function parseMap(levelStr) {
    let map = [];
    fishList = [];
    entities = [];
    
    for (let i = 0; i < 15; i++) { 
        let rowStr = levelStr.substring(i * 20, (i + 1) * 20); 
        let rowArr = []; 
        
        for (let c = 0; c < rowStr.length; c++) { 
            let char = rowStr[c]; 
            
            if (char === '1') rowArr.push(1); 
            else if (char === '2') rowArr.push(2); 
            else if (char === '3') rowArr.push(3); 
            else if (char === 'F') { 
                rowArr.push(0); 
                fishList.push({ x: c * blockSize + 15, y: i * blockSize + 15, radius: 6 }); 
            }
            else if (char === 'E') { 
                rowArr.push(0); 
                // Убедитесь, что класс HorizontalRedCube существует
                entities.push(new HorizontalRedCube(c, i)); 
            }
            else if (char === 'V') {
                rowArr.push(0);
                // ИСПРАВЛЕНО: добавлен метод move() прямо в объект, чтобы он мог двигаться
                entities.push({ 
                    x: c * blockSize + 5, 
                    y: i * blockSize + 5, 
                    size: 20, 
                    dx: 0, 
                    dy: Math.random() > 0.5 ? 1.5 : -1.5,
                    move: function() {
                        let nextEx = this.x + this.dx;
                        let nextEy = this.y + this.dy;
                        if (checkCollision(nextEx, nextEy, this.size)) { 
                            this.dx = -this.dx; 
                            this.dy = -this.dy; 
                        } else { 
                            this.x = nextEx; 
                            this.y = nextEy; 
                        }
                    }
                });
            }
            else {
                rowArr.push(0);
            }
        }
        map.push(rowArr);
    }
    return map; 
}

function initLevel(index) {
    if (index >= levelStrings.length) { 
        canvas.style.display = 'none'; 
        winScreen.style.display = 'block'; 
        return; 
    }
    
    currentLevelIndex = index; 
    levelDisplay.textContent = currentLevelIndex + 1; 
    currentMap = parseMap(levelStrings[currentLevelIndex]); 
    fishDisplay.textContent = fishList.length; 
    resetPlayerPosition(); 
}

function resetPlayerPosition() {
    for (let r = 0; r < currentMap.length; r++) { 
        for (let c = 0; c < currentMap[r].length; c++) { 
            if (currentMap[r][c] === 2) { 
                player.x = c * blockSize + (blockSize - player.size) / 2; 
                player.y = r * blockSize + (blockSize - player.size) / 2;
            }
        }
    }
}

function checkCollision(x, y, size) {
    let corners = [{x: x, y: y}, {x: x + size, y: y}, {x: x, y: y + size}, {x: x + size, y: y + size}];
    
    for (let corner of corners) {
        let c = Math.floor(corner.x / blockSize); 
        let r = Math.floor(corner.y / blockSize);
        
        if (r < 0 || r >= currentMap.length || c < 0 || c >= currentMap[r].length || currentMap[r][c] === 1) return true;
    }
    return false; 
}

// ИСПРАВЛЕНО: Функция update() теперь корректно содержит всю логику
function update() {
    // 1. Движение котика
    player.move(keys);

    // 2. Сбор рыбок
    let pCenterX = player.x + player.size / 2; 
    let pCenterY = player.y + player.size / 2;
    
    for (let i = fishList.length - 1; i >= 0; i--) {
        let fish = fishList[i];
        let dist = Math.hypot(pCenterX - fish.x, pCenterY - fish.y);
        
        if (dist < player.size / 2 + fish.radius) {
            fishList.splice(i, 1);
            fishDisplay.textContent = fishList.length;
        }
    }

    // 3. Движение сущностей (красных кубиков) и проверка столкновений
    for (let entity of entities) {
        entity.move(); // Вызываем метод move (работает и для 'E', и для 'V')

        // Проверка столкновения кота с кубиком
        if (player.x < entity.x + entity.size &&
            player.x + player.size > entity.x &&
            player.y < entity.y + entity.size &&
            player.y + player.size > entity.y) {
            resetPlayerPosition();
        }
    }

    // 4. Проверка перехода на следующий уровень
    if (fishList.length === 0) {
        let centerC = Math.floor(pCenterX / blockSize);
        let centerR = Math.floor(pCenterY / blockSize);

        if (currentMap[centerR] && currentMap[centerR][centerC] === 3) {
            initLevel(currentLevelIndex + 1);
        }
    }
} // Конец функции update (лишний мусор удален)

// === БЛОК 5: ГРАФИКА (РИСОВАНИЕ ОБЪЕКТОВ НА ЭКРАНЕ) ===
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); 

    // Рисуем карту лабиринта и выходы
    for (let r = 0; r < currentMap.length; r++) { 
        for (let c = 0; c < currentMap[r].length; c++) { 
            if (currentMap[r][c] === 1) { 
                ctx.fillStyle = '#269926'; 
                ctx.fillRect(c * blockSize + 2, r * blockSize + 2, blockSize - 4, blockSize - 4); 
                ctx.strokeStyle = '#000000'; 
                ctx.lineWidth = 2; 
                ctx.strokeRect(c * blockSize + 2, r * blockSize + 2, blockSize - 4, blockSize - 4); 
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

    // Рисуем рыбок на холсте
    for (let fish of fishList) {
        ctx.beginPath(); 
        ctx.ellipse(fish.x, fish.y, fish.radius + 3, fish.radius, 0, 0, Math.PI * 2); 
        ctx.fillStyle = '#FFB000'; 
        ctx.fill(); 
        ctx.closePath(); 
    }

    // Рисуем сущности (красные кубики)
    for (let entity of entities) {
        ctx.fillStyle = '#FF0000'; 
        ctx.fillRect(entity.x, entity.y, entity.size, entity.size); 
        ctx.strokeStyle = '#000000'; 
        ctx.lineWidth = 2; 
        ctx.strokeRect(entity.x, entity.y, entity.size, entity.size); 
    }

    // Просим котика нарисовать самого себя
    player.draw(ctx, catImage);
} 

// === БЛОК 6: СЛУШАТЕЛИ КЛАВИАТУРЫ ===
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

// === БЛОК 7: ЗАПУСК ИГРОВОГО ДВИЖКА ===
function gameLoop() {
    update(); 
    draw(); 
    requestAnimationFrame(gameLoop); 
}

// Старт игры
initLevel(0); 
gameLoop(); 
