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
            console.log(cliColor.cyan("Enter coordinates for your shot :"));
            var position = Battleship.ParsePosition(readline.question());
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

            var computerPos = this.GetRandomPosition();

            while(gameController.isPositionAlreadyHit(this.myFleet, computerPos)) {
                computerPos = this.getAdjacentPositions(this.myFleet, computerPos);
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

    // returns a position adjacent to the given position that has not already been hit
    getAdjacentPositions(ships, shot) {
        const potentialPositions = [
            new position(shot.column, shot.row - 1), // above
            new position(shot.column, shot.row + 1), // below
            new position(letters.get(shot.column.value + 1), shot.row), // right
            new position(letters.get(shot.column.value - 1), shot.row)  // left
        ];
        for (const pos of potentialPositions) {
            if (pos.column && pos.row >= 1 && pos.row <= 8 && !gameController.isPositionAlreadyHit(ships, pos)) {
                return pos;
            }
        }
        // if all adjacent positions have been hit, return a random position
        return this.GetRandomPosition();
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

        console.log(cliColor.blue("Please position your fleet (Game board size is from A to H and 1 to 8) :"));

        this.myFleet.forEach(function (ship) {
            console.log();
            console.log(cliColor.blue(`Please enter the positions for the ${ship.name} (size: ${ship.size})`));
            for (var i = 1; i < ship.size + 1; i++) {
                    console.log(cliColor.blue(`Enter position ${i} of ${ship.size} (i.e A3):`));
                    const position = readline.question();
                    telemetryWorker.postMessage({eventName: 'Player_PlaceShipPosition', properties:  {Position: position, Ship: ship.name, PositionInShip: i}});
                    ship.addPosition(Battleship.ParsePosition(position));
            }
        })
    }

    InitializeEnemyFleet() {
        this.enemyFleet = gameController.InitializeShips();

        // helper: random int inclusive
        const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

        const BOARD_SIZE = 8;
        // keep track of occupied cells using numeric coords "col-row"
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
                let startCol, startRow;

                if (horizontal) {
                    startCol = randInt(1, BOARD_SIZE - ship.size + 1);
                    startRow = randInt(1, BOARD_SIZE);
                } else {
                    startCol = randInt(1, BOARD_SIZE);
                    startRow = randInt(1, BOARD_SIZE - ship.size + 1);
                }

                // build candidate coordinates
                const coords = [];
                for (let i = 0; i < ship.size; i++) {
                    const col = horizontal ? startCol + i : startCol;
                    const row = horizontal ? startRow : startRow + i;
                    coords.push({ col, row });
                }

                // check collisions
                const collision = coords.some(c => occupied.has(`${c.col}-${c.row}`));
                if (collision) continue;

                // place ship
                coords.forEach(c => {
                    ship.addPosition(new position(letters.get(c.col), c.row));
                    occupied.add(`${c.col}-${c.row}`);
                });

                // sanity: ensure correct size
                if (ship.positions.length !== ship.size) {
                    // cleanup and retry if ship implementation didn't add as expected
                    ship.positions = [];
                    coords.forEach(c => occupied.delete(`${c.col}-${c.row}`));
                    continue;
                }

                placed = true;
            }
        }
    }
}

module.exports = Battleship;
