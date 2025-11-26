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
});
