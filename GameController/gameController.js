class GameController {
    static InitializeShips() {
        var colors = require("cli-color");
        const Ship = require("./ship.js");
        var ships = [
            new Ship("Aircraft Carrier", 5, colors.CadetBlue),
            new Ship("Battleship", 4, colors.Red),
            new Ship("Submarine", 3, colors.Chartreuse),
            new Ship("Destroyer", 3, colors.Yellow),
            new Ship("Patrol Boat", 2, colors.Orange)
        ];
        return ships;
    }

    static CheckIsHit(ships, shot) {
        if (shot == undefined)
            throw "The shooting position is not defined";
        if (ships == undefined)
            throw "No ships defined";
        var returnvalue = false;
        ships.forEach(function (ship) {
            ship.positions.forEach(position => {
                if (position.row == shot.row && position.column == shot.column) {
                    // mark the position as hit for tracking
                    position.isHit = true;
                    returnvalue = true;
                }
            });
        });
        return returnvalue;
    }

    static isShipValid(ship) {
        return ship.positions.length == ship.size;
    }

    // returns true when every position on the ship has been hit
    static isShipSunk(ship) {
        if (!ship || !Array.isArray(ship.positions) || ship.positions.length === 0) return false;
        return ship.positions.every(p => p && p.isHit === true);
    }

    // returns { sunk: [{name,size}], remaining: [{name,size,hitsRemaining}] }
    static getFleetStatus(ships) {
        const sunk = [];
        const remaining = [];
        (ships || []).forEach(ship => {
            if (GameController.isShipSunk(ship)) {
                sunk.push({ name: ship.name, size: ship.size });
            } else {
                // count how many hits have already been made on this ship
                const hits = (ship.positions || []).filter(p => p && p.isHit).length;
                const hitsRemaining = Math.max(0, ship.size - hits);
                remaining.push({ name: ship.name, size: ship.size, hitsRemaining });
            }
        });
        return { sunk, remaining };
    }

    static recordShot(ships, shot) {
        const preSunk = new Set((ships || []).filter(s => GameController.isShipSunk(s)).map(s => s.name));
        const isHit = GameController.CheckIsHit(ships, shot);

        let sunkShip = null;
        if (isHit) {
            for (const ship of (ships || [])) {
                if (GameController.isShipSunk(ship) && !preSunk.has(ship.name)) {
                    sunkShip = { name: ship.name, size: ship.size };
                    break;
                }
            }
        }

        const status = GameController.getFleetStatus(ships);
        return { isHit, sunkShip, status };
    }
}

module.exports = GameController;