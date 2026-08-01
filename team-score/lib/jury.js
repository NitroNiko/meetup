/**
 * Jury ranking aggregation: average place values, with tie-breakers.
 * Place values: 1 = best. Lowest average wins.
 */

function validateRanking(teamIds, expectedTeamIds) {
  const ids = Array.isArray(teamIds) ? teamIds.map(Number) : [];
  const expected = [...expectedTeamIds].map(Number).sort((a, b) => a - b);
  const got = [...ids].sort((a, b) => a - b);

  if (ids.length !== expected.length) {
    throw new Error("Die Rangfolge muss alle Teams genau einmal enthalten.");
  }
  if (new Set(ids).size !== ids.length) {
    throw new Error("Jedes Team darf nur einmal bewertet werden.");
  }
  for (let i = 0; i < expected.length; i += 1) {
    if (expected[i] !== got[i]) {
      throw new Error("Die Rangfolge muss genau die Teams des Spiels enthalten.");
    }
  }
  return ids;
}

/**
 * @param {Array<{ juror_id: number, rankings: Array<{ team_id: number, place: number }> }>} ballots
 * @param {Array<{ id: number, name: string }>} teams
 * @returns {{ standings: Array, submitted: number, expected: number }}
 */
function computeJuryStandings(ballots, teams, expectedJurorCount) {
  const teamMeta = new Map(teams.map((t) => [Number(t.id), t]));
  const submitted = ballots.length;
  const expected =
    expectedJurorCount != null ? Number(expectedJurorCount) : submitted;

  if (!submitted) {
    return {
      standings: teams.map((team) => ({
        place: null,
        team_id: team.id,
        team_name: team.name,
        team_color: team.color || "#2E6EA7",
        average: null,
        first_places: 0,
        second_places: 0,
        votes: 0,
      })),
      submitted: 0,
      expected,
    };
  }

  const stats = new Map();
  for (const team of teams) {
    stats.set(Number(team.id), {
      team_id: Number(team.id),
      team_name: team.name,
      team_color: team.color || "#2E6EA7",
      sum: 0,
      votes: 0,
      first_places: 0,
      second_places: 0,
    });
  }

  for (const ballot of ballots) {
    for (const item of ballot.rankings || []) {
      const teamId = Number(item.team_id);
      const place = Number(item.place);
      const row = stats.get(teamId);
      if (!row || !Number.isInteger(place) || place < 1) {
        continue;
      }
      row.sum += place;
      row.votes += 1;
      if (place === 1) {
        row.first_places += 1;
      }
      if (place === 2) {
        row.second_places += 1;
      }
    }
  }

  const ranked = [...stats.values()]
    .map((row) => ({
      ...row,
      average: row.votes > 0 ? row.sum / row.votes : null,
    }))
    .sort((a, b) => {
      if (a.average == null && b.average == null) {
        return String(a.team_name).localeCompare(String(b.team_name), "de", {
          sensitivity: "base",
        });
      }
      if (a.average == null) {
        return 1;
      }
      if (b.average == null) {
        return -1;
      }
      if (a.average !== b.average) {
        return a.average - b.average;
      }
      if (a.first_places !== b.first_places) {
        return b.first_places - a.first_places;
      }
      if (a.second_places !== b.second_places) {
        return b.second_places - a.second_places;
      }
      return String(a.team_name).localeCompare(String(b.team_name), "de", {
        sensitivity: "base",
      });
    });

  return {
    standings: ranked.map((row, index) => ({
      place: row.average == null ? null : index + 1,
      team_id: row.team_id,
      team_name: row.team_name,
      team_color: row.team_color || teamMeta.get(row.team_id)?.color || "#2E6EA7",
      average: row.average == null ? null : Number(row.average.toFixed(2)),
      first_places: row.first_places,
      second_places: row.second_places,
      votes: row.votes,
    })),
    submitted,
    expected,
  };
}

/**
 * Ordered team ids from standings (best first). Teams without votes omitted.
 */
function teamOrderFromStandings(standings) {
  return standings
    .filter((row) => row.place != null)
    .sort((a, b) => a.place - b.place)
    .map((row) => row.team_id);
}

module.exports = {
  validateRanking,
  computeJuryStandings,
  teamOrderFromStandings,
};
