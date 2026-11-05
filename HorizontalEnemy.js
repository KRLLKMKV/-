// === КЛАСС ДЛЯ СОЗДАНИЯ ГОРИЗОНТАЛЬНЫХ ВРАГОВ ===
class HorizontalEnemy {
    constructor(c, i) {
        this.size = 20; 
        this.x = c * blockSize + 5;
        this.y = i * blockSize + 5;
        this.dx = Math.random() > 0.5 ? 1.5 : -1.5;
        this.dy = 0;
    }

    move() {
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
}
