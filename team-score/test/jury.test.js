const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  computeJuryStandings,
  teamOrderFromStandings,
  validateRanking,
} = require("../lib/jury");

const teams = [
  { id: 1, name: "Team Rot", color: "#E12914" },
  { id: 2, name: "Team Blau", color: "#2E6EA7" },
  { id: 3, name: "Team Grün", color: "#5ABC8E" },
];

describe("computeJuryStandings", () => {
  it("computes averages and final order from the spec example", () => {
    const ballots = [
      {
        juror_id: 1,
        rankings: [
          { team_id: 1, place: 1 },
          { team_id: 2, place: 2 },
          { team_id: 3, place: 3 },
        ],
      },
      {
        juror_id: 2,
        rankings: [
          { team_id: 2, place: 1 },
          { team_id: 3, place: 2 },
          { team_id: 1, place: 3 },
        ],
      },
    ];

    const result = computeJuryStandings(ballots, teams, 7);
    assert.equal(result.submitted, 2);
    assert.equal(result.expected, 7);
    assert.deepEqual(
      result.standings.map((row) => [row.place, row.team_name, row.average]),
      [
        [1, "Team Blau", 1.5],
        [2, "Team Rot", 2],
        [3, "Team Grün", 2.5],
      ]
    );
  });

  it("uses first/second place counts as tie-breakers", () => {
    const ballots = [
      {
        juror_id: 1,
        rankings: [
          { team_id: 1, place: 1 },
          { team_id: 2, place: 2 },
          { team_id: 3, place: 3 },
        ],
      },
      {
        juror_id: 2,
        rankings: [
          { team_id: 2, place: 1 },
          { team_id: 1, place: 2 },
          { team_id: 3, place: 3 },
        ],
      },
    ];
    // Both average 1.5 for Rot/Blau; Rot has one 1st and one 2nd, Blau same.
    // Actually both have one 1st and one 2nd → alphabetical: Blau before Rot.
    const result = computeJuryStandings(ballots, teams, 2);
    assert.equal(result.standings[0].average, 1.5);
    assert.equal(result.standings[1].average, 1.5);
    assert.equal(result.standings[0].team_name, "Team Blau");
    assert.equal(result.standings[1].team_name, "Team Rot");
  });

  it("prefers more first places when averages tie", () => {
    const ballots = [
      {
        juror_id: 1,
        rankings: [
          { team_id: 1, place: 1 },
          { team_id: 2, place: 3 },
          { team_id: 3, place: 2 },
        ],
      },
      {
        juror_id: 2,
        rankings: [
          { team_id: 1, place: 3 },
          { team_id: 2, place: 1 },
          { team_id: 3, place: 2 },
        ],
      },
      {
        juror_id: 3,
        rankings: [
          { team_id: 1, place: 2 },
          { team_id: 2, place: 1 },
          { team_id: 3, place: 3 },
        ],
      },
    ];
    // Rot avg (1+3+2)/3 = 2, Blau (3+1+1)/3 = 5/3 ≈ 1.67 → Blau wins on average.
    const result = computeJuryStandings(ballots, teams, 3);
    assert.equal(result.standings[0].team_name, "Team Blau");
  });

  it("handles partial ballots", () => {
    const ballots = [
      {
        juror_id: 1,
        rankings: [
          { team_id: 2, place: 1 },
          { team_id: 1, place: 2 },
          { team_id: 3, place: 3 },
        ],
      },
    ];
    const result = computeJuryStandings(ballots, teams, 4);
    assert.equal(result.submitted, 1);
    assert.equal(result.expected, 4);
    assert.equal(result.standings[0].team_name, "Team Blau");
  });
});

describe("validateRanking / teamOrderFromStandings", () => {
  it("requires a full permutation", () => {
    assert.throws(() => validateRanking([1, 2], [1, 2, 3]), /alle Teams/);
    assert.deepEqual(validateRanking([3, 1, 2], [1, 2, 3]), [3, 1, 2]);
  });

  it("extracts ordered team ids", () => {
    const order = teamOrderFromStandings([
      { place: 2, team_id: 1 },
      { place: 1, team_id: 2 },
      { place: null, team_id: 3 },
    ]);
    assert.deepEqual(order, [2, 1]);
  });
});
