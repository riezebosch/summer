const { Worker } = require('worker_threads');
const readline = require('readline-sync');
const gameController = require("./GameController/gameController.js");
const cliColor = require('cli-color');
const beep = require('beepbeep');
const position = require("./GameController/position.js");
const letters = require("./GameController/letters.js");
let telemetryWorker;

class Battleship {
    start() {
        telemetryWorker = new Worker("./TelemetryClient/telemetryClient.js");   

        console.log(cliColor.blue("Starting..."));
        telemetryWorker.postMessage({eventName: 'ApplicationStarted', properties:  {Technology: 'Node.js'}});

        console.log(cliColor.magenta("                                     |__"));
        console.log(cliColor.magenta("                                     |\\/"));
        console.log(cliColor.magenta("                                     ---"));
        console.log(cliColor.magenta("                                     / | ["));
        console.log(cliColor.magenta("                              !      | |||"));
        console.log(cliColor.magenta("                            _/|     _/|-++'"));
        console.log(cliColor.magenta("                        +  +--|    |--|--|_ |-"));
        console.log(cliColor.magenta("                     { /|__|  |/\\__|  |--- |||__/"));
        console.log(cliColor.magenta("                    +---------------___[}-_===_.'____                 /\\"));
        console.log(cliColor.magenta("                ____`-' ||___-{]_| _[}-  |     |_[___\\==--            \\/   _"));
        console.log(cliColor.magenta(" __..._____--==/___]_|__|_____________________________[___\\==--____,------' .7"));
        console.log(cliColor.magenta("|                        Welcome to Battleship                         BB-61/"));
        console.log(cliColor.magenta(" \\_________________________________________________________________________|"));
        console.log();

        this.InitializeGame();
        this.StartGame();
    }

    StartGame() {
        console.clear();
        console.log(cliColor.yellow("                  __"));
        console.log(cliColor.yellow("                 /  \\"));
        console.log(cliColor.yellow("           .-.  |    |"));
        console.log(cliColor.yellow("   *    _.-'  \\  \\__/"));
        console.log(cliColor.yellow("    \\.-'       \\"));
        console.log(cliColor.yellow("   /          _/"));
        console.log(cliColor.yellow("  |      _  /"));
        console.log(cliColor.yellow("  |     /_\\'"));
        console.log(cliColor.yellow("   \\    \\_/"));
        console.log(cliColor.yellow("    \"\"\"\""));

        do {
            console.log();
            console.log(cliColor.cyan("Player, it's your turn"));

            let position;
            while (true) {
                console.log(cliColor.cyan("Enter coordinates for your shot :"));
                const raw = readline.question().trim();
                try {
                    const candidate = Battleship.ParsePosition(raw);
                    if (!this._isInBounds(candidate)) {
                        console.log(cliColor.red("Invalid position. Use A1..H8. Try again."));
                        continue;
                    }
                    // accept this shot
                    position = candidate;
                    break;
                } catch (e) {
                    console.log(cliColor.red("Couldn't parse that input. Use format like A1."));
                }
            }

            // recordShot will mark hits and return structured info including sunk ships and fleet status
            const playerResult = gameController.recordShot(this.enemyFleet, position);
            telemetryWorker.postMessage({eventName: 'Player_ShootPosition', properties:  {Position: position.toString(), IsHit: playerResult.isHit}});

            if (playerResult.isHit) {
                beep();

                console.log(cliColor.green("                \\         .  ./"));
                console.log(cliColor.green("              \\      .:\";'.:..\"   /"));
                console.log(cliColor.green("                  (M^^.^~~:.'\")."));
                console.log(cliColor.green("            -   (/  .    . . \\ \\)  -"));
                console.log(cliColor.green("               ((| :. ~ ^  :. .|))"));
                console.log(cliColor.green("            -   (\\- |  \\ /  |  /)  -"));
                console.log(cliColor.green("                 -\\  \\     /  /-"));
                console.log(cliColor.green("                   \\  \\   /  /"));
            }

            console.log(playerResult.isHit ? cliColor.green("Yeah ! Nice hit !") : cliColor.red("Miss"));

            if (playerResult.sunkShip) {
                console.log(cliColor.green(`You sunk the enemy ${playerResult.sunkShip.name} (size ${playerResult.sunkShip.size})!`));
                telemetryWorker.postMessage({eventName: 'ShipSunk', properties: {Owner: 'Enemy', Ship: playerResult.sunkShip.name, Size: playerResult.sunkShip.size}});
                const pSunk = playerResult.status.sunk.length;
                const pRem = playerResult.status.remaining.length;
                const pRemList = (playerResult.status.remaining || []).map(s => `${s.name} (${s.size})`).join(', ') || 'none';
                console.log(`Fleet status: ${pSunk} sunk, ${pRem} remaining: ${pRemList}`);                
            }

            const computerResult = gameController.recordShot(this.myFleet, computerPos);
            telemetryWorker.postMessage({eventName: 'Computer_ShootPosition', properties:  {Position: computerPos.toString(), IsHit: computerResult.isHit}});

            console.log();
            console.log(cliColor.red("It's enemy turn"));
            console.log(`Computer shot in ${computerPos.column}${computerPos.row} and ` + (computerResult.isHit ? `has hit your ship !` : `miss`));
            if (computerResult.isHit) {
                beep();

                console.log(cliColor.red("                \\         .  ./"));
                console.log(cliColor.red("              \\      .:\";'.:..\"   /"));
                console.log(cliColor.red("                  (M^^.^~~:.'\")."));
                console.log(cliColor.red("            -   (/  .    . . \\ \\)  -"));
                console.log(cliColor.red("               ((| :. ~ ^  :. .|))"));
                console.log(cliColor.red("            -   (\\- |  \\ /  |  /)  -"));
                console.log(cliColor.red("                 -\\  \\     /  /-"));
                console.log(cliColor.red("                   \\  \\   /  /"));
            }

            if (computerResult.sunkShip) {
                console.log(cliColor.red(`Your ${computerResult.sunkShip.name} (size ${computerResult.sunkShip.size}) has been sunk!`));
                telemetryWorker.postMessage({eventName: 'ShipSunk', properties: {Owner: 'Player', Ship: computerResult.sunkShip.name, Size: computerResult.sunkShip.size}});
                const cSunk = computerResult.status.sunk.length;
                const cRem = computerResult.status.remaining.length;
                const cRemList = (computerResult.status.remaining || []).map(s => `${s.name} (${s.size})`).join(', ') || 'none';
                console.log(`Your fleet status: ${cSunk} sunk, ${cRem} remaining: ${cRemList}`);
            }
        }
        while (true);
    }

    static ParsePosition(input) {
        var letter = letters.get(input.toUpperCase().substring(0, 1));
        var number = parseInt(input.substring(1, 2), 10);
        return new position(letter, number);
    }

    GetRandomPosition() {
        var rows = 8;
        var lines = 8;
        var rndColumn = Math.floor(Math.random() * lines) + 1;
        var rndRow = Math.floor(Math.random() * rows) + 1;
        var letter = letters.get(rndColumn);
        var result = new position(letter, rndRow);
        return result;
    }

    InitializeGame() {
        this.InitializeMyFleet();
        this.InitializeEnemyFleet();
    }

    InitializeMyFleet() {
        this.myFleet = gameController.InitializeShips();

        const BOARD_SIZE = 8;
        const LETTERS = "ABCDEFGH";
        const occupied = new Set(); // "A-1" style

        const letterToIndex = (l) => {
            if (!l) return 0;
            return LETTERS.indexOf(l.toUpperCase()) + 1; // 1..8 or 0 if invalid
        };

        const normalizePos = (input) => {
            // Accept "A1", "a1" or whitespace
            input = input.trim().toUpperCase();
            return Battleship.ParsePosition(input);
        };

        const posKey = (pos) => `${pos.column}-${pos.row}`;

        const isInBounds = (pos) => {
            const colIdx = letterToIndex(typeof pos.column === "string" ? pos.column : String(pos.column));
            const row = Number(pos.row);
            return colIdx >= 1 && colIdx <= BOARD_SIZE && row >= 1 && row <= BOARD_SIZE;
        };

        const areAlignedAndContiguous = (positions, size) => {
            if (!Array.isArray(positions) || positions.length !== size) return false;
            // map columns to numeric indices
            const cols = positions.map(p => letterToIndex(typeof p.column === "string" ? p.column : String(p.column)));
            const rows = positions.map(p => Number(p.row));
            const allSameCol = cols.every(c => c === cols[0]);
            const allSameRow = rows.every(r => r === rows[0]);

            if (!(allSameCol || allSameRow)) return false;

            if (allSameCol) {
                // check rows are consecutive
                const sortedRows = [...rows].sort((a, b) => a - b);
                for (let i = 1; i < sortedRows.length; i++) {
                    if (sortedRows[i] !== sortedRows[i - 1] + 1) return false;
                }
                return true;
            } else {
                // allSameRow -> check cols consecutive
                const sortedCols = [...cols].sort((a, b) => a - b);
                for (let i = 1; i < sortedCols.length; i++) {
                    if (sortedCols[i] !== sortedCols[i - 1] + 1) return false;
                }
                return true;
            }
        };

        for (const ship of this.myFleet) {
            // clear any previously added positions (robustness)
            ship.positions = [];

            const promptText = `Place your ${ship.name} (size ${ship.size}).\n` +
                "Enter coordinates separated by commas (e.g. A1,A2,A3 or A1-A3): ";

            while (true) {
                console.log();
                console.log(cliColor.cyan(`Placing ${ship.name} (size ${ship.size})`));
                let input = readline.question(promptText).trim();

                // allow A1-A5 style ranges
                if (input.includes("-") && !input.includes(",")) {
                    const parts = input.split("-");
                    if (parts.length === 2) {
                        const start = parts[0].trim();
                        const end = parts[1].trim();
                        try {
                            const startPos = normalizePos(start);
                            const endPos = normalizePos(end);

                            // build range
                            const startColIdx = letterToIndex(startPos.column);
                            const endColIdx = letterToIndex(endPos.column);
                            const startRow = Number(startPos.row);
                            const endRow = Number(endPos.row);

                            let generated = [];
                            if (startColIdx === endColIdx) {
                                // vertical
                                const minR = Math.min(startRow, endRow);
                                const maxR = Math.max(startRow, endRow);
                                for (let r = minR; r <= maxR; r++) {
                                    generated.push(new position(startPos.column, r));
                                }
                            } else if (startRow === endRow) {
                                // horizontal
                                const minC = Math.min(startColIdx, endColIdx);
                                const maxC = Math.max(startColIdx, endColIdx);
                                for (let c = minC; c <= maxC; c++) {
                                    generated.push(new position(LETTERS[c - 1], startRow));
                                }
                            } else {
                                console.log(cliColor.red("Range must be straight horizontal or vertical."));
                                continue;
                            }

                            // replace input by comma list for downstream validation
                            input = generated.map(p => `${p.column}${p.row}`).join(",");
                        } catch (e) {
                            console.log(cliColor.red("Invalid range input. Try again."));
                            continue;
                        }
                    }
                }

                // parse comma separated list
                const parts = input.split(",").map(s => s.trim()).filter(Boolean);
                if (parts.length !== ship.size) {
                    console.log(cliColor.red(`You must provide exactly ${ship.size} coordinates.`));
                    continue;
                }

                let candidatePositions = [];
                let outOfBounds = false;
                let invalidParse = false;

                for (const part of parts) {
                    try {
                        const p = normalizePos(part);
                        if (!isInBounds(p)) { outOfBounds = true; break; }
                        candidatePositions.push(p);
                    } catch (e) {
                        invalidParse = true;
                        break;
                    }
                }

                if (invalidParse) {
                    console.log(cliColor.red("Couldn't parse one of the coordinates. Use format like A1."));
                    continue;
                }
                if (outOfBounds) {
                    console.log(cliColor.red("One or more coordinates are outside the 8x8 board (A1..H8)."));
                    continue;
                }

                // check alignment and contiguous
                if (!areAlignedAndContiguous(candidatePositions, ship.size)) {
                    console.log(cliColor.red("Positions must form a single straight contiguous line with no gaps."));
                    continue;
                }

                // check overlap with already placed ships
                let overlap = false;
                for (const p of candidatePositions) {
                    if (occupied.has(posKey(p))) { overlap = true; break; }
                }
                if (overlap) {
                    console.log(cliColor.red("One or more positions overlap with an already placed ship. Choose different positions."));
                    continue;
                }

                // All good: add positions to ship and mark occupied
                for (const p of candidatePositions) {
                    ship.addPosition(new position(p.column, p.row));
                    occupied.add(posKey(p));
                }

                // final sanity check
                if (ship.positions.length !== ship.size) {
                    // rollback and retry (in case ship.addPosition behaves differently)
                    ship.positions = [];
                    for (const p of candidatePositions) occupied.delete(posKey(p));
                    console.log(cliColor.red("Failed to set ship positions, please try again."));
                    continue;
                }

                // placed successfully
                break;
            } // end while for this ship
        } // end for ships
    }

    InitializeEnemyFleet() {
        this.enemyFleet = gameController.InitializeShips();

        this.enemyFleet[0].addPosition(new position(letters.B, 4));
        this.enemyFleet[0].addPosition(new position(letters.B, 5));
        this.enemyFleet[0].addPosition(new position(letters.B, 6));
        this.enemyFleet[0].addPosition(new position(letters.B, 7));
        this.enemyFleet[0].addPosition(new position(letters.B, 8));

        this.enemyFleet[1].addPosition(new position(letters.E, 5));
        this.enemyFleet[1].addPosition(new position(letters.E, 6));
        this.enemyFleet[1].addPosition(new position(letters.E, 7));
        this.enemyFleet[1].addPosition(new position(letters.E, 8));


        this.enemyFleet[2].addPosition(new position(letters.A, 3));
        this.enemyFleet[2].addPosition(new position(letters.B, 3));
        this.enemyFleet[2].addPosition(new position(letters.C, 3));

        this.enemyFleet[3].addPosition(new position(letters.F, 8));
        this.enemyFleet[3].addPosition(new position(letters.G, 8));
        this.enemyFleet[3].addPosition(new position(letters.H, 8));

        this.enemyFleet[4].addPosition(new position(letters.C, 5));
        this.enemyFleet[4].addPosition(new position(letters.C, 6));
    }

    _posKey(pos) {
        return `${pos.column}-${pos.row}`;
    }

    _isInBounds(pos) {
        if (!pos || !pos.column) return false;
        const LETTERS = "ABCDEFGH";
        const col = String(pos.column).toUpperCase();
        const row = Number(pos.row);
        return LETTERS.includes(col) && Number.isInteger(row) && row >= 1 && row <= 8;
    }
}

module.exports = Battleship;
