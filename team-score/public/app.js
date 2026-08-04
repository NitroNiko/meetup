/**
 * WYC Team Score – frontend controller (v2.1).
 */
(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const DRAFT_KEY = "wyc-team-score-drafts-v1";
  const HEALTH_THROTTLE_MS = 30_000;
  const TOAST_MS = 1000;

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

  const STATUS_LABELS = {
    draft: "Entwurf",
    active: "Laufend",
    completed: "Abgeschlossen",
    cancelled: "Abgebrochen",
    open: "Laufend",
  };

  const state = {
    authenticated: false,
    leaderboardMode: "total",
    leaderboardDate: todayLocal(),
    winnerMode: "highest-score",
    leaderboard: [],
    teams: [],
    games: [],
    corrections: [],
    placementDrafts: {},
    juryDrafts: {},
    connection: "offline",
    lastHealthAt: 0,
    healthInFlight: false,
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
    const [y, m, d] = String(isoDate).slice(0, 10).split("-");
    return `${d}.${m}.${y}`;
  }

  function formatDateTime(value) {
    if (!value) {
      return "—";
    }
    const date = new Date(value.includes("T") ? value : `${value}Z`);
    if (Number.isNaN(date.getTime())) {
      return formatDisplayDate(value) || value;
    }
    return date.toLocaleString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  function statusLabel(status) {
    return STATUS_LABELS[status] || status;
  }

  function scoringLabel(mode) {
    return mode === "jury" ? "Jurorenentscheidung" : "Platzierungswertung";
  }

  function canPersist() {
    return state.connection === "online";
  }

  /* ---------- Toasts ---------- */

  function showToast(text, type = "success") {
    const root = $("#toast-root");
    if (!root) {
      return;
    }
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = text;
    root.appendChild(el);
    window.setTimeout(() => {
      el.remove();
    }, TOAST_MS);
  }

  /* ---------- Draft buffer ---------- */

  function readDrafts() {
    try {
      return JSON.parse(localStorage.getItem(DRAFT_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function writeDrafts(drafts) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  }

  function saveFormDraft(form) {
    if (!form?.dataset?.draft) {
      return;
    }
    const drafts = readDrafts();
    const data = {};
    new FormData(form).forEach((value, key) => {
      data[key] = String(value);
    });
    drafts[form.dataset.draft] = data;
    writeDrafts(drafts);
  }

  function restoreFormDraft(form) {
    if (!form?.dataset?.draft) {
      return;
    }
    const data = readDrafts()[form.dataset.draft];
    if (!data) {
      return;
    }
    Object.entries(data).forEach(([key, value]) => {
      const field = form.elements.namedItem(key);
      if (!field) {
        return;
      }
      if (field instanceof RadioNodeList) {
        field.value = value;
      } else if (field.type === "radio" || field.type === "checkbox") {
        field.checked = field.value === value;
      } else {
        field.value = value;
      }
    });
  }

  function clearFormDraft(form) {
    if (!form?.dataset?.draft) {
      return;
    }
    const drafts = readDrafts();
    delete drafts[form.dataset.draft];
    writeDrafts(drafts);
  }

  function restoreAllDrafts() {
    document.querySelectorAll("form[data-draft]").forEach(restoreFormDraft);
  }

  /* ---------- Connection ---------- */

  function setConnection(status, { toast } = {}) {
    const prev = state.connection;
    state.connection = status;
    document.body.classList.toggle("backend-offline", status === "offline" || status === "waking-up");
    document.body.classList.toggle("backend-unauthorized", status === "unauthorized");

    const pill = $("#connection-pill");
    const pillText = $("#connection-pill-text");
    const banner = $("#connection-banner");
    const bannerText = $("#connection-banner-text");
    const loginBtn = $("#connection-login-btn");
    const offlineWarning = $("#admin-offline-warning");

    const labels = {
      online: "Backend verbunden",
      "waking-up": "Verbindung wird hergestellt…",
      offline: "Backend nicht erreichbar",
      unauthorized: "Anmeldung erforderlich",
    };

    pill.className = `connection-pill ${
      status === "waking-up" ? "waking" : status === "online" ? "online" : status
    }`;
    pillText.textContent = labels[status] || status;

    const showBanner = status !== "online";
    banner.hidden = !showBanner;
    banner.classList.toggle("hidden", !showBanner);
    banner.classList.toggle("waking", status === "waking-up");
    banner.classList.toggle("unauthorized", status === "unauthorized");
    bannerText.textContent =
      status === "unauthorized"
        ? "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an."
        : status === "waking-up"
          ? "Der Server wird gerade gestartet. Bitte kurz warten…"
          : "Backend aktuell nicht erreichbar.";
    loginBtn.hidden = status !== "unauthorized";

    if (offlineWarning) {
      const showWarn = status !== "online" && status !== "unauthorized";
      offlineWarning.hidden = !showWarn;
      offlineWarning.classList.toggle("hidden", !showWarn);
    }

    if (toast) {
      if (status === "online" && prev !== "online") {
        showToast("Backend-Verbindung wiederhergestellt.", "success");
      } else if (status === "offline" && prev !== "offline") {
        showToast("Backend aktuell nicht erreichbar.", "error");
      } else if (status === "unauthorized") {
        showToast("Bitte erneut anmelden.", "error");
      }
    }
  }

  async function checkHealth({ force = false, toast = false } = {}) {
    const now = Date.now();
    if (!force && now - state.lastHealthAt < HEALTH_THROTTLE_MS) {
      return state.connection;
    }
    if (state.healthInFlight) {
      return state.connection;
    }

    state.healthInFlight = true;
    if (state.connection === "offline") {
      setConnection("waking-up");
    }

    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 12_000);
      const response = await fetch("/api/health", {
        credentials: "same-origin",
        signal: controller.signal,
      });
      window.clearTimeout(timer);
      state.lastHealthAt = Date.now();
      if (!response.ok) {
        setConnection("offline", { toast });
        return state.connection;
      }
      setConnection("online", { toast });
      return state.connection;
    } catch {
      state.lastHealthAt = Date.now();
      setConnection("offline", { toast });
      return state.connection;
    } finally {
      state.healthInFlight = false;
    }
  }

  function bindActivityWakeups() {
    const wake = () => {
      checkHealth({ toast: true });
    };
    ["click", "focusin", "keydown", "scroll"].forEach((eventName) => {
      document.addEventListener(eventName, wake, { passive: true });
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        checkHealth({ force: true, toast: true });
      }
    });
  }

  /* ---------- API ---------- */

  async function api(path, options = {}) {
    if (!options.skipHealthGate && options.method && options.method !== "GET") {
      const status = await checkHealth({ force: true, toast: true });
      if (status !== "online") {
        const error = new Error(
          status === "unauthorized"
            ? "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an."
            : "Backend aktuell nicht erreichbar. Bitte warte und versuche es erneut."
        );
        error.status = status === "unauthorized" ? 401 : 0;
        throw error;
      }
    }

    let response;
    try {
      response = await fetch(path, {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        credentials: "same-origin",
        ...options,
      });
    } catch {
      setConnection("offline", { toast: true });
      const error = new Error("Backend aktuell nicht erreichbar.");
      error.status = 0;
      throw error;
    }

    let payload = null;
    const text = await response.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { error: text };
      }
    }

    if (response.status === 401 || response.status === 403) {
      setConnection("unauthorized", { toast: true });
      setAuthUi(false);
      const error = new Error(
        payload?.error || "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an."
      );
      error.status = response.status;
      throw error;
    }

    if (!response.ok) {
      const message = payload?.error || `Anfrage fehlgeschlagen (${response.status})`;
      const error = new Error(message);
      error.status = response.status;
      throw error;
    }

    if (state.connection !== "online") {
      setConnection("online");
    }
    return payload;
  }

  /* ---------- Domain helpers ---------- */

  function openGames() {
    return state.games.filter((game) =>
      ["active", "draft", "open"].includes(game.status)
    );
  }

  function completedGames() {
    return state.games.filter((game) => game.status === "completed");
  }

  function ensurePlacementDraft(gameId) {
    if (!state.placementDrafts[gameId]) {
      const game = state.games.find((item) => item.id === gameId);
      const fromSaved = (game?.placement || [])
        .slice()
        .sort((a, b) => a.place - b.place)
        .map((row) => row.team_id);
      state.placementDrafts[gameId] = {
        teamIds:
          fromSaved.length === state.teams.length
            ? fromSaved
            : state.teams.map((team) => team.id),
        evaluationDate: game?.evaluation_date || todayLocal(),
      };
    }
    return state.placementDrafts[gameId];
  }

  function ensureJuryDraft(gameId) {
    if (!state.juryDrafts[gameId]) {
      const game = state.games.find((item) => item.id === gameId);
      state.juryDrafts[gameId] = {
        jurorName: "",
        teamIds: state.teams.map((team) => team.id),
        evaluationDate: game?.evaluation_date || todayLocal(),
      };
    }
    return state.juryDrafts[gameId];
  }

  function moveInList(list, index, direction) {
    const next = index + direction;
    if (next < 0 || next >= list.length) {
      return list;
    }
    const copy = [...list];
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    return copy;
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

    const logic =
      state.winnerMode === "lowest-score"
        ? "niedrigste Punktzahl gewinnt"
        : "höchste Punktzahl gewinnt";

    lead.textContent = isDaily
      ? `Punkte vom ${formatDisplayDate(state.leaderboardDate)} aus abgeschlossenen Spielen und Korrekturen (${logic}).`
      : `Nur abgeschlossene Spiele + Korrekturen – ${logic}.`;
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

  function renderScoreTable(scores, { showDate = true } = {}) {
    if (!scores?.length) {
      return `<p class="team-members">Noch keine Punkte vergeben.</p>`;
    }
    return `<table class="score-table">
      <thead><tr><th>Platz</th><th>Team</th>${showDate ? "<th>Datum</th>" : ""}<th>Punkte</th><th>Notiz</th></tr></thead>
      <tbody>
        ${scores
          .map(
            (score, index) => `<tr class="${index === 0 ? "is-leader" : ""}">
              <td>${score.rank || index + 1}</td>
              <td><span class="team-swatch" style="background:${escapeHtml(score.team_color || "#2E6EA7")}"></span>${escapeHtml(score.team_name)}</td>
              ${showDate ? `<td>${escapeHtml(formatDisplayDate(score.score_date) || "—")}</td>` : ""}
              <td>${score.points}</td>
              <td>${escapeHtml(score.note || "—")}</td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table>`;
  }

  function renderGameCard(game) {
    const max =
      game.max_points != null ? `<span>Max. ${game.max_points} Punkte</span>` : "";
    const counts = game.counts_for_leaderboard
      ? `<span class="leaderboard-flag yes">Im Leaderboard</span>`
      : `<span class="leaderboard-flag no">Noch nicht im Leaderboard</span>`;

    return `<article class="game-card">
      <h3>${escapeHtml(game.title)}</h3>
      <div class="game-meta">
        <span class="status-pill ${escapeHtml(game.status)}">${escapeHtml(statusLabel(game.status))}</span>
        <span class="mode-pill">${escapeHtml(scoringLabel(game.scoring_mode))}</span>
        ${max}
        ${counts}
      </div>
      <p class="team-members">${escapeHtml(game.description || "Keine Beschreibung.")}</p>
      ${renderScoreTable(game.scores)}
    </article>`;
  }

  function renderGames() {
    const openRoot = $("#open-games-list");
    const doneRoot = $("#completed-games-list");
    const open = openGames();
    const done = completedGames();

    openRoot.innerHTML = open.length
      ? open.map(renderGameCard).join("")
      : `<div class="empty-state">Aktuell keine offenen Spiele.</div>`;

    doneRoot.innerHTML = done.length
      ? done.map(renderGameCard).join("")
      : `<div class="empty-state">Noch keine abgeschlossenen Spiele.</div>`;
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

  function renderSettingsForm() {
    const form = $("#settings-form");
    if (!form) {
      return;
    }
    const radio = form.querySelector(
      `input[name="winnerMode"][value="${state.winnerMode}"]`
    );
    if (radio) {
      radio.checked = true;
    }
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
              <button class="button quiet small save-gated" type="button" data-action="rename-team" data-team-id="${team.id}" data-name="${escapeHtml(team.name)}">Umbenennen</button>
              <button class="button danger small save-gated" type="button" data-action="delete-team" data-team-id="${team.id}">Löschen</button>
            </div>
          </div>
          <div class="member-chips">${chips || `<span class="team-members">Keine Mitglieder</span>`}</div>
          <form class="inline-form" data-action="set-color" data-team-id="${team.id}">
            <input class="inline-color" name="color" type="color" value="${escapeHtml(color)}" aria-label="Teamfarbe" />
            <button class="button quiet small save-gated" type="submit">Farbe speichern</button>
          </form>
          <form class="inline-form" data-action="add-member" data-team-id="${team.id}">
            <input name="name" placeholder="Neues Mitglied" required maxlength="80" />
            <button class="button quiet small save-gated" type="submit">Hinzufügen</button>
          </form>
        </div>`;
      })
      .join("");
  }

  function renderRankList(teamIds, gameId, kind) {
    return `<ol class="rank-list" data-game-id="${gameId}" data-rank-kind="${kind}">
      ${teamIds
        .map((teamId, index) => {
          const team = state.teams.find((item) => item.id === teamId);
          if (!team) {
            return "";
          }
          return `<li class="rank-item" data-team-id="${team.id}">
            <span class="rank-place">${index + 1}.</span>
            <span class="team-swatch" style="background:${escapeHtml(team.color || "#2E6EA7")}"></span>
            <span>${escapeHtml(team.name)}</span>
            <span class="rank-controls">
              <button type="button" class="button quiet small" data-action="rank-up" data-game-id="${gameId}" data-kind="${kind}" data-index="${index}" aria-label="Nach oben">↑</button>
              <button type="button" class="button quiet small" data-action="rank-down" data-game-id="${gameId}" data-kind="${kind}" data-index="${index}" aria-label="Nach unten">↓</button>
            </span>
          </li>`;
        })
        .join("")}
    </ol>`;
  }

  function renderJuryStandings(game) {
    const jury = game.jury;
    if (!jury) {
      return `<p class="team-members">Noch keine Jurorenbewertungen.</p>`;
    }

    const rows = (jury.standings || [])
      .filter((row) => row.average != null)
      .map(
        (row) => `<tr class="${row.place === 1 ? "is-leader" : ""}">
          <td>${row.place}</td>
          <td><span class="team-swatch" style="background:${escapeHtml(row.team_color || "#2E6EA7")}"></span>${escapeHtml(row.team_name)}</td>
          <td>${Number(row.average).toFixed(2)}</td>
        </tr>`
      )
      .join("");

    return `<div class="standings-block">
      <p class="team-members"><strong>${jury.submitted}</strong> Jurorenbewertung${jury.submitted === 1 ? "" : "en"} abgegeben.</p>
      ${
        rows
          ? `<table class="score-table">
              <thead><tr><th>Platz</th><th>Team</th><th>Durchschnitt</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>`
          : `<p class="team-members">Zwischenstand erscheint nach der ersten Bewertung.</p>`
      }
      ${
        jury.ballots?.length
          ? `<details class="ballot-details" open>
              <summary>Abgegebene Bewertungen</summary>
              <ul class="ballot-list">
                ${jury.ballots
                  .map(
                    (ballot) => `<li>
                      <div class="manage-head">
                        <div>
                          <strong>${escapeHtml(ballot.juror_name)}</strong>
                          <span class="team-members">Datum: ${escapeHtml(formatDisplayDate(ballot.evaluation_date))} · ${escapeHtml(formatDateTime(ballot.updated_at))}</span>
                          <ol>${(ballot.rankings || [])
                            .map((rank) => `<li>${escapeHtml(rank.team_name)}</li>`)
                            .join("")}</ol>
                        </div>
                        <button class="button danger small save-gated" type="button" data-action="delete-jury" data-game-id="${game.id}" data-ballot-id="${ballot.id}">Löschen</button>
                      </div>
                    </li>`
                  )
                  .join("")}
              </ul>
            </details>`
          : ""
      }
    </div>`;
  }

  function renderAdminGames() {
    const root = $("#admin-games");
    if (!state.games.length) {
      root.innerHTML = `<div class="empty-state">Keine Spiele.</div>`;
      return;
    }

    root.innerHTML = state.games
      .map((game) => {
        const nextStatus = game.status === "completed" ? "active" : "completed";
        const nextLabel =
          game.status === "completed" ? "Wieder öffnen" : "Abschließen";
        const countsNote = game.counts_for_leaderboard
          ? "Zählt für das Leaderboard"
          : "Wird noch nicht im Leaderboard berücksichtigt";

        let scoringUi = "";
        if (game.scoring_mode === "placement") {
          const draft = ensurePlacementDraft(game.id);
          scoringUi = `<div class="scoring-panel">
            <h4>Platzierungswertung</h4>
            <p class="team-members">Teams in Reihenfolge bringen (Platz 1 oben). Sortierung der Spielpunkte folgt der Gewinnlogik.</p>
            <label class="inline-label">
              Bewertungsdatum
              <input type="date" data-action="placement-date" data-game-id="${game.id}" value="${escapeHtml(draft.evaluationDate)}" />
            </label>
            ${renderRankList(draft.teamIds, game.id, "placement")}
            <button class="button primary small save-gated" type="button" data-action="save-placement" data-game-id="${game.id}">Reihenfolge speichern</button>
          </div>`;
        } else {
          const draft = ensureJuryDraft(game.id);
          scoringUi = `<div class="scoring-panel">
            <h4>Jurorenentscheidung</h4>
            <p class="team-members">Jurorname und Rangfolge erfassen – Zwischenstand wird serverseitig berechnet.</p>
            <label class="inline-label">
              Juror
              <input type="text" data-action="jury-name" data-game-id="${game.id}" value="${escapeHtml(draft.jurorName)}" maxlength="80" required placeholder="Max Mustermann" />
            </label>
            <label class="inline-label">
              Bewertungsdatum
              <input type="date" data-action="jury-date" data-game-id="${game.id}" value="${escapeHtml(draft.evaluationDate)}" />
            </label>
            ${renderRankList(draft.teamIds, game.id, "jury")}
            <button class="button primary small save-gated" type="button" data-action="save-jury" data-game-id="${game.id}">Bewertung speichern</button>
            ${renderJuryStandings(game)}
          </div>`;
        }

        return `<div class="manage-item game-manage-item" data-game-id="${game.id}">
          <div class="manage-head">
            <div>
              <strong>${escapeHtml(game.title)}</strong>
              <p class="team-members">${escapeHtml(game.description || "Keine Beschreibung")}</p>
              <div class="game-meta">
                <span class="status-pill ${escapeHtml(game.status)}">${escapeHtml(statusLabel(game.status))}</span>
                <span class="mode-pill">${escapeHtml(scoringLabel(game.scoring_mode))}</span>
                <span class="leaderboard-flag ${game.counts_for_leaderboard ? "yes" : "no"}">${escapeHtml(countsNote)}</span>
              </div>
            </div>
            <div class="manage-actions">
              <button class="button quiet small save-gated" type="button" data-action="toggle-game" data-game-id="${game.id}" data-status="${nextStatus}">${nextLabel}</button>
              <button class="button quiet small save-gated" type="button" data-action="set-status" data-game-id="${game.id}" data-status="cancelled">Abbrechen</button>
              <button class="button danger small save-gated" type="button" data-action="delete-game" data-game-id="${game.id}">Löschen</button>
            </div>
          </div>
          ${scoringUi}
          <div class="result-block">
            <h4>Spielpunkte (gemäß Gewinnlogik)</h4>
            ${renderScoreTable(game.scores, { showDate: true })}
            <p class="team-members">Manuelle Korrekturen siehe Bereich „Punkte korrigieren“.</p>
          </div>
        </div>`;
      })
      .join("");
  }

  function renderAdminCorrections() {
    const root = $("#admin-corrections");
    const select = $("#correct-team-select");
    if (select) {
      select.innerHTML = state.teams
        .map(
          (team) =>
            `<option value="${team.id}">${escapeHtml(team.name)} (${team.total_points} Pkt.)</option>`
        )
        .join("");
    }
    const dateInput = $("#correct-date-input");
    if (dateInput && !dateInput.value) {
      dateInput.value = todayLocal();
    }

    if (!state.corrections.length) {
      root.innerHTML = `<div class="empty-state">Noch keine Punktekorrekturen.</div>`;
      return;
    }

    root.innerHTML = state.corrections
      .map((item) => {
        const sign = item.points > 0 ? "+" : "";
        return `<div class="manage-item correction-item" data-correction-id="${item.id}">
          <div class="manage-head">
            <div>
              <strong>${sign}${item.points} Punkte</strong>
              <p class="team-members">
                Team: ${escapeHtml(item.team_name)} · Bewertungsdatum: ${escapeHtml(formatDisplayDate(item.evaluation_date))} · Bearbeitet von: ${escapeHtml(item.created_by)} · Erfasst: ${escapeHtml(formatDateTime(item.created_at))}
              </p>
              <p class="correction-note"><strong>Notiz:</strong> ${escapeHtml(item.note || "—")}</p>
            </div>
            <div class="manage-actions">
              <button class="button quiet small save-gated" type="button" data-action="edit-correction" data-correction-id="${item.id}">Bearbeiten</button>
              <button class="button danger small save-gated" type="button" data-action="delete-correction" data-correction-id="${item.id}">Löschen</button>
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

  function setupAdminNav() {
    const links = document.querySelectorAll("[data-admin-nav]");
    const sections = [...links]
      .map((link) => document.getElementById(link.dataset.adminNav))
      .filter(Boolean);
    if (!links.length || !("IntersectionObserver" in window)) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) {
          return;
        }
        links.forEach((link) => {
          link.classList.toggle(
            "is-active",
            link.dataset.adminNav === visible.target.id
          );
        });
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.4, 0.7] }
    );
    sections.forEach((section) => observer.observe(section));
  }

  async function refreshPublicData() {
    const leaderboardQuery =
      state.leaderboardMode === "daily"
        ? `/api/leaderboard?mode=daily&date=${encodeURIComponent(state.leaderboardDate)}`
        : "/api/leaderboard?mode=total";

    const [leaderboardPayload, teams, games, settings] = await Promise.all([
      api(leaderboardQuery, { skipHealthGate: true }),
      api("/api/teams", { skipHealthGate: true }),
      api(state.authenticated ? "/api/games?admin=1" : "/api/games", {
        skipHealthGate: true,
      }),
      api("/api/settings/leaderboard", { skipHealthGate: true }),
    ]);

    state.leaderboard = Array.isArray(leaderboardPayload)
      ? leaderboardPayload
      : leaderboardPayload.teams || [];
    state.winnerMode =
      leaderboardPayload.winnerMode || settings.winnerMode || state.winnerMode;
    state.teams = teams;
    state.games = games;

    syncLeaderboardControls();
    renderLeaderboard();
    renderGames();

    if (state.authenticated) {
      state.corrections = await api("/api/corrections", { skipHealthGate: true });
      renderSettingsForm();
      renderAdminTeams();
      renderAdminGames();
      renderAdminCorrections();
      renderColorPresets();
    }
  }

  async function refreshAuth() {
    const status = await api("/api/admin/status", { skipHealthGate: true });
    setAuthUi(Boolean(status.authenticated));
  }

  async function bootstrap() {
    const dateInput = $("#leaderboard-date");
    if (dateInput) {
      dateInput.value = state.leaderboardDate;
    }
    const correctDate = $("#correct-date-input");
    if (correctDate) {
      correctDate.value = todayLocal();
    }
    renderColorPresets();
    setupAdminNav();
    bindActivityWakeups();
    restoreAllDrafts();
    await checkHealth({ force: true });
    await refreshAuth();
    await refreshPublicData();
  }

  /* ---------- Events ---------- */

  $("#connection-login-btn").addEventListener("click", () => {
    document.getElementById("admin")?.scrollIntoView({ behavior: "smooth" });
    $("#admin-pin")?.focus();
  });

  document.querySelectorAll("form[data-draft]").forEach((form) => {
    form.addEventListener("input", () => saveFormDraft(form));
    form.addEventListener("change", () => saveFormDraft(form));
  });

  $("#refresh-btn").addEventListener("click", async () => {
    try {
      await checkHealth({ force: true, toast: true });
      await refreshPublicData();
      showToast("Daten aktualisiert.", "success");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      state.leaderboardMode = btn.dataset.mode;
      syncLeaderboardControls();
      try {
        await refreshPublicData();
      } catch (error) {
        showToast(error.message, "error");
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
      showToast(error.message, "error");
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
    saveFormDraft($("#create-team-form"));
  });

  $("#admin-login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const pin = $("#admin-pin").value;
    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ pin }),
        skipHealthGate: false,
      });
      $("#admin-pin").value = "";
      clearFormDraft(event.currentTarget);
      showToast("Erfolgreich angemeldet.", "success");
      setAuthUi(true);
      setConnection("online");
      await refreshPublicData();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  $("#admin-logout").addEventListener("click", async () => {
    try {
      await api("/api/admin/logout", { method: "POST", body: "{}" });
      setAuthUi(false);
      showToast("Abgemeldet.", "info");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  $("#create-team-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!canPersist()) {
      showToast("Backend aktuell nicht erreichbar.", "error");
      return;
    }
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
      clearFormDraft(form);
      renderColorPresets();
      showToast("Team wurde erfolgreich erstellt.", "success");
      await refreshPublicData();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  $("#create-game-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!canPersist()) {
      showToast("Backend aktuell nicht erreichbar.", "error");
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    const maxRaw = String(data.get("max_points") || "").trim();

    try {
      await api("/api/games", {
        method: "POST",
        body: JSON.stringify({
          title: data.get("title"),
          description: data.get("description"),
          scoring_mode: data.get("scoring_mode"),
          status: data.get("status") || "active",
          max_points: maxRaw === "" ? null : Number(maxRaw),
        }),
      });
      form.reset();
      form.querySelector("select[name='scoring_mode']").value = "placement";
      form.querySelector("select[name='status']").value = "active";
      clearFormDraft(form);
      showToast("Spiel erfolgreich angelegt.", "success");
      await refreshPublicData();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  $("#settings-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!canPersist()) {
      showToast("Backend aktuell nicht erreichbar.", "error");
      return;
    }
    const data = new FormData(event.currentTarget);
    try {
      const payload = await api("/api/settings/leaderboard", {
        method: "PUT",
        body: JSON.stringify({ winnerMode: data.get("winnerMode") }),
      });
      state.winnerMode = payload.winnerMode;
      clearFormDraft(event.currentTarget);
      showToast("Einstellungen gespeichert.", "success");
      await refreshPublicData();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  $("#correct-points-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!canPersist()) {
      showToast("Backend aktuell nicht erreichbar.", "error");
      return;
    }
    const form = event.currentTarget;
    const data = new FormData(form);
    const teamId = Number(data.get("team_id"));
    const totalRaw = String(data.get("total_points") || "").trim();
    const deltaRaw = String(data.get("delta") || "").trim();
    const note = String(data.get("note") || "").trim();
    const createdBy = String(data.get("created_by") || "Admin").trim() || "Admin";
    const evaluationDate = data.get("evaluation_date") || todayLocal();

    const body = { note, created_by: createdBy, evaluation_date: evaluationDate };
    if (deltaRaw !== "") {
      body.delta = Number(deltaRaw);
    } else if (totalRaw !== "") {
      body.total_points = Number(totalRaw);
    } else {
      showToast("Bitte Gesamtpunkte oder Differenz angeben.", "error");
      return;
    }

    try {
      await api(`/api/teams/${teamId}/points`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      form.reset();
      form.querySelector("input[name='created_by']").value = "Admin";
      form.querySelector("input[name='evaluation_date']").value = todayLocal();
      clearFormDraft(form);
      showToast("Punkte wurden erfolgreich korrigiert.", "success");
      await refreshPublicData();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  $("#admin-teams").addEventListener("submit", async (event) => {
    const addMemberForm = event.target.closest("form[data-action='add-member']");
    const colorForm = event.target.closest("form[data-action='set-color']");
    if (!addMemberForm && !colorForm) {
      return;
    }
    event.preventDefault();
    try {
      if (addMemberForm) {
        await api(`/api/teams/${addMemberForm.dataset.teamId}/members`, {
          method: "POST",
          body: JSON.stringify({ name: new FormData(addMemberForm).get("name") }),
        });
        showToast("Mitglied hinzugefügt.", "success");
      }
      if (colorForm) {
        const teamId = colorForm.dataset.teamId;
        const color = new FormData(colorForm).get("color");
        const team = state.teams.find((item) => String(item.id) === String(teamId));
        await api(`/api/teams/${teamId}`, {
          method: "PUT",
          body: JSON.stringify({ name: team?.name, color }),
        });
        showToast("Team wurde erfolgreich bearbeitet.", "success");
      }
      await refreshPublicData();
    } catch (error) {
      showToast(error.message, "error");
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
        showToast("Mitglied entfernt.", "success");
      }
      if (action === "delete-team") {
        if (!confirm("Team wirklich löschen? Zugehörige Punkte entfallen.")) {
          return;
        }
        await api(`/api/teams/${button.dataset.teamId}`, { method: "DELETE" });
        showToast("Team wurde erfolgreich gelöscht.", "success");
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
        showToast("Team wurde erfolgreich bearbeitet.", "success");
      }
      await refreshPublicData();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  $("#admin-corrections").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }
    const id = button.dataset.correctionId;
    const item = state.corrections.find((row) => String(row.id) === String(id));
    if (!item) {
      return;
    }
    try {
      if (button.dataset.action === "delete-correction") {
        if (!confirm("Korrektur wirklich löschen?")) {
          return;
        }
        await api(`/api/corrections/${id}`, { method: "DELETE" });
        showToast("Wertung gelöscht.", "success");
      }
      if (button.dataset.action === "edit-correction") {
        const pointsRaw = prompt("Neuer Korrekturwert (Differenz):", String(item.points));
        if (pointsRaw == null) {
          return;
        }
        const noteRaw = prompt("Notiz:", item.note || "");
        if (noteRaw == null) {
          return;
        }
        const dateRaw = prompt(
          "Bewertungsdatum (JJJJ-MM-TT):",
          item.evaluation_date || todayLocal()
        );
        if (dateRaw == null) {
          return;
        }
        const createdBy = prompt("Bearbeiter:", item.created_by || "Admin");
        if (createdBy == null) {
          return;
        }
        await api(`/api/corrections/${id}`, {
          method: "PUT",
          body: JSON.stringify({
            points: Number(pointsRaw),
            note: noteRaw,
            created_by: createdBy,
            evaluation_date: dateRaw,
          }),
        });
        showToast("Punkte wurden erfolgreich korrigiert.", "success");
      }
      await refreshPublicData();
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  $("#admin-games").addEventListener("input", (event) => {
    const nameInput = event.target.closest("input[data-action='jury-name']");
    if (nameInput) {
      ensureJuryDraft(Number(nameInput.dataset.gameId)).jurorName = nameInput.value;
    }
  });

  $("#admin-games").addEventListener("change", (event) => {
    const placementDate = event.target.closest("input[data-action='placement-date']");
    if (placementDate) {
      ensurePlacementDraft(Number(placementDate.dataset.gameId)).evaluationDate =
        placementDate.value || todayLocal();
      return;
    }
    const juryDate = event.target.closest("input[data-action='jury-date']");
    if (juryDate) {
      ensureJuryDraft(Number(juryDate.dataset.gameId)).evaluationDate =
        juryDate.value || todayLocal();
    }
  });

  $("#admin-games").addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    const gameId = Number(button.dataset.gameId);

    try {
      if (action === "rank-up" || action === "rank-down") {
        const kind = button.dataset.kind;
        const index = Number(button.dataset.index);
        const direction = action === "rank-up" ? -1 : 1;
        if (kind === "placement") {
          const draft = ensurePlacementDraft(gameId);
          draft.teamIds = moveInList(draft.teamIds, index, direction);
        } else {
          const draft = ensureJuryDraft(gameId);
          draft.teamIds = moveInList(draft.teamIds, index, direction);
        }
        renderAdminGames();
        return;
      }

      if (action === "save-placement") {
        const draft = ensurePlacementDraft(gameId);
        await api(`/api/games/${gameId}/placement`, {
          method: "PUT",
          body: JSON.stringify({
            team_ids: draft.teamIds,
            evaluation_date: draft.evaluationDate || todayLocal(),
          }),
        });
        showToast("Platzierungswertung gespeichert.", "success");
      }

      if (action === "save-jury") {
        const draft = ensureJuryDraft(gameId);
        if (!String(draft.jurorName || "").trim()) {
          showToast("Bitte Juror angeben.", "error");
          return;
        }
        const payload = await api(`/api/games/${gameId}/jury-rankings`, {
          method: "PUT",
          body: JSON.stringify({
            juror_name: draft.jurorName.trim(),
            team_ids: draft.teamIds,
            evaluation_date: draft.evaluationDate || todayLocal(),
          }),
        });
        showToast(
          payload.updated
            ? "Jurorenbewertung erfolgreich aktualisiert."
            : "Jurorenbewertung erfolgreich gespeichert.",
          "success"
        );
        draft.jurorName = "";
      }

      if (action === "delete-jury") {
        if (
          !confirm(
            "Möchtest du diese Jurorenbewertung wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden."
          )
        ) {
          return;
        }
        try {
          await api(
            `/api/games/${gameId}/jury-rankings/${button.dataset.ballotId}`,
            { method: "DELETE" }
          );
          showToast("Jurorenbewertung erfolgreich gelöscht.", "success");
        } catch (error) {
          showToast("Jurorenbewertung konnte nicht gelöscht werden.", "error");
          throw error;
        }
      }

      if (action === "toggle-game" || action === "set-status") {
        await api(`/api/games/${gameId}`, {
          method: "PUT",
          body: JSON.stringify({ status: button.dataset.status }),
        });
        showToast(
          button.dataset.status === "completed"
            ? "Spiel erfolgreich abgeschlossen."
            : "Spiel bearbeitet.",
          "success"
        );
      }

      if (action === "delete-game") {
        if (!confirm("Spiel wirklich löschen?")) {
          return;
        }
        await api(`/api/games/${gameId}`, { method: "DELETE" });
        delete state.placementDrafts[gameId];
        delete state.juryDrafts[gameId];
        showToast("Spiel gelöscht.", "success");
      }

      await refreshPublicData();
    } catch (error) {
      if (action !== "delete-jury") {
        showToast(error.message, "error");
      }
    }
  });

  bootstrap().catch((error) => {
    console.error(error);
    setConnection("offline", { toast: true });
    $("#leaderboard-list").innerHTML = `<div class="empty-state">Daten konnten nicht geladen werden: ${escapeHtml(error.message)}</div>`;
  });
})();
