const assert = require('assert').strict;
const gameController = require("../GameController/gameController.js");
const letters = require("../GameController/letters.js");
const position = require("../GameController/position.js")
const ship = require("../GameController/ship");

describe('isShipValidTests', function () {

  it('should return true if the ship is valid', function () {
    var testship = new ship("Battleship", 3, 0);
    testship.addPosition(new position(letters.A, 1));
    testship.addPosition(new position(letters.A, 2));
    testship.addPosition(new position(letters.A, 3));

    var actual = gameController.isShipValid(testship);
    assert.ok(actual);
  });

  it('should return false if the ship is invalid', function () {
    var testship = new ship("Battleship", 3, 0);

    var actual = gameController.isShipValid(testship);
    assert.ok(!actual);
  });

  it('should ensure no ship is outside the field', function () {
    const fleet = gameController.InitializeShips();
    fleet.forEach(ship => {
      ship.positions.forEach(pos => {
        assert.ok(
          pos.column >= 1 && pos.column <= 8 &&
          pos.row >= 1 && pos.row <= 8,
          `Ship ${ship.name} has a position outside the field: column ${pos.column}, row ${pos.row}`
        );
      });
    });
  });

  it('should ensure ships do not cross each other', function () {
    const fleet = gameController.InitializeShips();
    const occupiedPositions = new Set();

    fleet.forEach(ship => {
      ship.positions.forEach(pos => {
        const posKey = `${pos.column},${pos.row}`;
        assert.ok(
          !occupiedPositions.has(posKey),
          `Ship ${ship.name} overlaps with another ship at position column ${pos.column}, row ${pos.row}`
        );
        occupiedPositions.add(posKey);
      });
    });
  });

  it('should ensure all positions are in horizontal or vertical line without gaps', function () {
    const fleet = gameController.InitializeShips();

    fleet.forEach(ship => {
      if (ship.positions.length <= 1) return; // Skip single-position ships

      // Sort positions to check for alignment and gaps
      const sorted = [...ship.positions].sort((a, b) => {
        if (a.column !== b.column) return a.column - b.column;
        return a.row - b.row;
      });

      // Check if all positions are in the same column (vertical)
      const sameColumn = sorted.every(pos => pos.column === sorted[0].column);
      
      // Check if all positions are in the same row (horizontal)
      const sameRow = sorted.every(pos => pos.row === sorted[0].row);

      assert.ok(
        sameColumn || sameRow,
        `Ship ${ship.name} is not aligned horizontally or vertically`
      );

      if (sameColumn) {
        // Check for vertical gaps
        for (let i = 1; i < sorted.length; i++) {
          assert.strictEqual(
            sorted[i].row - sorted[i - 1].row,
            1,
            `Ship ${ship.name} has a gap in vertical alignment between rows ${sorted[i - 1].row} and ${sorted[i].row}`
          );
        }
      } else if (sameRow) {
        // Check for horizontal gaps
        for (let i = 1; i < sorted.length; i++) {
          assert.strictEqual(
            sorted[i].column - sorted[i - 1].column,
            1,
            `Ship ${ship.name} has a gap in horizontal alignment between columns ${sorted[i - 1].column} and ${sorted[i].column}`
          );
        }
      }
    });
  });
});