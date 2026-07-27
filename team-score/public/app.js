/**
 * WYC Team Score – frontend controller.
 * Fetches public data and drives the admin workspace when authenticated.
 */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);

  const state = {
    authenticated: false,
    leaderboard: [],
    teams: [],
    openGames: [],
    completedGames: [],
  };

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

  function renderLeaderboard() {
    const root = $("#leaderboard-list");
    if (!state.leaderboard.length) {
      root.innerHTML = `<div class="empty-state">Noch keine Teams vorhanden.</div>`;
      return;
    }

    root.innerHTML = state.leaderboard
      .map(
        (team, index) => `
      <article class="leader-row ${index < 3 ? "top" : ""}" role="listitem" style="animation-delay:${index * 40}ms">
        <div class="rank-badge" aria-label="Platz ${team.rank}">${team.rank}</div>
        <div>
          <p class="team-name">${escapeHtml(team.name)}</p>
          <p class="team-members">${escapeHtml(formatMembers(team.members))}</p>
        </div>
        <p class="points">${team.total_points}<span>Punkte</span></p>
      </article>`
      )
      .join("");
  }

  function renderGameCard(game) {
    const scores = game.scores?.length
      ? `<table class="score-table">
          <thead><tr><th>Team</th><th>Punkte</th><th>Notiz</th></tr></thead>
          <tbody>
            ${game.scores
              .map(
                (score) => `<tr>
                  <td>${escapeHtml(score.team_name)}</td>
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
    const allGames = [...state.openGames, ...state.completedGames];

    gameSelect.innerHTML = allGames
      .map(
        (game) =>
          `<option value="${game.id}">${escapeHtml(game.title)} (${game.status === "open" ? "offen" : "fertig"})</option>`
      )
      .join("");

    teamSelect.innerHTML = state.teams
      .map((team) => `<option value="${team.id}">${escapeHtml(team.name)}</option>`)
      .join("");
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

        return `<div class="manage-item" data-team-id="${team.id}">
          <div class="manage-head">
            <div>
              <strong>${escapeHtml(team.name)}</strong>
              <p class="team-members">${team.total_points} Punkte gesamt</p>
            </div>
            <div class="manage-actions">
              <button class="button quiet small" type="button" data-action="rename-team" data-team-id="${team.id}" data-name="${escapeHtml(team.name)}">Umbenennen</button>
              <button class="button danger small" type="button" data-action="delete-team" data-team-id="${team.id}">Löschen</button>
            </div>
          </div>
          <div class="member-chips">${chips || `<span class="team-members">Keine Mitglieder</span>`}</div>
          <form class="inline-form" data-action="add-member" data-team-id="${team.id}">
            <input name="name" placeholder="Neues Mitglied" required maxlength="80" />
            <button class="button quiet small" type="submit">Hinzufügen</button>
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
    const [leaderboard, teams, openGames, completedGames] = await Promise.all([
      api("/api/leaderboard"),
      api("/api/teams"),
      api("/api/games?status=open"),
      api("/api/games?status=completed"),
    ]);

    state.leaderboard = leaderboard;
    state.teams = teams;
    state.openGames = openGames;
    state.completedGames = completedGames;

    renderLeaderboard();
    renderGames();

    if (state.authenticated) {
      fillScoreSelects();
      renderAdminTeams();
      renderAdminGames();
    }
  }

  async function refreshAuth() {
    const status = await api("/api/admin/status");
    setAuthUi(Boolean(status.authenticated));
  }

  async function bootstrap() {
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
          members,
        }),
      });
      form.reset();
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
          note: data.get("note") || "",
        }),
      });
      showMessage($("#admin-action-message"), "Punkte gespeichert.");
      await refreshPublicData();
    } catch (error) {
      showMessage($("#admin-action-message"), error.message, true);
    }
  });

  $("#admin-teams").addEventListener("submit", async (event) => {
    const form = event.target.closest("form[data-action='add-member']");
    if (!form) {
      return;
    }
    event.preventDefault();
    const teamId = form.dataset.teamId;
    const name = new FormData(form).get("name");
    try {
      await api(`/api/teams/${teamId}/members`, {
        method: "POST",
        body: JSON.stringify({ name }),
      });
      showMessage($("#admin-action-message"), "Mitglied hinzugefügt.");
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
        await api(`/api/teams/${button.dataset.teamId}/members/${button.dataset.memberId}`, {
          method: "DELETE",
        });
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
        await api(`/api/teams/${button.dataset.teamId}`, {
          method: "PUT",
          body: JSON.stringify({ name: next }),
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
