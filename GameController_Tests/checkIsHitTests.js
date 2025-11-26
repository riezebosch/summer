const assert = require('assert').strict;
const gameController = require("../GameController/gameController.js");
const letters = require("../GameController/letters.js");
const Position = require("../GameController/position.js")

describe('checkIsHitTests', function () {

  it('should return true if there is a ship at the shooting position', function () {
    var ships = gameController.InitializeShips();
    var counter = 1;
    ships.forEach(ship => {
      for (var i = 1; i <= ship.size; i++) {
        ship.addPosition(new Position(letters.get(counter), i))
      }
      counter++;
    })
    var actual = gameController.CheckIsHit(ships, new Position(letters.B, 3));
    assert.ok(actual);
  });

  it('should return false if there is no ship at the shooting position', function () {
    var ships = gameController.InitializeShips();
    var counter = 1;
    ships.forEach(ship => {
      for (var i = 1; i <= ship.size; i++) {
        ship.addPosition(new Position(letters.get(counter), i))
      }
      counter++;
    })
    var actual = gameController.CheckIsHit(ships, new Position(letters.G, 1));
    assert.strictEqual(actual, false);
  });

  it('should throw an exception if position is undefined', function () {
    var ships = gameController.InitializeShips();
    assert.throws(
      () => {
        gameController.CheckIsHit(ships, undefined);
      }
    )
  });

  it('should throw an exception if ship is undefined', function () {
    assert.throws(
      () => {
        gameController.CheckIsHit(undefined, new Position(letters.G, 1));
      }
    )
  });

  it('CheckIsHit should mark the position as isHit', function () {
    const ships = gameController.InitializeShips();
    // place first ship at A1..A(size)
    for (let i = 1; i <= ships[0].size; i++) {
      ships[0].addPosition(new Position(letters.get(1), i));
    }

    const shot = new Position(letters.get(1), 1);
    const hit = gameController.CheckIsHit(ships, shot);
    assert.ok(hit, 'expected a hit at A1');

    // find the matching position object and verify isHit was set
    const pos = ships[0].positions.find(p => p.column === shot.column && p.row === shot.row);
    assert.ok(pos, 'expected position object to exist on ship');
    assert.strictEqual(pos.isHit, true, 'expected position.isHit to be true after hit');
  });

  it('recordShot should only report a sunk ship when the final segment is hit', function () {
    const ships = gameController.InitializeShips();
    // place a patrol boat (last ship, size 2) at B1,B2
    const patrol = ships.find(s => s.size === 2);
    // ensure it's empty before placement
    patrol.positions = [];
    patrol.addPosition(new Position(letters.get(2), 1));
    patrol.addPosition(new Position(letters.get(2), 2));

    // first hit -> not sunk
    let res = gameController.recordShot(ships, new Position(letters.get(2), 1));
    assert.strictEqual(res.isHit, true);
    assert.strictEqual(res.sunkShip, null, 'first hit should not report sunkShip');

    // second hit -> sunk should be reported and match the patrol boat
    res = gameController.recordShot(ships, new Position(letters.get(2), 2));
    assert.strictEqual(res.isHit, true);
    assert.ok(res.sunkShip, 'expected sunkShip on final hit');
    assert.strictEqual(res.sunkShip.name, patrol.name);
    assert.strictEqual(res.sunkShip.size, patrol.size);
  });

  it('getFleetStatus should report hitsRemaining for partially-hit ships and count sunk ships', function () {
    const ships = gameController.InitializeShips();
    // deterministic placement: column per ship, rows 1..size
    let counter = 1;
    ships.forEach(ship => {
      ship.positions = [];
      for (let r = 1; r <= ship.size; r++) {
        ship.addPosition(new Position(letters.get(counter), r));
      }
      counter++;
    });

    // hit one position on the first ship (size 5)
    const firstShip = ships[0];
    gameController.CheckIsHit(ships, new Position(letters.get(1), 1));

    const status = gameController.getFleetStatus(ships);
    // no ships fully sunk yet
    assert.strictEqual(status.sunk.length, 0);

    // first ship should be in remaining with hitsRemaining = size - 1
    const remFirst = status.remaining.find(s => s.name === firstShip.name);
    assert.ok(remFirst, 'first ship should be listed in remaining');
    assert.strictEqual(remFirst.hitsRemaining, firstShip.size - 1);
  });

  it('isShipSunk should return true only when all positions are marked isHit', function () {
    const ships = gameController.InitializeShips();
    const testShip = ships[2]; // submarine size 3
    testShip.positions = [];
    testShip.addPosition(new Position(letters.get(3), 1));
    testShip.addPosition(new Position(letters.get(3), 2));
    testShip.addPosition(new Position(letters.get(3), 3));

    // partially hit
    testShip.positions[0].isHit = true;
    assert.strictEqual(gameController.isShipSunk(testShip), false);

    // mark remaining
    testShip.positions[1].isHit = true;
    testShip.positions[2].isHit = true;
    assert.strictEqual(gameController.isShipSunk(testShip), true);
  });
});