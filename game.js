// === БЛОК 1: ПОИСК ЭЛЕМЕНТОВ НА СТРАНИЦЕ И НАСТРОЙКИ СЕТКИ ===
const canvas = document.getElementById('gameCanvas'); // Находим холст игры в HTML по его ID
const ctx = canvas.getContext('2d'); // Включаем режим 2D-рисования на холсте
const levelDisplay = document.getElementById('levelDisplay'); // Находим текстовый блок для вывода номера уровня
const fishDisplay = document.getElementById('fishDisplay'); // Находим текстовый блок для вывода количества оставшихся рыбок
const winScreen = document.getElementById('winScreen'); // Находим блок экрана победы
const blockSize = 30; // Задаем размер одной клетки лабиринта в пикселях (30х30)

// === БЛОК 2: ЗАГРУЗКА СПРАЙТОВ ===
const catImage = new Image(); // Создаем виртуальный объект изображения в памяти
catImage.src = 'cat1.png'; // Указываем путь к картинке котика

// === БЛОК 3: ПЕРЕМЕННЫЕ ИГРОКА И СУЩНОСТЕЙ ===
let player = { x: 0, y: 0, size: 22, speed: 3 }; // Объект котика: стартовые координаты, размер (22 пикселя) и скорость движения
let keys = {}; // Сюда мы будем записывать, какие клавиши зажаты в данный момент
let fishList = []; // Список (массив), где будут храниться координаты всех рыбок на уровне
let enemies = []; // Список (массив) для хранения всех активных врагов (пылесосов)   

// Длинные текстовые строчки — это зашифрованные карты уровней (15 строк по 20 символов)
// '1' — стена, '2' — старт кота, '3' — закрытый выход, 'F' — рыбка, 'E' — робот-пылесос, '0' — пустота
const levelStrings = [
    "11111111111111111111120F100000100F000001111010111010111111011000001010001000E101101111101111101101011010F000000000100101101011111111101011011E001000F000100010011111101111101111101110000E10001000F01001101111101011111011011010000010100010000110101111101010111101100F100000001000F03111111111111111111111",
    "111111111111111111111200E0100F0000100F3111111010111110101111100F10101000101000011010101010101011110110100E0010100F00010110111111101111110101100F0000000000010101111111101111110101011000E010100F010E0101101110101011011111011010100000100000000110101111111111111101100F000F00E000000F0111111111111111111111"
];

let currentLevelIndex = 0; // Переменная для отслеживания текущего номера уровня
let currentMap = []; // Двумерный массив, в который превратится текстовая строка уровня после обработки

// === БЛОК 4: ФУНКЦИИ ЛОГИКИ ИГРЫ ===

// Функция превращает длинную строку символов в удобную сетку (массив массивов)
function parseMap(levelStr) {
    let map = []; // Создаем пустую сетку
    fishList = []; // Очищаем список рыбок перед стартом нового уровня
    enemies = []; // Очищаем список врагов перед стартом нового уровня
    
    for (let i = 0; i < 15; i++) { // Цикл идет сверху вниз по строкам (всего 15 строк)
        let rowStr = levelStr.substring(i * 20, (i + 1) * 20); // Отрезаем кусок из 20 символов для текущей строки
        let rowArr = []; // Создаем массив для ячеек этой строки
        
        for (let c = 0; c < rowStr.length; c++) { // Цикл идет слева направо по символам строки (20 ячеек)
            let char = rowStr[c]; // Берем конкретный символ ячейки
            
            if (char === '1') rowArr.push(1); // Если нашли '1', добавляем в сетку цифру 1 (это стена)
            else if (char === '2') rowArr.push(2); // Если '2' — это стартовая позиция котика
            else if (char === '3') rowArr.push(3); // Если '3' — это клетка финиша/выхода
            else if (char === 'F') { 
                rowArr.push(0); // В саму сетку пишем пустоту (0)
                // И добавляем рыбку в список объектов, высчитывая её точные пиксельные координаты по центру клетки
                fishList.push({ x: c * blockSize + 15, y: i * blockSize + 15, radius: 6 }); 
            }
            else if (char === 'E') { 
                rowArr.push(0); // В сетку пишем пустоту
                // Создаем врага: задаем координаты, размер и случайное направление движения влево или вправо по горизонтали
                enemies.push({ x: c * blockSize + 5, y: i * blockSize + 5, size: 20, dx: Math.random() > 0.5 ? 1.5 : -1.5, dy: 0 }); 
            }
            else rowArr.push(0); // Любые другие символы (или нули) записываем как обычный пустой коридор
        }
        map.push(rowArr); // Добавляем готовую строку в общую карту
    }
    return map; // Возвращаем готовую двумерную матрицу лабиринта
}

// Функция запускает выбранный уровень по его индексу
function initLevel(index) {
    // Если уровни закончились, прячем игровой экран, показываем окно победы и выходим из функции
    if (index >= levelStrings.length) { canvas.style.display = 'none'; winScreen.style.display = 'block'; return; }
    
    currentLevelIndex = index; // Запоминаем текущий индекс уровня
    levelDisplay.textContent = currentLevelIndex + 1; // Обновляем цифру уровня на панели над игрой
    currentMap = parseMap(levelStrings[currentLevelIndex]); // Генерируем карту текущего уровня
    fishDisplay.textContent = fishList.length; // Пишем на панели, сколько рыбок нужно собрать
    resetPlayerPosition(); // Переносим котика на старт
}

// Функция ищет на карте цифру 2 (старт) и телепортирует туда игрока
function resetPlayerPosition() {
    for (let r = 0; r < currentMap.length; r++) { // Перебираем строки карты
        for (let c = 0; c < currentMap[r].length; c++) { // Перебираем столбцы карты
            if (currentMap[r][c] === 2) { // Если ячейка равна 2:
                // Высчитываем пиксельные координаты, чтобы котик встал ровно по центру клетки 30х30
                player.x = c * blockSize + (blockSize - player.size) / 2; 
                player.y = r * blockSize + (blockSize - player.size) / 2;
            }
        }
    }
}

// Умная функция проверки столкновений с объектом/стеной по 4-м углам персонажа
function checkCollision(x, y, size) {
    // Получаем пиксельные координаты четырех углов квадрата персонажа (верхний-левый, верхний-правый, нижний-левый, нижний-правый)
    let corners = [{x: x, y: y}, {x: x + size, y: y}, {x: x, y: y + size}, {x: x + size, y: y + size}];
    
    for (let corner of corners) {
        // Переводим пиксельные координаты угла в индексы ячеек сетки (делим на 30 и округляем вниз)
        let c = Math.floor(corner.x / blockSize); 
        let r = Math.floor(corner.y / blockSize);
        
        // Проверяем: если угол вылетел за границы карты или попал на ячейку со стеной (1), возвращаем true (столкновение есть!)
        if (r < 0 || r >= currentMap.length || c < 0 || c >= currentMap[r].length || currentMap[r][c] === 1) return true;
    }
    return false; // Если ни один угол не задел стену — возвращаем false (путь свободен)
}

// Главная функция обновлений (расчет физики и логики, вызывается 60 раз в секунду)
function update() {
    let nextX = player.x; let nextY = player.y; // Создаем временные переменные для шага кота
    
    // Проверяем нажатые клавиши и меняем координату по вертикали (Y)
    if (keys['ArrowUp'] || keys['w'] || keys['W'] || keys['ц'] || keys['Ц']) nextY -= player.speed;
    if (keys['ArrowDown'] || keys['s'] || keys['S'] || keys['ы'] || keys['Ы']) nextY += player.speed;
    // Если при шаге по вертикали кот не врезается в стену, то обновляем его реальную координату Y
    if (!checkCollision(player.x, nextY, player.size)) player.y = nextY;
    
    // Проверяем нажатые клавиши и меняем координату по горизонтали (X)
    if (keys['ArrowLeft'] || keys['a'] || keys['A'] || keys['ф'] || keys['Ф']) nextX -= player.speed;
    if (keys['ArrowRight'] || keys['d'] || keys['D'] || keys['в'] || keys['В']) nextX += player.speed;
    // Если при шаге по горизонтали кот не врезается в стену, то обновляем его реальную координату X
    if (!checkCollision(nextX, player.y, player.size)) player.x = nextX;

    // Сбор рыбок котиком
    let pCenterX = player.x + player.size / 2; let pCenterY = player.y + player.size / 2; // Находим центр кота
    for (let i = fishList.length - 1; i >= 0; i--) { // Перебираем список рыбок с конца к началу (чтобы безопасно удалять элементы)
        let fish = fishList[i];
        let dist = Math.hypot(pCenterX - fish.x, pCenterY - fish.y); // Считаем точное расстояние между центрами кота и рыбки
        
        if (dist < player.size / 2 + fish.radius) { // Если круги кота и рыбки пересеклись:
            fishList.splice(i, 1); // Удаляем рыбку из массива данных
            fishDisplay.textContent = fishList.length; // Обновляем счетчик рыбок на экране сайта
        }
    }

    // Движение роботов-пылесосов (врагов)
    for (let enemy of enemies) {
        let nextEx = enemy.x + enemy.dx; let nextEy = enemy.y + enemy.dy; // Просчитываем следующий шаг врага
        
        if (checkCollision(nextEx, nextEy, enemy.size)) { 
            // Если на пути врага стена — разворачиваем его скорость в обратную сторону (меняем плюс на минус)
            enemy.dx = -enemy.dx; enemy.dy = -enemy.dy; 
        } else { 
            // Если путь свободен — двигаем врага вперед
            enemy.x = nextEx; enemy.y = nextEy; 
        }
        
        // Проверка столкновения кота с врагом (пересечение двух квадратов)
        if (player.x < enemy.x + enemy.size && player.x + player.size > enemy.x && player.y < enemy.y + enemy.size && player.y + player.size > enemy.y) {
            resetPlayerPosition(); // Если врезались в пылесос — котик телепортируется на старт уровня
        }
    }

    // Проверка перехода на следующий уровень
    if (fishList.length === 0) { // Если котик съел ВСЮ рыбу на уровне:
        let centerC = Math.floor(pCenterX / blockSize); // Находим индекс колонки, где сейчас центр кота
        let centerR = Math.floor(pCenterY / blockSize); // Находим индекс строки, где сейчас центр кота
        
        // Если котик стоит на ячейке финиша (3), запускаем следующий уровень!
        if (currentMap[centerR] && currentMap[centerR][centerC] === 3) initLevel(currentLevelIndex + 1);
    }
}

// === БЛОК 5: ГРАФИКА (РИСОВАНИЕ ОБЪЕКТОВ НА ЭКРАНЕ) ===
function draw() {
ctx.clearRect(0, 0, canvas.width, canvas.height); // Полностью очищаем холст перед новым кадром
// Рисуем карту лабиринта и выходы
for (let r = 0; r < currentMap.length; r++) { // Бежим по строкам матрицы
for (let c = 0; c < currentMap[r].length; c++) { // Бежим по колонкам матрицы
if (currentMap[r][c] === 1) { // Если в ячейке стоит 1:
ctx.fillStyle = '#269926'; // Выбираем цвет для кубиков стен
ctx.fillRect(c * blockSize + 2, r * blockSize + 2, blockSize - 4, blockSize - 4); // Рисуем кубики стены со сдвигом +2 и размером меньше на 4
ctx.strokeStyle = '#000000'; // Выбираем цвет для обводки границ кубиков стен
ctx.lineWidth = 2; // Выбираем толщину линии обводки границ кубиков стен (единица измерения - пиксели)
ctx.strokeRect(c * blockSize + 2, r * blockSize +2, blockSize - 4, blockSize - 4); //Рисуем контур ровно по границам кубиков стен
} else if (currentMap[r][c] === 3) { // Если в ячейке стоит 3 (выход):
// Если рыба осталась — красим финиш в блекло-зеленый, если вся съедена — в ярко-зеленый
ctx.fillStyle = fishList.length === 0 ? '#2ed573' : '#7bed9f';
ctx.fillRect(c * blockSize, r * blockSize, blockSize, blockSize); // Рисуем квадрат выхода
if (fishList.length > 0) { // Если рыба еще не собрана, рисуем поверх финиша замок 🔒
ctx.fillStyle = '#333';
ctx.font = '12px Arial';
ctx.fillText('🔒', c * blockSize + 7, r * blockSize + 20);
}
}
}
}
// Рисуем рыбок на холсте
for (let fish of fishList) {
ctx.beginPath(); // Начинаем рисовать новую фигуру
ctx.ellipse(fish.x, fish.y, fish.radius + 3, fish.radius, 0, 0, Math.PI * 2); // Рисуем овальное тело рыбки
ctx.fillStyle = '#FFB000'; // Выбираем цвет для рыбы
ctx.fill(); // Закрашиваем её форму
ctx.closePath(); // Заканчиваем рисование фигуры
}
// Рисуем врагов (красные кубики)
for (let enemy of enemies) {
ctx.fillStyle = '#FF0000'; // Выбираем красный цвет для врагов
ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size); // Рисуем квадрат врага
ctx.strokeStyle = '#000000'; // Выбираем цвет обводки врагов
ctx.lineWidth = 1; // Выбираем толщину обводки врагов
ctx.strokeRect(enemy.x, enemy.y, enemy.size, enemy.size); //Рисуем обводку ровно по границе врагов 
}
// Рисуем главного героя — котика
if (catImage.complete && catImage.naturalWidth !== 0) {
// Если спрайт 'cat1.png' успешно загрузился в браузер — выводим картинку котика
ctx.drawImage(catImage, player.x, player.y, player.size, player.size);
} else {
// Запасной вариант: если картинки нет на сервере, рисуем обычный оранжевый квадратик
ctx.fillStyle = '#FF8000';
ctx.fillRect(player.x, player.y, player.size, player.size);
}
}
// === БЛОК 6: СЛУШАТЕЛИ КЛАВИАТУРЫ ===
// Когда клавиша нажимается, записываем в объект keys значение true (например: keys['w'] = true)
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
// Когда клавишу отпускают, записываем значение false
window.addEventListener('keyup', (e) => { keys[e.key] = false; });
// === БЛОК 7: ЗАПУСК ИГРОВОГО ДВИЖКА ===
function gameLoop() {
update(); // 1. Считаем физику и перемещения сущностей
draw(); // 2. Отрисовываем обновленные объекты на экране
requestAnimationFrame(gameLoop); // 3. Зацикливаем функцию, прося браузер вызывать её на каждый кадр монитора
}
// Старт игры
initLevel(0); // Генерируем самый первый уровень (индекс 0)
gameLoop(); // Запускаем бесконечный игровой цикл
