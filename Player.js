// === КЛАСС ДЛЯ СОЗДАНИЯ ИГРОКА (КОТИКА) ===
class Player {
    constructor() {
        this.size = 22;
        this.speed = 3;
        this.x = 0;
        this.y = 0;
    }

    // Логика перемещения котика и проверка столкновения со синими стенами
    move(keys) {
        let nextX = this.x;
        let nextY = this.y;

        // Движение по вертикали
        if (keys['ArrowUp'] || keys['w'] || keys['W'] || keys['ц'] || keys['Ц']) nextY -= this.speed;
        if (keys['ArrowDown'] || keys['s'] || keys['S'] || keys['ы'] || keys['Ы']) nextY += this.speed;
        if (!checkCollision(this.x, nextY, this.size)) this.y = nextY;

        // Движение по горизонтали
        if (keys['ArrowLeft'] || keys['a'] || keys['A'] || keys['ф'] || keys['Ф']) nextX -= this.speed;
        if (keys['ArrowRight'] || keys['d'] || keys['D'] || keys['в'] || keys['В']) nextX += this.speed;
        if (!checkCollision(nextX, this.y, this.size)) this.x = nextX;
    }

    // Отрисовка котика (картинка или оранжевый квадрат с рамкой)
    draw(ctx, catImage) {
        if (catImage.complete && catImage.naturalWidth !== 0) {
            ctx.drawImage(catImage, this.x, this.y, this.size, this.size);
        } else {
            ctx.fillStyle = '#FF8000'; // Твой оранжевый цвет
            ctx.fillRect(this.x, this.y, this.size, this.size);
            
            ctx.strokeStyle = '#000000'; // Твоя черная обводка
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.size, this.size);
        }
    }
}
