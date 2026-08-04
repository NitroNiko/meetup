const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  pointsForPlace,
  scoresFromTeamOrder,
  sortLeaderboardRows,
  sortScoreRowsByWinnerMode,
} = require("../lib/scoring");

describe("pointsForPlace", () => {
  it("gives most points to place 1 when highest-score wins", () => {
    assert.equal(pointsForPlace(1, 3, null, "highest-score"), 3);
    assert.equal(pointsForPlace(2, 3, null, "highest-score"), 2);
    assert.equal(pointsForPlace(3, 3, null, "highest-score"), 1);
  });

  it("gives fewest points to place 1 when lowest-score wins", () => {
    assert.equal(pointsForPlace(1, 3, null, "lowest-score"), 1);
    assert.equal(pointsForPlace(3, 3, null, "lowest-score"), 3);
  });

  it("scales with max_points for highest-score", () => {
    assert.equal(pointsForPlace(1, 2, 100, "highest-score"), 100);
    assert.equal(pointsForPlace(2, 2, 100, "highest-score"), 50);
  });
});

describe("scoresFromTeamOrder", () => {
  it("maps order to places and points", () => {
    const scores = scoresFromTeamOrder([10, 20, 30], null, "highest-score");
    assert.deepEqual(
      scores.map((row) => [row.team_id, row.place, row.points]),
      [
        [10, 1, 3],
        [20, 2, 2],
        [30, 3, 1],
      ]
    );
  });

  it("rejects duplicate teams", () => {
    assert.throws(() => scoresFromTeamOrder([1, 1]), /nur einmal/);
  });
});

describe("sortLeaderboardRows", () => {
  const rows = [
    { id: 1, name: "Rot", total_points: 10 },
    { id: 2, name: "Blau", total_points: 30 },
    { id: 3, name: "Grün", total_points: 20 },
  ];

  it("ranks highest score first", () => {
    const ranked = sortLeaderboardRows(rows, "highest-score");
    assert.deepEqual(
      ranked.map((row) => [row.rank, row.name]),
      [
        [1, "Blau"],
        [2, "Grün"],
        [3, "Rot"],
      ]
    );
  });

  it("ranks lowest score first", () => {
    const ranked = sortLeaderboardRows(rows, "lowest-score");
    assert.deepEqual(
      ranked.map((row) => [row.rank, row.name]),
      [
        [1, "Rot"],
        [2, "Grün"],
        [3, "Blau"],
      ]
    );
  });

  it("breaks ties alphabetically", () => {
    const tied = [
      { id: 1, name: "Zebra", total_points: 5 },
      { id: 2, name: "Adler", total_points: 5 },
    ];
    const ranked = sortLeaderboardRows(tied, "highest-score");
    assert.equal(ranked[0].name, "Adler");
    assert.equal(ranked[1].name, "Zebra");
  });
});

describe("sortScoreRowsByWinnerMode", () => {
  const scores = [
    { team_name: "Blau", points: 30 },
    { team_name: "Rot", points: 10 },
    { team_name: "Grün", points: 20 },
  ];

  it("puts highest score first for highest-score mode", () => {
    const ranked = sortScoreRowsByWinnerMode(scores, "highest-score");
    assert.equal(ranked[0].team_name, "Blau");
    assert.equal(ranked[0].rank, 1);
  });

  it("puts lowest score first for lowest-score mode", () => {
    const ranked = sortScoreRowsByWinnerMode(scores, "lowest-score");
    assert.equal(ranked[0].team_name, "Rot");
    assert.equal(ranked[0].rank, 1);
  });
});
