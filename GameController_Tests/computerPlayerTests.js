const ComputerPlayer = require('../GameController/computerPlayer');

describe('ComputerPlayer', () => {
    it('should not fire at the same position twice', () => {
        const player = new ComputerPlayer(2, 2);
        const shots = [];
        for (let i = 0; i < 4; i++) {
            const shot = player.getNextShot();
            shots.push(`${shot.row},${shot.column}`);
        }
        const uniqueShots = new Set(shots);
        expect(uniqueShots.size).toBe(4);
        expect(player.getNextShot()).toBeNull();
    });

    it('should fire on all fields of the playing field', () => {
        const rows = 3, columns = 3;
        const player = new ComputerPlayer(rows, columns);
        let shot;
        let count = 0;
        while ((shot = player.getNextShot()) !== null) {
            count++;
        }
        expect(count).toBe(rows * columns);
        expect(player.hasFiredAllShots()).toBe(true);
    });
});