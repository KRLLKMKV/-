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
let player = new Player(); // Создаем котика по новому чертежу из класса Player
let keys = {}; // Сюда мы будем записывать, какие клавиши зажаты в данный момент
let fishList = []; // Список (массив), где будут храниться координаты всех рыбок на уровне
let enemies = []; // Список (массив) для хранения всех активных врагов (пылесосов)   

// Длинные текстовые строчки — это зашифрованные карты уровней (15 строк по 20 символов)
// '1' — стена, '2' — старт кота, '3' — закрытый выход, 'F' — рыбка, 'E' — робот-пылесос, '0' — пустота
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
    "11111111111111111111", // Запятая в конце обязательна - она отделяет первый уровень от второго уровня

    // Уровень 2
    "11111111111111111111" +
    "12.F1.....1..F.....1" +
    "111.1.111.1.111111.1" +
    "1.....1.1...1...E1.1" +
    "1.11111.11111.11.1.1" +
    "1F1...........1.1.1" +
    "1.1.111111111.1.11.1" +
    "1E..1...F...1...1..1" +
    "11111.11111.11111.11" +
    "1....E1...1...F.1..1" +
    "1.11111.1.11111.11.1" +
    "1.1.....1.1...1....1" +
    "1.1.11111.1.1.1111.1" +
    "1..F1.......1...F.31" +
    "11111111111111111111" // Тут знаков нет т.к. этот уровень последний в списке
];

let currentLeelIndex = 0; // Переменная для отслеживания текущего номера уровня
let currentMap = []; // Двумерный массив, в который превратится текстовая строка уровня после обработки

// === БЛОК 4: ФУНКЦИИ ЛОГИКИ ИГРЫ ===

// Функция превращает длинную строку символов в удобную сетку (массив массивов)
function parseMap(leelStr) {
    let map = []; // Создаем пустую сетку
    fishList = []; // Очищаем список рыбок перед стартом нового уровня
    enemies = []; // Очищаем список врагов перед стартом нового уровня
    
    for (let i = 0; i < 15; i++) { // Цикл идет сверху вниз по строкам (всего 15 строк)
        let rowStr = leelStr.substring(i * 20, (i + 1) * 20); // Отрезаем кусок из 20 символов для текущей строки
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
                rowArr.push(0); 
                // Вызываем переименованный класс через ключевое слово new
                enemies.push(new HorizontalEnemy(c, i)); 
            }
            else if ( char === 'V') {
    rowArr. push( 0);
    enemies. push( new VerticalEnemy( c, i));
}
            else {
                rowArr.push(0);
            }
        }
        map.push(rowArr);
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
    // 1. Котик сам считывает клавиши и рассчитывает свое перемещение!
    player.move(keys);

    // 2. Сбор рыбок котиком
    let pCenterX = player.x + player.size / 2; let pCenterY = player.y + player.size / 2; // Находим центр кота
    for (let i = fishList.length - 1; i >= 0; i--) { // Перебираем список рыбок с конца к началу
        let fish = fishList[i];
        let dist = Math.hypot(pCenterX - fish.x, pCenterY - fish.y); // Считаем точное расстояние между центрами кота и рыбки
        
        if (dist < player.size / 2 + fish.radius) { // Если круги кота и рыбки пересеклись:
            fishList.splice(i, 1); // Удаляем рыбку из массива данных
            fishDisplay.textContent = fishList.length; // Обновляем счетчик рыбок на экране сайта
        }
    }

    // Движение роботов-пылесосов (врагов)
    for (let enemy of enemies) {
        enemy.move()
        
        if (checkCollision(nextEx, nextEy, enemy.size)) { 
            // Если на пути врага стена — разворачиваем его скорость в обратную сторону (меняем плюс на минус)
            enemy.dx = -enemy.dx; enemy.dy = -enemy.dy; 
        } else { 
            // Если путь свободен — двигаем врага вперед
            enemy.x = nextEx; enemy.y = nextEy; 
        }
        
        // Проверка столкновения кота с врагом (пересечение двух квадратов)
       if (player.x < enemy.x + enemy.size && 
        player.x + player.size > enemy.x && 
        player.y < enemy.y + enemy.size && 
        player.y + player.size > enemy.y) {
        
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
ctx.lineWidth = 2; // Выбираем толщину обводки врагов
ctx.strokeRect(enemy.x, enemy.y, enemy.size, enemy.size); //Рисуем обводку ровно по границе врагов 
}
    // Просим котика нарисовать самого себя по правилам его класса
    player.draw(ctx, catImage);
} // <- Эта закрывающая фигурная скобка завершает саму функцию draw()

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
