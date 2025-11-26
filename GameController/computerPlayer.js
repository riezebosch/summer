class ComputerPlayer {
    constructor(rows, columns) {
        this.rows = rows;
        this.columns = columns;
        this.shotsFired = new Set();
    }

    getNextShot() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                const key = `${row},${col}`;
                if (!this.shotsFired.has(key)) {
                    this.shotsFired.add(key);
                    return { row, column: col };
                }
            }
        }
        return null;
    }
    hasFiredAllShots() {
        return this.shotsFired.size === this.rows * this.columns;
    }
}

module.exports = ComputerPlayer;