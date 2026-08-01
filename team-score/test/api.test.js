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

describe("API v2 integration", () => {
  let dbPath;
  let db;
  let server;
  let adminCookie = "";

  before(async () => {
    process.env.ADMIN_PIN = "1234";
    dbPath = path.join(
      os.tmpdir(),
      `wyc-team-score-test-${Date.now()}-${Math.random().toString(16).slice(2)}.db`
    );
    db = openDatabase(dbPath);
    // Wipe seed noise for deterministic tests.
    db.exec(`
      DELETE FROM score_entries;
      DELETE FROM placement_rankings;
      DELETE FROM jury_ballot_items;
      DELETE FROM jury_ballots;
      DELETE FROM score_corrections;
      DELETE FROM games;
      DELETE FROM members;
      DELETE FROM jurors;
      DELETE FROM teams;
      UPDATE teams SET adjustment_points = 0;
    `);
    // Fresh teams
    const insertTeam = db.prepare("INSERT INTO teams (name, color) VALUES (?, ?)");
    const blue = insertTeam.run("Team Blau", "#2E6EA7").lastInsertRowid;
    const red = insertTeam.run("Team Rot", "#E12914").lastInsertRowid;
    const green = insertTeam.run("Team Grün", "#5ABC8E").lastInsertRowid;
    globalThis.__ids = { blue, red, green };

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

  it("configures winnerMode and sorts leaderboard accordingly", async () => {
    const { blue, red, green } = globalThis.__ids;
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
        body: { team_ids: [blue, red, green] },
      }
    );
    assert.equal(placement.status, 200);

    // Active game must not count yet.
    let board = await request(server, "GET", "/api/leaderboard?mode=total");
    assert.equal(board.json.teams.every((team) => team.game_points === 0), true);

    await request(server, "PUT", `/api/games/${gameId}`, {
      cookie: adminCookie,
      body: { status: "completed" },
    });

    board = await request(server, "GET", "/api/leaderboard?mode=total");
    assert.equal(board.json.winnerMode, "highest-score");
    assert.equal(board.json.teams[0].name, "Team Blau");

    await request(server, "PUT", "/api/settings/leaderboard", {
      cookie: adminCookie,
      body: { winnerMode: "lowest-score" },
    });

    board = await request(server, "GET", "/api/leaderboard?mode=total");
    assert.equal(board.json.winnerMode, "lowest-score");
    assert.equal(board.json.teams[0].name, "Team Grün");

    // Reopen removes points from leaderboard.
    await request(server, "PUT", `/api/games/${gameId}`, {
      cookie: adminCookie,
      body: { status: "active" },
    });
    board = await request(server, "GET", "/api/leaderboard?mode=total");
    assert.equal(board.json.teams.every((team) => team.game_points === 0), true);
  });

  it("stores jury rankings with live standings and notes on corrections", async () => {
    const { blue, red, green } = globalThis.__ids;

    const jurorA = await request(server, "POST", "/api/jurors", {
      cookie: adminCookie,
      body: { name: "Juror A" },
    });
    const jurorB = await request(server, "POST", "/api/jurors", {
      cookie: adminCookie,
      body: { name: "Juror B" },
    });
    assert.equal(jurorA.status, 201);

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
          juror_id: jurorA.json.id,
          team_ids: [red, blue, green],
        },
      }
    );
    assert.equal(voteA.status, 200);
    assert.equal(voteA.json.submitted, 1);
    assert.equal(voteA.json.expected, 2);
    assert.equal(voteA.json.standings[0].team_name, "Team Rot");

    await request(server, "PUT", `/api/games/${gameId}/jury-rankings`, {
      cookie: adminCookie,
      body: {
        juror_id: jurorB.json.id,
        team_ids: [blue, green, red],
      },
    });

    const standings = await request(
      server,
      "GET",
      `/api/games/${gameId}/standings`,
      { cookie: adminCookie }
    );
    assert.equal(standings.json.submitted, 2);
    assert.deepEqual(
      standings.json.standings.map((row) => row.team_name),
      ["Team Blau", "Team Rot", "Team Grün"]
    );

    // Incomplete game still excluded from leaderboard.
    let board = await request(server, "GET", "/api/leaderboard?mode=total");
    const before = board.json.teams.find((team) => team.name === "Team Blau");

    await request(server, "PUT", `/api/games/${gameId}`, {
      cookie: adminCookie,
      body: { status: "completed" },
    });

    board = await request(server, "GET", "/api/leaderboard?mode=total");
    const after = board.json.teams.find((team) => team.name === "Team Blau");
    assert.ok(after.game_points >= before.game_points);

    const correction = await request(server, "POST", "/api/corrections", {
      cookie: adminCookie,
      body: {
        team_id: red,
        points: 5,
        note: "  Bonuspunkte nachträglich vergeben.  ",
        created_by: "Max Mustermann",
      },
    });
    assert.equal(correction.status, 201);
    assert.equal(correction.json.note, "Bonuspunkte nachträglich vergeben.");
    assert.equal(correction.json.created_by, "Max Mustermann");

    const listed = await request(server, "GET", "/api/corrections");
    assert.ok(listed.json.some((row) => row.id === correction.json.id));

    await request(server, "PUT", `/api/corrections/${correction.json.id}`, {
      cookie: adminCookie,
      body: { note: "Aktualisierte Notiz", points: 5 },
    });
    const updated = await request(
      server,
      "GET",
      `/api/corrections?team_id=${red}`
    );
    assert.equal(updated.json[0].note, "Aktualisierte Notiz");
  });
});
