/**
 * WYC Team Score – frontend controller.
 * Fetches public data and drives the admin workspace when authenticated.
 */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  const COLOR_PRESETS = [
    "#2E6EA7",
    "#E12914",
    "#5ABC8E",
    "#F5C161",
    "#6B5B95",
    "#1B3F61",
    "#0D9488",
    "#EA580C",
  ];

  const state = {
    authenticated: false,
    leaderboardMode: "total",
    leaderboardDate: todayLocal(),
    leaderboard: [],
    teams: [],
    openGames: [],
    completedGames: [],
  };

  function todayLocal() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
  }

  function formatDisplayDate(isoDate) {
    if (!isoDate) {
      return "";
    }
    const [y, m, d] = isoDate.split("-");
    return `${d}.${m}.${y}`;
  }

  async function api(path, options = {}) {
    const response = await fetch(path, {
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      credentials: "same-origin",
      ...options,
    });

    let payload = null;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { error: text };
      }
    }

    if (!response.ok) {
      const message = payload?.error || `Anfrage fehlgeschlagen (${response.status})`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    return payload;
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function formatMembers(members) {
    if (!members?.length) {
      return "Keine Mitglieder";
    }
    return members.map((m) => m.name).join(", ");
  }

  function showMessage(el, text, isError = false) {
    if (!el) {
      return;
    }
    el.hidden = false;
    el.textContent = text;
    el.classList.toggle("error", Boolean(isError));
  }

  function syncLeaderboardControls() {
    const dateWrap = $("#daily-date-wrap");
    const dateInput = $("#leaderboard-date");
    const lead = $("#leaderboard-lead");

    document.querySelectorAll(".mode-btn").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.mode === state.leaderboardMode);
    });

    const isDaily = state.leaderboardMode === "daily";
    dateWrap.hidden = !isDaily;
    if (dateInput && !dateInput.value) {
      dateInput.value = state.leaderboardDate;
    }

    lead.textContent = isDaily
      ? `Punkte vom ${formatDisplayDate(state.leaderboardDate)} – ohne Gesamtkorrekturen.`
      : "Gesamtpunkte aller Teams – inkl. manueller Korrekturen.";
  }

  function renderLeaderboard() {
    const root = $("#leaderboard-list");
    if (!state.leaderboard.length) {
      root.innerHTML = `<div class="empty-state">Noch keine Teams vorhanden.</div>`;
      return;
    }

    root.innerHTML = state.leaderboard
      .map((team, index) => {
        const color = team.color || "#2E6EA7";
        return `
      <article class="leader-row ${index < 3 ? "top" : ""}" role="listitem" style="--team-color:${escapeHtml(color)};animation-delay:${index * 40}ms">
        <div class="rank-badge" aria-label="Platz ${team.rank}">${team.rank}</div>
        <div>
          <p class="team-name"><span class="team-swatch" style="background:${escapeHtml(color)}"></span>${escapeHtml(team.name)}</p>
          <p class="team-members">${escapeHtml(formatMembers(team.members))}</p>
        </div>
        <p class="points">${team.total_points}<span>Punkte</span></p>
      </article>`;
      })
      .join("");
  }

  function renderGameCard(game) {
    const scores = game.scores?.length
      ? `<table class="score-table">
          <thead><tr><th>Team</th><th>Datum</th><th>Punkte</th><th>Notiz</th></tr></thead>
          <tbody>
            ${game.scores
              .map(
                (score) => `<tr>
                  <td><span class="team-swatch" style="background:${escapeHtml(score.team_color || "#2E6EA7")}"></span>${escapeHtml(score.team_name)}</td>
                  <td>${escapeHtml(formatDisplayDate(score.score_date) || "—")}</td>
                  <td>${score.points}</td>
                  <td>${escapeHtml(score.note || "—")}</td>
                </tr>`
              )
              .join("")}
          </tbody>
        </table>`
      : `<p class="team-members">Noch keine Punkte vergeben.</p>`;

    const max =
      game.max_points != null ? `<span>Max. ${game.max_points} Punkte</span>` : "";

    return `<article class="game-card">
      <h3>${escapeHtml(game.title)}</h3>
      <div class="game-meta">
        <span class="status-pill ${game.status}">${game.status === "open" ? "Offen" : "Abgeschlossen"}</span>
        ${max}
      </div>
      <p class="team-members">${escapeHtml(game.description || "Keine Beschreibung.")}</p>
      ${scores}
    </article>`;
  }

  function renderGames() {
    const openRoot = $("#open-games-list");
    const doneRoot = $("#completed-games-list");

    openRoot.innerHTML = state.openGames.length
      ? state.openGames.map(renderGameCard).join("")
      : `<div class="empty-state">Aktuell keine offenen Spiele.</div>`;

    doneRoot.innerHTML = state.completedGames.length
      ? state.completedGames.map(renderGameCard).join("")
      : `<div class="empty-state">Noch keine abgeschlossenen Spiele.</div>`;
  }

  function fillScoreSelects() {
    const gameSelect = $("#score-game-select");
    const teamSelect = $("#score-team-select");
    const correctTeamSelect = $("#correct-team-select");
    const scoreDateInput = $("#score-date-input");
    const allGames = [...state.openGames, ...state.completedGames];

    gameSelect.innerHTML = allGames
      .map(
        (game) =>
          `<option value="${game.id}">${escapeHtml(game.title)} (${game.status === "open" ? "offen" : "fertig"})</option>`
      )
      .join("");

    const teamOptions = state.teams
      .map(
        (team) =>
          `<option value="${team.id}">${escapeHtml(team.name)} (${team.total_points} Pkt.)</option>`
      )
      .join("");

    teamSelect.innerHTML = teamOptions;
    if (correctTeamSelect) {
      correctTeamSelect.innerHTML = teamOptions;
    }
    if (scoreDateInput && !scoreDateInput.value) {
      scoreDateInput.value = todayLocal();
    }
  }

  function renderColorPresets() {
    const root = $("#team-color-presets");
    const colorInput = $("#create-team-form input[name='color']");
    if (!root || !colorInput) {
      return;
    }

    root.innerHTML = COLOR_PRESETS.map(
      (color) =>
        `<button type="button" class="color-preset ${colorInput.value.toUpperCase() === color ? "is-selected" : ""}" data-color="${color}" style="background:${color}" aria-label="Farbe ${color}"></button>`
    ).join("");
  }

  function renderAdminTeams() {
    const root = $("#admin-teams");
    if (!state.teams.length) {
      root.innerHTML = `<div class="empty-state">Keine Teams.</div>`;
      return;
    }

    root.innerHTML = state.teams
      .map((team) => {
        const chips = team.members
          .map(
            (member) => `<span class="chip">
              ${escapeHtml(member.name)}
              <button type="button" data-action="delete-member" data-team-id="${team.id}" data-member-id="${member.id}" aria-label="Mitglied entfernen">×</button>
            </span>`
          )
          .join("");

        const adjustment =
          team.adjustment_points !== 0
            ? ` · Korrektur ${team.adjustment_points > 0 ? "+" : ""}${team.adjustment_points}`
            : "";

        const color = team.color || "#2E6EA7";

        return `<div class="manage-item" data-team-id="${team.id}">
          <div class="manage-head">
            <div>
              <strong><span class="team-swatch" style="background:${escapeHtml(color)}"></span>${escapeHtml(team.name)}</strong>
              <p class="team-members">${team.total_points} Punkte gesamt (${team.game_points} aus Spielen${adjustment})</p>
            </div>
            <div class="manage-actions">
              <button class="button quiet small" type="button" data-action="rename-team" data-team-id="${team.id}" data-name="${escapeHtml(team.name)}">Umbenennen</button>
              <button class="button danger small" type="button" data-action="delete-team" data-team-id="${team.id}">Löschen</button>
            </div>
          </div>
          <div class="member-chips">${chips || `<span class="team-members">Keine Mitglieder</span>`}</div>
          <form class="inline-form" data-action="set-color" data-team-id="${team.id}">
            <input class="inline-color" name="color" type="color" value="${escapeHtml(color)}" aria-label="Teamfarbe" />
            <button class="button quiet small" type="submit">Farbe speichern</button>
          </form>
          <form class="inline-form" data-action="add-member" data-team-id="${team.id}">
            <input name="name" placeholder="Neues Mitglied" required maxlength="80" />
            <button class="button quiet small" type="submit">Hinzufügen</button>
          </form>
          <form class="inline-form" data-action="correct-points" data-team-id="${team.id}">
            <input name="total_points" type="number" step="1" value="${team.total_points}" aria-label="Gesamtpunkte" required />
            <button class="button quiet small" type="submit">Punkte setzen</button>
          </form>
        </div>`;
      })
      .join("");
  }

  function renderAdminGames() {
    const root = $("#admin-games");
    const games = [...state.openGames, ...state.completedGames];
    if (!games.length) {
      root.innerHTML = `<div class="empty-state">Keine Spiele.</div>`;
      return;
    }

    root.innerHTML = games
      .map((game) => {
        const nextStatus = game.status === "open" ? "completed" : "open";
        const nextLabel = game.status === "open" ? "Abschließen" : "Wieder öffnen";
        return `<div class="manage-item">
          <div class="manage-head">
            <div>
              <strong>${escapeHtml(game.title)}</strong>
              <p class="team-members">${escapeHtml(game.description || "Keine Beschreibung")}</p>
              <span class="status-pill ${game.status}">${game.status === "open" ? "Offen" : "Abgeschlossen"}</span>
            </div>
            <div class="manage-actions">
              <button class="button quiet small" type="button" data-action="toggle-game" data-game-id="${game.id}" data-status="${nextStatus}">${nextLabel}</button>
              <button class="button danger small" type="button" data-action="delete-game" data-game-id="${game.id}">Löschen</button>
            </div>
          </div>
        </div>`;
      })
      .join("");
  }

  function setAuthUi(authenticated) {
    state.authenticated = authenticated;
    const label = $("#admin-auth-label");
    const loginPanel = $("#admin-login-panel");
    const workspace = $("#admin-workspace");

    label.textContent = authenticated ? "Angemeldet" : "Nicht angemeldet";
    label.classList.toggle("ok", authenticated);
    loginPanel.classList.toggle("hidden", authenticated);
    loginPanel.hidden = authenticated;
    workspace.classList.toggle("hidden", !authenticated);
    workspace.hidden = !authenticated;
  }

  async function refreshPublicData() {
    const leaderboardQuery =
      state.leaderboardMode === "daily"
        ? `/api/leaderboard?mode=daily&date=${encodeURIComponent(state.leaderboardDate)}`
        : "/api/leaderboard?mode=total";

    const [leaderboardPayload, teams, openGames, completedGames] = await Promise.all([
      api(leaderboardQuery),
      api("/api/teams"),
      api("/api/games?status=open"),
      api("/api/games?status=completed"),
    ]);

    state.leaderboard = Array.isArray(leaderboardPayload)
      ? leaderboardPayload
      : leaderboardPayload.teams || [];
    state.teams = teams;
    state.openGames = openGames;
    state.completedGames = completedGames;

    syncLeaderboardControls();
    renderLeaderboard();
    renderGames();

    if (state.authenticated) {
      fillScoreSelects();
      renderAdminTeams();
      renderAdminGames();
      renderColorPresets();
    }
  }

  async function refreshAuth() {
    const status = await api("/api/admin/status");
    setAuthUi(Boolean(status.authenticated));
  }

  async function bootstrap() {
    const dateInput = $("#leaderboard-date");
    if (dateInput) {
      dateInput.value = state.leaderboardDate;
    }
    const scoreDateInput = $("#score-date-input");
    if (scoreDateInput) {
      scoreDateInput.value = todayLocal();
    }
    renderColorPresets();
    await refreshAuth();
    await refreshPublicData();
  }

  $("#refresh-btn").addEventListener("click", async () => {
    try {
      await refreshPublicData();
    } catch (error) {
      alert(error.message);
    }
  });

  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.leaderboardMode = btn.dataset.mode;
      syncLeaderboardControls();
      try {
        await refreshPublicData();
      } catch (error) {
        alert(error.message);
      }
    });
  });

  $("#leaderboard-date").addEventListener("change", async (event) => {
    state.leaderboardDate = event.target.value || todayLocal();
    if (state.leaderboardMode !== "daily") {
      return;
    }
    try {
      await refreshPublicData();
    } catch (error) {
      alert(error.message);
    }
  });

  $("#team-color-presets").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-color]");
    if (!button) {
      return;
    }
    const colorInput = $("#create-team-form input[name='color']");
    colorInput.value = button.dataset.color;
    renderColorPresets();
  });

  $("#admin-login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const pin = $("#admin-pin").value;
    const message = $("#admin-login-message");
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ pin }),
      });
      $("#admin-pin").value = "";
      showMessage(message, "Erfolgreich angemeldet.");
      setAuthUi(true);
      await refreshPublicData();
    } catch (error) {
      showMessage(message, error.message, true);
    }
  });

  $("#admin-logout").addEventListener("click", async () => {
    await api("/api/admin/logout", { method: "POST", body: "{}" });
    setAuthUi(false);
    showMessage($("#admin-login-message"), "Abgemeldet.");
  });

  $("#create-team-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const members = String(data.get("members") || "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean)
      .map((name) => ({ name }));

    try {
      await api("/api/teams", {
        method: "POST",
        body: JSON.stringify({
          name: data.get("name"),
          color: data.get("color"),
          members,
        }),
      });
      form.reset();
      form.querySelector("input[name='color']").value = "#2E6EA7";
      renderColorPresets();
      showMessage($("#admin-action-message"), "Team angelegt.");
      await refreshPublicData();
    } catch (error) {
      showMessage($("#admin-action-message"), error.message, true);
    }
  });

  $("#create-game-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const maxRaw = String(data.get("max_points") || "").trim();

    try {
      await api("/api/games", {
        method: "POST",
        body: JSON.stringify({
          title: data.get("title"),
          description: data.get("description"),
          max_points: maxRaw === "" ? null : Number(maxRaw),
        }),
      });
      form.reset();
      showMessage($("#admin-action-message"), "Spiel angelegt.");
      await refreshPublicData();
    } catch (error) {
      showMessage($("#admin-action-message"), error.message, true);
    }
  });

  $("#award-score-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    try {
      await api("/api/scores", {
        method: "PUT",
        body: JSON.stringify({
          game_id: Number(data.get("game_id")),
          team_id: Number(data.get("team_id")),
          points: Number(data.get("points")),
          score_date: data.get("score_date"),
          note: data.get("note") || "",
        }),
      });
      showMessage($("#admin-action-message"), "Punkte gespeichert.");
      await refreshPublicData();
    } catch (error) {
      showMessage($("#admin-action-message"), error.message, true);
    }
  });

  $("#correct-points-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const teamId = Number(data.get("team_id"));
    const totalRaw = String(data.get("total_points") || "").trim();
    const deltaRaw = String(data.get("delta") || "").trim();

    const body = {};
    if (deltaRaw !== "") {
      body.delta = Number(deltaRaw);
    } else if (totalRaw !== "") {
      body.total_points = Number(totalRaw);
    } else {
      showMessage(
        $("#admin-action-message"),
        "Bitte Gesamtpunkte oder Differenz angeben.",
        true
      );
      return;
    }

    try {
      await api(`/api/teams/${teamId}/points`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      form.reset();
      showMessage($("#admin-action-message"), "Punkte korrigiert.");
      await refreshPublicData();
    } catch (error) {
      showMessage($("#admin-action-message"), error.message, true);
    }
  });

  $("#admin-teams").addEventListener("submit", async (event) => {
    const addMemberForm = event.target.closest("form[data-action='add-member']");
    const correctForm = event.target.closest("form[data-action='correct-points']");
    const colorForm = event.target.closest("form[data-action='set-color']");
    if (!addMemberForm && !correctForm && !colorForm) {
      return;
    }
    event.preventDefault();

    try {
      if (addMemberForm) {
        const teamId = addMemberForm.dataset.teamId;
        const name = new FormData(addMemberForm).get("name");
        await api(`/api/teams/${teamId}/members`, {
          method: "POST",
          body: JSON.stringify({ name }),
        });
        showMessage($("#admin-action-message"), "Mitglied hinzugefügt.");
      }

      if (correctForm) {
        const teamId = correctForm.dataset.teamId;
        const totalPoints = Number(new FormData(correctForm).get("total_points"));
        await api(`/api/teams/${teamId}/points`, {
          method: "PUT",
          body: JSON.stringify({ total_points: totalPoints }),
        });
        showMessage($("#admin-action-message"), "Punkte korrigiert.");
      }

      if (colorForm) {
        const teamId = colorForm.dataset.teamId;
        const color = new FormData(colorForm).get("color");
        const team = state.teams.find((item) => String(item.id) === String(teamId));
        await api(`/api/teams/${teamId}`, {
          method: "PUT",
          body: JSON.stringify({ name: team?.name, color }),
        });
        showMessage($("#admin-action-message"), "Teamfarbe gespeichert.");
      }

      await refreshPublicData();
    } catch (error) {
      showMessage($("#admin-action-message"), error.message, true);
    }
  });

  $("#admin-teams").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    try {
      if (action === "delete-member") {
        await api(
          `/api/teams/${button.dataset.teamId}/members/${button.dataset.memberId}`,
          { method: "DELETE" }
        );
        showMessage($("#admin-action-message"), "Mitglied entfernt.");
      }

      if (action === "delete-team") {
        if (!confirm("Team wirklich löschen? Zugehörige Punkte entfallen.")) {
          return;
        }
        await api(`/api/teams/${button.dataset.teamId}`, { method: "DELETE" });
        showMessage($("#admin-action-message"), "Team gelöscht.");
      }

      if (action === "rename-team") {
        const next = prompt("Neuer Teamname:", button.dataset.name);
        if (!next) {
          return;
        }
        const team = state.teams.find(
          (item) => String(item.id) === String(button.dataset.teamId)
        );
        await api(`/api/teams/${button.dataset.teamId}`, {
          method: "PUT",
          body: JSON.stringify({ name: next, color: team?.color }),
        });
        showMessage($("#admin-action-message"), "Team umbenannt.");
      }

      await refreshPublicData();
    } catch (error) {
      showMessage($("#admin-action-message"), error.message, true);
    }
  });

  $("#admin-games").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    try {
      if (button.dataset.action === "toggle-game") {
        await api(`/api/games/${button.dataset.gameId}`, {
          method: "PUT",
          body: JSON.stringify({ status: button.dataset.status }),
        });
        showMessage($("#admin-action-message"), "Spielstatus aktualisiert.");
      }

      if (button.dataset.action === "delete-game") {
        if (!confirm("Spiel wirklich löschen?")) {
          return;
        }
        await api(`/api/games/${button.dataset.gameId}`, { method: "DELETE" });
        showMessage($("#admin-action-message"), "Spiel gelöscht.");
      }

      await refreshPublicData();
    } catch (error) {
      showMessage($("#admin-action-message"), error.message, true);
    }
  });

  bootstrap().catch((error) => {
    console.error(error);
    $("#leaderboard-list").innerHTML = `<div class="empty-state">Daten konnten nicht geladen werden: ${escapeHtml(error.message)}</div>`;
  });
})();
