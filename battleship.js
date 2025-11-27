const { Worker } = require('worker_threads');
const path = require('path');
const readline = require('readline-sync');
const gameController = require("./GameController/gameController.js");
const cliColor = require('cli-color');
const beep = require('beepbeep');
const position = require("./GameController/position.js");
const letters = require("./GameController/letters.js");

class Battleship {
    constructor() {
        this.telemetryWorker = null;
    }

    start() {
        const workerPath = path.resolve(__dirname, "TelemetryClient", "telemetryClient.js");
        try {
            this.telemetryWorker = new Worker(workerPath);
        } catch (err) {
            console.error("Failed to start telemetry worker:", err);
            this.telemetryWorker = null;
        }

        this._postTelemetry('ApplicationStarted', { Technology: 'Node.js' });

        this._printWelcomeArt();
        this.InitializeGame();
        this.StartGame();
    }

    StartGame() {
        console.clear();
        this._printSmallShipArt();

        while (true) {
            console.log();
            console.log(cliColor.cyan("Player, it's your turn"));
            console.log(cliColor.cyan("Enter coordinates for your shot :"));

            let playerPos;
            try {
                playerPos = Battleship.ParsePosition(readline.question());
            } catch (err) {
                console.log(cliColor.red("Invalid position. Use format A1..H8."));
                continue;
            }

            const playerResult = gameController.recordShot(this.enemyFleet, playerPos);
            this._postTelemetry('Player_ShootPosition', { Position: playerPos.toString(), IsHit: playerResult.isHit });

            if (playerResult.isHit) {
                beep();
                this._printHitArt('green');
                console.log(cliColor.green("Yeah ! Nice hit !"));
            } else {
                console.log(cliColor.red("Miss"));
            }

            if (playerResult.sunkShip) {
                console.log(cliColor.green(`You sunk the enemy ${playerResult.sunkShip.name} (size ${playerResult.sunkShip.size})!`));
                this._postTelemetry('ShipSunk', { Owner: 'Enemy', Ship: playerResult.sunkShip.name, Size: playerResult.sunkShip.size });
                this._printFleetStatus(playerResult.status, "Fleet status");
            }

            // Check if enemy fleet is destroyed
            if ((playerResult.status.remaining || []).length === 0) {
                console.log(cliColor.green("Congratulations! You destroyed the enemy fleet!"));
                this._shutdownTelemetry();
                break;
            }

            // Computer turn
            const computerPos = this.GetRandomPosition();
            const computerResult = gameController.recordShot(this.myFleet, computerPos);
            this._postTelemetry('Computer_ShootPosition', { Position: computerPos.toString(), IsHit: computerResult.isHit });

            console.log();
            console.log(cliColor.red("It's enemy turn"));
            console.log(`Computer shot in ${computerPos.column}${computerPos.row} and ` +
                (computerResult.isHit ? `has hit your ship !` : `miss`));

            if (computerResult.isHit) {
                beep();
                this._printHitArt('red');
            }

            if (computerResult.sunkShip) {
                console.log(cliColor.red(`Your ${computerResult.sunkShip.name} (size ${computerResult.sunkShip.size}) has been sunk!`));
                this._postTelemetry('ShipSunk', { Owner: 'Player', Ship: computerResult.sunkShip.name, Size: computerResult.sunkShip.size });
                this._printFleetStatus(computerResult.status, "Your fleet status");
            }

            // Check if player's fleet is destroyed
            if ((computerResult.status.remaining || []).length === 0) {
                console.log(cliColor.red("All your ships have been sunk. Game over."));
                this._shutdownTelemetry();
                break;
            }
        }
    }

    static ParsePosition(input) {
        if (!input || typeof input !== 'string') throw new Error('Invalid input');
        const val = input.trim().toUpperCase();
        const match = /^([A-H])([1-8])$/.exec(val);
        if (!match) throw new Error('Out of range');
        const letter = letters.get(match[1]);
        const number = parseInt(match[2], 10);
        return new position(letter, number);
    }

    GetRandomPosition() {
        const BOARD_SIZE = 8;
        const rndColumn = Math.floor(Math.random() * BOARD_SIZE) + 1;
        const rndRow = Math.floor(Math.random() * BOARD_SIZE) + 1;
        return new position(letters.get(rndColumn), rndRow);
    }

    InitializeGame() {
        this.InitializeMyFleet();
        this.InitializeEnemyFleet();
    }

    InitializeMyFleet() {
        this.myFleet = gameController.InitializeShips();

        console.log(cliColor.blue("Please position your fleet (Game board size is from A to H and 1 to 8) :"));

        this.myFleet.forEach((ship) => {
            console.log();
            console.log(cliColor.blue(`Please enter the positions for the ${ship.name} (size: ${ship.size})`));
            for (let i = 1; i <= ship.size; i++) {
                while (true) {
                    console.log(cliColor.blue(`Enter position ${i} of ${ship.size} (i.e A3):`));
                    const input = readline.question();
                    try {
                        const pos = Battleship.ParsePosition(input);
                        this._postTelemetry('Player_PlaceShipPosition', { Position: input, Ship: ship.name, PositionInShip: i });
                        ship.addPosition(pos);
                        break;
                    } catch (err) {
                        console.log(cliColor.red("Invalid position. Try again."));
                    }
                }
            }
        });
    }

    InitializeEnemyFleet() {
        this.enemyFleet = gameController.InitializeShips();

        const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
        const BOARD_SIZE = 8;
        const occupied = new Set();

        for (const ship of this.enemyFleet) {
            let placed = false;
            let attempts = 0;
            while (!placed) {
                attempts++;
                if (attempts > 1000) {
                    throw new Error(`Unable to place ship ${ship.name} after ${attempts} attempts`);
                }

                const horizontal = Math.random() < 0.5;
                const startCol = horizontal ? randInt(1, BOARD_SIZE - ship.size + 1) : randInt(1, BOARD_SIZE);
                const startRow = horizontal ? randInt(1, BOARD_SIZE) : randInt(1, BOARD_SIZE - ship.size + 1);

                const coords = [];
                for (let i = 0; i < ship.size; i++) {
                    const col = horizontal ? startCol + i : startCol;
                    const row = horizontal ? startRow : startRow + i;
                    coords.push({ col, row });
                }

                const collision = coords.some(c => occupied.has(`${c.col}-${c.row}`));
                if (collision) continue;

                coords.forEach(c => {
                    ship.addPosition(new position(letters.get(c.col), c.row));
                    occupied.add(`${c.col}-${c.row}`);
                });

                if (ship.positions.length !== ship.size) {
                    // cleanup and retry
                    ship.positions = [];
                    coords.forEach(c => occupied.delete(`${c.col}-${c.row}`));
                    continue;
                }

                placed = true;
            }
        }
    }

    // Helpers
    _postTelemetry(eventName, properties) {
        if (!this.telemetryWorker) return;
        try {
            this.telemetryWorker.postMessage({ eventName, properties });
        } catch (err) {
            // don't let telemetry failures crash the game
        }
    }

    _shutdownTelemetry() {
        if (!this.telemetryWorker) return;
        try {
            this.telemetryWorker.terminate();
        } catch (err) { /* ignore */ }
        this.telemetryWorker = null;
    }

    _printWelcomeArt() {
        const art = [
            "                                     |__",
            "                                     |\\/",
            "                                     ---",
            "                                     / | [",
            "                              !      | |||",
            "                            _/|     _/|-++'",
            "                        +  +--|    |--|--|_ |-",
            "                     { /|__|  |/\\__|  |--- |||__/",
            "                    +---------------___[}-_===_.'____                 /\\",
            "                ____`-' ||___-{]_| _[}-  |     |_[___\\==--            \\/   _",
            " __..._____--==/___]_|__|_____________________________[___\\==--____,------' .7",
            "|                        Welcome to Battleship                         BB-61/",
            " \\_________________________________________________________________________|"
        ];
        art.forEach(line => console.log(cliColor.magenta(line)));
        console.log();
    }

    _printSmallShipArt() {
        const art = [
            "                  __",
            "                 /  \\",
            "           .-.  |    |",
            "   *    _.-'  \\  \\__/",
            "    \\.-'       \\",
            "   /          _/",
            "  |      _  /",
            "  |     /_\\'",
            "   \\    \\_/",
            "    \"\"\"\""
        ];
        art.forEach(line => console.log(cliColor.yellow(line)));
    }

    _printHitArt(color) {
        const fn = color === 'red' ? cliColor.red : cliColor.green;
        [
            "                \\         .  ./",
            "              \\      .:\";'.:..\"   /",
            "                  (M^^.^~~:.'\").",
            "            -   (/  .    . . \\ \\)  -",
            "               ((| :. ~ ^  :. .|))",
            "            -   (\\- |  \\ /  |  /)  -",
            "                 -\\  \\     /  /-",
            "                   \\  \\   /  /"
        ].forEach(line => console.log(fn(line)));
    }

    _printFleetStatus(status, prefix) {
        const sunk = (status.sunk || []).length;
        const remaining = (status.remaining || []).length;
        const remList = (status.remaining || []).map(s => `${s.name} (${s.size})`).join(', ') || 'none';
        console.log(`${prefix}: ${sunk} sunk, ${remaining} remaining: ${remList}`);
    }
}

module.exports = Battleship;
