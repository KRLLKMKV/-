// === КЛАСС ДЛЯ СОЗДАНИЯ ВЕРТИКАЛЬНЫХ СУЩНОСТЕЙ ===
class VerticalRedCube {
    constructor(c, i) {
        this.size = 20;
        this.x = c * blockSize + 5;
        this.y = i * blockSize + 5;
        this.dx = 0; // По горизонтали не двигается
        this.dy = Math.random() > 0.5 ? 1.5 : -1.5; // Случайное направление: вверх или вниз
    }

    move() {
        let nextEx = this.x + this.dx;
        let nextEy = this.y + this.dy;

        // Физика отскока от верхних и нижних стен лабиринта
        if (checkCollision(nextEx, nextEy, this.size)) {
            this.dx = -this.dx;
            this.dy = -this.dy;
        } else {
            this.x = nextEx;
            this.y = nextEy;
        }
    }
}
