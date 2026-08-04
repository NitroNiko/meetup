const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const http = require("http");
const { openDatabase } = require("../db");
const { createApp } = require("../server");

function request(server, method, urlPath, { body, cookie } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body != null ? JSON.stringify(body) : null;
    const address = server.address();
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: address.port,
        path: urlPath,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...(cookie ? { Cookie: cookie } : {}),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf8");
          let json = null;
          try {
            json = text ? JSON.parse(text) : null;
          } catch {
            json = text;
          }
          const setCookie = res.headers["set-cookie"] || [];
          resolve({
            status: res.statusCode,
            json,
            cookie: setCookie.map((item) => item.split(";")[0]).join("; "),
          });
        });
      }
    );
    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

describe("API v2.1 integration", () => {
  let dbPath;
  let db;
  let server;
  let adminCookie = "";
  let ids = {};

  before(async () => {
    process.env.ADMIN_PIN = "1234";
    dbPath = path.join(
      os.tmpdir(),
      `wyc-team-score-test-${Date.now()}-${Math.random().toString(16).slice(2)}.db`
    );
    db = openDatabase(dbPath);
    db.exec(`
      DELETE FROM score_entries;
      DELETE FROM placement_rankings;
      DELETE FROM jury_ballot_items;
      DELETE FROM jury_ballots;
      DELETE FROM score_corrections;
      DELETE FROM games;
      DELETE FROM members;
      DELETE FROM teams;
    `);
    const insertTeam = db.prepare("INSERT INTO teams (name, color) VALUES (?, ?)");
    ids = {
      blue: insertTeam.run("Team Blau", "#2E6EA7").lastInsertRowid,
      red: insertTeam.run("Team Rot", "#E12914").lastInsertRowid,
      green: insertTeam.run("Team Grün", "#5ABC8E").lastInsertRowid,
    };

    const app = createApp(db);
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));

    const login = await request(server, "POST", "/api/admin/login", {
      body: { pin: "1234" },
    });
    assert.equal(login.status, 200);
    adminCookie = login.cookie;
  });

  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
    for (const suffix of ["", "-wal", "-shm"]) {
      const file = `${dbPath}${suffix}`;
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
  });

  it("sorts game scores by winnerMode and only counts completed games", async () => {
    const { blue, red, green } = ids;
    await request(server, "PUT", "/api/settings/leaderboard", {
      cookie: adminCookie,
      body: { winnerMode: "highest-score" },
    });

    const createGame = await request(server, "POST", "/api/games", {
      cookie: adminCookie,
      body: {
        title: "Staffel",
        scoring_mode: "placement",
        status: "active",
        max_points: 30,
      },
    });
    assert.equal(createGame.status, 201);
    const gameId = createGame.json.id;

    const placement = await request(
      server,
      "PUT",
      `/api/games/${gameId}/placement`,
      {
        cookie: adminCookie,
        body: {
          team_ids: [blue, red, green],
          evaluation_date: "2026-07-15",
        },
      }
    );
    assert.equal(placement.status, 200);
    assert.equal(placement.json.scores[0].team_name, "Team Blau");
    assert.equal(placement.json.scores[0].score_date, "2026-07-15");

    let board = await request(server, "GET", "/api/leaderboard?mode=total");
    assert.equal(board.json.teams.every((team) => team.game_points === 0), true);

    await request(server, "PUT", `/api/games/${gameId}`, {
      cookie: adminCookie,
      body: { status: "completed" },
    });

    board = await request(server, "GET", "/api/leaderboard?mode=total");
    assert.equal(board.json.teams[0].name, "Team Blau");

    await request(server, "PUT", "/api/settings/leaderboard", {
      cookie: adminCookie,
      body: { winnerMode: "lowest-score" },
    });

    const game = await request(server, "GET", `/api/games/${gameId}?admin=1`);
    assert.equal(game.json.scores[0].team_name, "Team Grün");
    assert.equal(game.json.winnerMode, "lowest-score");

    board = await request(server, "GET", "/api/leaderboard?mode=total");
    assert.equal(board.json.teams[0].name, "Team Grün");

    const daily = await request(
      server,
      "GET",
      "/api/leaderboard?mode=daily&date=2026-07-15"
    );
    assert.ok(daily.json.teams.some((team) => team.game_points > 0));

    const dailyOther = await request(
      server,
      "GET",
      "/api/leaderboard?mode=daily&date=2026-07-20"
    );
    assert.equal(
      dailyOther.json.teams.every((team) => team.game_points === 0),
      true
    );
  });

  it("supports freitext jurors, soft-delete, and dated corrections", async () => {
    const { blue, red, green } = ids;
    await request(server, "PUT", "/api/settings/leaderboard", {
      cookie: adminCookie,
      body: { winnerMode: "highest-score" },
    });

    const game = await request(server, "POST", "/api/games", {
      cookie: adminCookie,
      body: { title: "Jury-Cup", scoring_mode: "jury", status: "active" },
    });
    const gameId = game.json.id;

    const voteA = await request(
      server,
      "PUT",
      `/api/games/${gameId}/jury-rankings`,
      {
        cookie: adminCookie,
        body: {
          juror_name: "Max Mustermann",
          team_ids: [red, blue, green],
          evaluation_date: "2026-07-15",
        },
      }
    );
    assert.equal(voteA.status, 200);
    assert.equal(voteA.json.submitted, 1);
    assert.equal(voteA.json.updated, false);
    assert.equal(voteA.json.standings[0].team_name, "Team Rot");

    const voteB = await request(
      server,
      "PUT",
      `/api/games/${gameId}/jury-rankings`,
      {
        cookie: adminCookie,
        body: {
          juror_name: "Hans Meyer",
          team_ids: [blue, green, red],
          evaluation_date: "2026-07-15",
        },
      }
    );
    assert.equal(voteB.status, 200);
    assert.equal(voteB.json.submitted, 2);

    const updateA = await request(
      server,
      "PUT",
      `/api/games/${gameId}/jury-rankings`,
      {
        cookie: adminCookie,
        body: {
          juror_name: "Max Mustermann",
          team_ids: [blue, red, green],
          evaluation_date: "2026-07-15",
        },
      }
    );
    assert.equal(updateA.json.updated, true);

    const ballotId = voteA.json.ballot_id;
    const del = await request(
      server,
      "DELETE",
      `/api/games/${gameId}/jury-rankings/${ballotId}`,
      { cookie: adminCookie }
    );
    assert.equal(del.status, 200);
    assert.equal(del.json.submitted, 1);
    assert.equal(del.json.ballots.every((b) => b.id !== ballotId), true);

    await request(server, "PUT", `/api/games/${gameId}`, {
      cookie: adminCookie,
      body: { status: "completed", evaluation_date: "2026-07-15" },
    });

    const correction = await request(server, "POST", "/api/corrections", {
      cookie: adminCookie,
      body: {
        team_id: red,
        points: 5,
        note: "  Bonuspunkte nachträglich vergeben.  ",
        created_by: "Max Mustermann",
        evaluation_date: "2026-07-15",
      },
    });
    assert.equal(correction.status, 201);
    assert.equal(correction.json.evaluation_date, "2026-07-15");
    assert.equal(correction.json.note, "Bonuspunkte nachträglich vergeben.");

    const daily = await request(
      server,
      "GET",
      "/api/leaderboard?mode=daily&date=2026-07-15"
    );
    const redDaily = daily.json.teams.find((team) => team.name === "Team Rot");
    assert.equal(redDaily.adjustment_points, 5);

    const dailyOther = await request(
      server,
      "GET",
      "/api/leaderboard?mode=daily&date=2026-07-20"
    );
    const redOther = dailyOther.json.teams.find((team) => team.name === "Team Rot");
    assert.equal(redOther.adjustment_points, 0);
  });

  it("exposes health version 2.1", async () => {
    const health = await request(server, "GET", "/api/health");
    assert.equal(health.json.version, "2.1.0");
  });
});
