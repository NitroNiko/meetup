const STORAGE_KEY = "immunoQuizProgress";
const QUESTION_STORAGE_KEY = "immunoQuizQuestionBank";
const ADMIN_CODE = "1234";
const TOPIC_LABELS = {
  antikoerper: "Antikörper",
  bakterien: "Bakterien",
  infektionswege: "Infektionswege",
  krankheitsverlauf: "Krankheitsverlauf",
};
const TOPIC_ICONS = {
  antikoerper: "🛡️",
  bakterien: "🧫",
  infektionswege: "💧",
  krankheitsverlauf: "🌡️",
};
const TYPE_LABELS = {
  yesno: "Ja/Nein-Frage",
  input: "Eingabe-Frage",
  choice: "Multiple-Choice-Frage",
};

const rawQuestions = [
  ["leicht", "Können Viren nur in lebenden Zellen überleben?", "ja"],
  ["leicht", "Sind Bakterien größer als Viren?", "ja"],
  ["leicht", "Wie nennt man die Abwehrzellen, die Erreger fressen?", "fresszellen"],
  ["leicht", "Kann man sich durch ungewaschene Hände anstecken?", "ja"],
  ["leicht", "Wie nennt man die Krankheit durch Influenzaviren?", "grippe"],
  ["leicht", "Ist Fieber eine normale Abwehrreaktion?", "ja"],
  ["leicht", "Wie nennt man Erreger, die Krankheiten verursachen?", "krankheitserreger"],
  ["leicht", "Können Bakterien nützlich sein?", "ja"],
  ["leicht", "Wie nennt man die Übertragung durch Niesen?", "tröpfcheninfektion"],
  ["leicht", "Kann man sich durch Küssen anstecken?", "ja"],
  ["leicht", "Wie heißt die erste Schutzschicht des Körpers?", "haut"],
  ["leicht", "Können Viren Grippe auslösen?", "ja"],
  ["leicht", "Wie nennt man die Zeit zwischen Ansteckung und Symptomen?", "inkubationszeit"],
  ["leicht", "Kann man sich durch verunreinigtes Wasser anstecken?", "ja"],
  ["leicht", "Wie heißen die Abwehrstoffe der B-Zellen?", "antikörper"],
  ["leicht", "Wirken Antibiotika gegen Viren?", "nein"],
  ["leicht", "Wie heißen die Zellen, die Antikörper speichern?", "gedächtniszellen"],
  ["leicht", "Kann man sich durch Trinkflaschen anstecken?", "ja"],
  ["leicht", "Wie nennt man eine Überreaktion des Immunsystems?", "allergie"],
  ["leicht", "Können Viren mutieren?", "ja"],
  ["leicht", "Wie nennt man Infektionen durch Lebensmittel?", "lebensmittelinfektion"],
  ["leicht", "Kann man sich durch Blutkontakt anstecken?", "ja"],
  ["leicht", "Wie heißen die Zellen, die infizierte Zellen zerstören?", "t-killerzellen"],
  ["leicht", "Können Bakterien sich teilen?", "ja"],
  ["leicht", "Wie heißen die Erkennungsmerkmale auf Erregern?", "antigene"],
  ["leicht", "Kann man sich durch Haustiere anstecken?", "ja"],
  ["leicht", "Wie nennt man die Reaktion, die Fieber auslöst?", "pyrogenreaktion"],
  ["leicht", "Können Viren in Zellen „schlafen“?", "ja"],
  ["leicht", "Wie nennt man die Immunreaktion nach einer Impfung?", "aktive immunisierung"],
  ["leicht", "Kann Stress das Immunsystem schwächen?", "ja"],
  ["mittel", "Können Bakterien eine Zellwand besitzen?", "ja"],
  ["mittel", "Wie heißen die Zellen, die Antikörper herstellen?", "b-zellen"],
  ["mittel", "Können Viren DNA oder RNA enthalten?", "ja"],
  ["mittel", "Wie heißt die gezielte Immunabwehr?", "spezifische immunabwehr"],
  ["mittel", "Können Bakterien Resistenzen entwickeln?", "ja"],
  ["mittel", "Wie heißen die Proteine auf Erregern?", "antigene"],
  ["mittel", "Können Viren sich ohne Wirtszelle vermehren?", "nein"],
  ["mittel", "Wie heißen die Zellen, die infizierte Zellen zerstören?", "t-killerzellen"],
  ["mittel", "Kann man sich durch Lebensmittel anstecken?", "ja"],
  ["mittel", "Wie heißt die Zeit vor Symptomen?", "inkubationszeit"],
  ["mittel", "Können Viren mutieren?", "ja"],
  ["mittel", "Wie heißen Zellen, die Antigene präsentieren?", "dendritische zellen"],
  ["mittel", "Kann man sich durch Blutkontakt anstecken?", "ja"],
  ["mittel", "Wie heißen Immunzellen, die Antikörper speichern?", "gedächtniszellen"],
  ["mittel", "Können Bakterien sich teilen?", "ja"],
  ["mittel", "Wie heißt die Übertragung durch Tiere?", "vektorinfektion"],
  ["mittel", "Können Viren nur bestimmte Zellen infizieren?", "ja"],
  ["mittel", "Wie heißt eine Überreaktion des Immunsystems?", "allergie"],
  ["mittel", "Können Bakterien nützlich sein?", "ja"],
  ["mittel", "Wie heißen Zellen, die Erreger markieren?", "plasmazellen"],
  ["mittel", "Kann man sich durch Trinkflaschen anstecken?", "ja"],
  ["mittel", "Wie heißt die Fieberreaktion?", "pyrogenreaktion"],
  ["mittel", "Können Viren latent bleiben?", "ja"],
  ["mittel", "Wie heißt die Immunreaktion nach Impfung?", "aktive immunisierung"],
  ["mittel", "Können Bakterien Sporen bilden?", "ja"],
  ["mittel", "Wie heißt die schnelle Immunabwehr?", "unspezifische immunabwehr"],
  ["mittel", "Können Viren ihre Oberfläche verändern?", "ja"],
  ["mittel", "Wie heißt die Phase stärkster Symptome?", "krankheitsphase"],
  ["mittel", "Kann Stress das Immunsystem schwächen?", "ja"],
  ["mittel", "Wie heißen Zellen, die Antigene präsentieren?", "antigenpräsentierende zellen"],
  ["mittel", "Können Viren über Luft übertragen werden?", "ja"],
  ["mittel", "Wie heißt die Reaktion des Immunsystems?", "immunantwort"],
  ["mittel", "Können Bakterien Giftstoffe bilden?", "ja"],
  ["mittel", "Wie heißt die Krankheit durch HIV?", "aids"],
  ["mittel", "Können Viren in der Luft überleben?", "ja"],
  ["mittel", "Wie heißen Zellen, die T-Killer aktivieren?", "t-helferzellen"],
  ["mittel", "Können Bakterien durch Hitze sterben?", "ja"],
  ["mittel", "Wie heißt die Übertragung durch Wasser?", "wasserinfektion"],
  ["mittel", "Können Viren Tiere und Menschen infizieren?", "ja"],
  ["mittel", "Wie heißt der Angriff auf eigene Zellen?", "autoimmunreaktion"],
  ["schwer", "Wie heißen Zellen, die Antigene präsentieren?", "antigenpräsentierende zellen"],
  ["schwer", "Können Viren ihre Oberfläche verändern?", "ja"],
  ["schwer", "Wie heißt der Angriff auf eigene Zellen?", "autoimmunreaktion"],
  ["schwer", "Können Bakterien Sporen bilden?", "ja"],
  ["schwer", "Wie heißen Warnproteine infizierter Zellen?", "interferone"],
  ["schwer", "Können Viren jahrelang inaktiv bleiben?", "ja"],
  ["schwer", "Wie heißt die Immunreaktion durch Impfung?", "aktive immunisierung"],
  ["schwer", "Können T-Helferzellen B-Zellen aktivieren?", "ja"],
  ["schwer", "Wie heißt die Immunreaktion, die sofort startet?", "unspezifische immunabwehr"],
  ["schwer", "Können Viren RNA als Erbmaterial haben?", "ja"],
  ["schwer", "Wie heißt die gezielte Abwehr?", "spezifische immunabwehr"],
  ["schwer", "Können Bakterien horizontal Gene übertragen?", "ja"],
  ["schwer", "Wie heißt die Phase nach der Krankheitsphase?", "genesungsphase"],
  ["schwer", "Können Viren Wirtszellen zerstören?", "ja"],
  ["schwer", "Wie heißen die Zellen, die Antikörper produzieren?", "plasmazellen"],
  ["schwer", "Können Viren DNA in Wirtszellen einbauen?", "ja"],
  ["schwer", "Wie heißt die Reaktion, wenn Fresszellen Erreger aufnehmen?", "phagozytose"],
  ["schwer", "Können Bakterien Biofilme bilden?", "ja"],
  ["schwer", "Wie heißen Immunzellen, die Virenreste präsentieren?", "dendritische zellen"],
  ["schwer", "Können Viren mehrere Arten infizieren?", "ja"],
  ["schwer", "Wie heißt die Reaktion, wenn Antikörper Antigene verklumpen?", "agglutination"],
  ["schwer", "Können Bakterien Toxine abgeben?", "ja"],
  ["schwer", "Wie heißt die Phase, in der Erregerzahl sinkt?", "abklingphase"],
  ["schwer", "Können Viren Immunzellen infizieren?", "ja"],
  ["schwer", "Wie heißt die Reaktion, wenn Antikörper Viren blockieren?", "neutralisation"],
  ["schwer", "Können Bakterien Plasmide austauschen?", "ja"],
  ["schwer", "Wie heißt die Immunreaktion, die Gedächtniszellen bildet?", "sekundäre immunantwort"],
  ["schwer", "Können Viren Enzyme nutzen, um Zellen zu öffnen?", "ja"],
  ["schwer", "Wie heißt die Reaktion, wenn Makrophagen Erreger präsentieren?", "antigenpräsentation"],
  ["schwer", "Können Viren Wirtszellen umprogrammieren?", "ja"],
];

let questionBank = loadQuestionBank();
let questions = buildQuestionSet();
let progress = loadProgress();
let round = null;
let timerId = null;
let audioContext = null;

const $ = (selector) => document.querySelector(selector);

function loadProgress() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      history: Array.isArray(stored?.history) ? stored.history.slice(-12) : [],
      bestScore: Number(stored?.bestScore || 0),
      bestTime: Number(stored?.bestTime || 0),
      bestStreak: Number(stored?.bestStreak || 0),
    };
  } catch {
    return { history: [], bestScore: 0, bestTime: 0, bestStreak: 0 };
  }
}

function loadQuestionBank() {
  try {
    const stored = JSON.parse(localStorage.getItem(QUESTION_STORAGE_KEY));
    return {
      edits: stored?.edits && typeof stored.edits === "object" ? stored.edits : {},
      custom: Array.isArray(stored?.custom) ? stored.custom : [],
    };
  } catch {
    return { edits: {}, custom: [] };
  }
}

function saveQuestionBank() {
  localStorage.setItem(QUESTION_STORAGE_KEY, JSON.stringify(questionBank));
}

function buildQuestionSet() {
  const base = rawQuestions.map(([difficulty, prompt, answer], index) => {
    const id = "q-" + index;
    return createQuestion({ difficulty, prompt, answer, ...questionBank.edits[id] }, id, "Basisfrage");
  });
  const custom = questionBank.custom.map((question) => createQuestion(question, question.id, "Eigene Frage"));
  return [...base, ...custom];
}

function createQuestion(question, id, source) {
  const topic = question.topic || inferTopic(question.prompt, question.answer);
  return {
    id,
    source,
    difficulty: question.difficulty,
    prompt: question.prompt,
    answer: question.answer,
    topic,
    baseType: normalize(question.answer) === "ja" || normalize(question.answer) === "nein" ? "yesno" : "input",
    explanation: buildExplanation(question.prompt, question.answer, topic),
  };
}

function refreshQuestionSet() {
  questions = buildQuestionSet();
  renderAdminQuestions();
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function inferTopic(prompt, answer) {
  const text = normalize(prompt + " " + answer);
  if (/bakter|antibiotika|zellwand|resistenz|sporen|giftstoffe|toxine|biofilme|plasmide|horizontal|hitze/.test(text)) return "bakterien";
  if (/ansteck|ubertragung|niesen|kussen|wasser|lebensmittel|blutkontakt|trinkflaschen|haustiere|luft|vektor|tiere/.test(text)) return "infektionswege";
  if (/fieber|grippe|aids|inkubationszeit|symptom|krankheit|phase|genesung|abkling|latent|inaktiv|stress|pyrogen|oberflache|mutieren|wirtszelle|dna|rna/.test(text)) return "krankheitsverlauf";
  return "antikoerper";
}

function buildExplanation(prompt, answer, topic) {
  const topicText = {
    antikoerper: "Die Immunabwehr erkennt Erreger an typischen Merkmalen und reagiert mit spezialisierten Zellen oder Antikörpern.",
    bakterien: "Bakterien sind eigenständige Zellen; sie können sich teilen, Strukturen bilden und je nach Art nützlich oder schädlich sein.",
    infektionswege: "Infektionen entstehen, wenn Erreger über Kontakt, Luft, Wasser, Lebensmittel, Tiere oder Körperflüssigkeiten weitergegeben werden.",
    krankheitsverlauf: "Beim Krankheitsverlauf vermehren sich Erreger, der Körper reagiert und Symptome klingen nach erfolgreicher Abwehr wieder ab.",
  }[topic];

  if (answer === "ja") return "Ja. " + topicText;
  if (answer === "nein") return "Nein. " + topicText;
  return "Der gesuchte Begriff ist \"" + answer + "\". " + topicText;
}

function normalize(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[„“"'.]/g, "")
    .replace(/[‑–—-]/g, "-")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ");
}

function formValue(name) {
  return new FormData($("#setup-form")).get(name);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach((screen) => screen.classList.toggle("active", screen.id === id));
}

function shuffle(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const next = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[next]] = [copy[next], copy[index]];
  }
  return copy;
}

function samplePool(pool, count) {
  const shuffled = shuffle(pool);
  if (shuffled.length >= count) return shuffled.slice(0, count);
  const repeated = [];
  while (repeated.length < count) repeated.push(...shuffle(pool));
  return repeated.slice(0, count);
}

function startRound(event) {
  event.preventDefault();
  const settings = {
    questionCount: Number(formValue("questionCount")),
    difficulty: formValue("difficulty"),
    questionType: formValue("questionType"),
    topic: formValue("topic"),
    timer: Number(formValue("timer")),
  };
  const pool = getQuestionPool(settings);
  if (!pool.length) {
    notify("Keine passenden Fragen", "Wähle gemischte Themen oder einen anderen Fragetyp.");
    return;
  }

  const selected = samplePool(pool, settings.questionCount).map((question) => ({
    ...question,
    playType: pickPlayType(question, settings.questionType),
  }));
  const superIndex = Math.floor(Math.random() * selected.length);
  selected[superIndex].isSuper = true;

  round = {
    settings,
    questions: selected,
    index: 0,
    score: 0,
    bonusPoints: 0,
    streak: 0,
    bestStreak: 0,
    correct: 0,
    wrong: 0,
    startedAt: Date.now(),
    questionStartedAt: Date.now(),
    answerTimes: [],
    topicStats: createTopicStats(),
    answered: false,
  };

  showScreen("quiz-screen");
  renderQuestion();
}

function getQuestionPool(settings) {
  return questions.filter((question) => {
    const difficultyOk = settings.difficulty === "gemischt" || question.difficulty === settings.difficulty;
    const topicOk = settings.topic === "gemischt" || question.topic === settings.topic;
    const typeOk =
      settings.questionType === "mixed" ||
      settings.questionType === "choice" ||
      (settings.questionType === "yesno" && question.baseType === "yesno") ||
      (settings.questionType === "input" && question.baseType === "input");
    return difficultyOk && topicOk && typeOk;
  });
}

function pickPlayType(question, selectedType) {
  if (selectedType === "choice") return "choice";
  if (selectedType === "mixed") {
    const options = question.baseType === "yesno" ? ["yesno", "choice"] : ["input", "choice"];
    return options[Math.floor(Math.random() * options.length)];
  }
  return selectedType;
}

function createTopicStats() {
  return Object.keys(TOPIC_LABELS).reduce((stats, topic) => {
    stats[topic] = { total: 0, correct: 0 };
    return stats;
  }, {});
}

function renderQuestion() {
  clearInterval(timerId);
  round.answered = false;
  round.questionStartedAt = Date.now();

  const question = round.questions[round.index];
  $("#feedback-card").className = "feedback-card hidden";
  $("#explanation-box").classList.add("hidden");
  $("#question-counter").textContent = `${round.index + 1} / ${round.questions.length}`;
  $("#score-pill").textContent = `${round.score} Punkte`;
  $("#timer-pill").textContent = round.settings.timer ? `${round.settings.timer}s` : "Ohne Timer";
  $("#timer-pill").classList.remove("warning");
  $("#timer-bar").style.width = "100%";
  $("#topic-chip").textContent = `${TOPIC_ICONS[question.topic]} ${TOPIC_LABELS[question.topic]}`;
  $("#difficulty-chip").textContent = question.difficulty;
  $("#super-chip").classList.toggle("hidden", !question.isSuper);
  $("#question-type-label").textContent = TYPE_LABELS[question.playType];
  $("#quiz-title").textContent = question.prompt;
  renderAnswerForm(question);

  if (round.settings.timer) startTimer(round.settings.timer);
}

function renderAnswerForm(question) {
  if (question.playType === "yesno") {
    $("#answer-form").innerHTML = `
      <div class="yes-no-grid">
        <button class="choice-button" type="button" data-answer="ja">Ja</button>
        <button class="choice-button" type="button" data-answer="nein">Nein</button>
      </div>
    `;
    return;
  }

  if (question.playType === "choice") {
    $("#answer-form").innerHTML = `
      <div class="choice-grid">
        ${buildChoices(question)
          .map((choice) => `<button class="choice-button" type="button" data-answer="${escapeAttribute(choice)}">${choice}</button>`)
          .join("")}
      </div>
    `;
    return;
  }

  $("#answer-form").innerHTML = `
    <input class="text-answer" id="text-answer" autocomplete="off" placeholder="Antwort eingeben..." />
    <button class="primary-button" type="submit">Antwort prüfen</button>
  `;
  $("#text-answer").focus();
}

function buildChoices(question) {
  if (question.answer === "ja" || question.answer === "nein") return shuffle(["ja", "nein"]);
  const answers = [...new Set(questions.filter((item) => item.baseType === "input").map((item) => item.answer))].filter((answer) => answer !== question.answer);
  const sameTopic = answers.filter((answer) => questions.some((item) => item.answer === answer && item.topic === question.topic));
  const distractors = shuffle([...sameTopic, ...answers]).slice(0, 3);
  return shuffle([question.answer, ...distractors]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/"/g, "&quot;");
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function startTimer(seconds) {
  const end = Date.now() + seconds * 1000;
  timerId = setInterval(() => {
    const remaining = Math.max(0, end - Date.now());
    const percent = (remaining / (seconds * 1000)) * 100;
    $("#timer-bar").style.width = percent + "%";
    $("#timer-pill").textContent = Math.ceil(remaining / 1000) + "s";
    $("#timer-pill").classList.toggle("warning", remaining <= 5000);
    if (remaining <= 0) submitAnswer("", true);
  }, 100);
}

function submitAnswer(value, timedOut = false) {
  if (!round || round.answered) return;
  round.answered = true;
  clearInterval(timerId);

  const question = round.questions[round.index];
  const answerTime = (Date.now() - round.questionStartedAt) / 1000;
  const isCorrect = !timedOut && normalize(value) === normalize(question.answer);
  const basePoints = question.isSuper ? 20 : 10;
  const penalty = question.isSuper ? -10 : -5;
  let points = isCorrect ? basePoints : penalty;
  let bonus = 0;

  if (isCorrect) {
    round.streak += 1;
    bonus = streakBonus(round.streak);
    points += bonus;
    round.correct += 1;
    playSound(round.streak >= 5 ? "flame" : "correct");
  } else {
    round.streak = 0;
    round.wrong += 1;
    playSound("wrong");
  }

  round.score += points;
  round.bonusPoints += bonus;
  round.bestStreak = Math.max(round.bestStreak, round.streak);
  round.answerTimes.push(answerTime);
  round.topicStats[question.topic].total += 1;
  if (isCorrect) round.topicStats[question.topic].correct += 1;

  renderFeedback({ question, isCorrect, points, bonus, timedOut });
}

function streakBonus(streak) {
  if (streak >= 5) return 10;
  if (streak >= 4) return 6;
  if (streak >= 3) return 4;
  if (streak >= 2) return 2;
  return 0;
}

function renderFeedback(result) {
  const { question, isCorrect, points, bonus, timedOut } = result;
  const card = $("#feedback-card");
  card.className = "feedback-card " + (isCorrect ? "correct" : "wrong");
  $("#feedback-label").textContent = timedOut ? "Zeit abgelaufen" : "Feedback";
  $("#feedback-title").textContent = isCorrect ? streakTitle(bonus) : "Noch nicht richtig";
  $("#feedback-points").textContent = `${points > 0 ? "+" : ""}${points}`;
  $("#correct-answer").textContent = isCorrect ? "Sehr gut beantwortet." : `Richtige Antwort: ${question.answer}`;
  $("#explanation-icon").textContent = TOPIC_ICONS[question.topic];
  $("#explanation-text").textContent = question.explanation;
  $("#score-pill").textContent = `${round.score} Punkte`;
}

function streakTitle(bonus) {
  if (round.streak >= 5) return `🔥 ${round.streak}er-Streak! Flammenbonus +${bonus}`;
  if (bonus > 0) return `${round.streak}er-Streak! Bonus +${bonus}`;
  return "Richtig";
}

function nextQuestion() {
  if (round.index < round.questions.length - 1) {
    round.index += 1;
    renderQuestion();
    return;
  }
  finishRound();
}

function finishRound() {
  clearInterval(timerId);
  const averageTime = average(round.answerTimes);
  const summary = {
    date: new Date().toISOString(),
    score: round.score,
    correct: round.correct,
    wrong: round.wrong,
    bestStreak: round.bestStreak,
    averageTime,
    totalTime: (Date.now() - round.startedAt) / 1000,
    bonusPoints: round.bonusPoints,
    topicStats: round.topicStats,
  };

  const wasBestScore = summary.score > progress.bestScore;
  const wasBestTime = !progress.bestTime || summary.averageTime < progress.bestTime;
  const wasBestStreak = summary.bestStreak > progress.bestStreak;
  progress.bestScore = Math.max(progress.bestScore, summary.score);
  progress.bestTime = progress.bestTime ? Math.min(progress.bestTime, summary.averageTime) : summary.averageTime;
  progress.bestStreak = Math.max(progress.bestStreak, summary.bestStreak);
  progress.history.push(summary);
  progress.history = progress.history.slice(-12);
  saveProgress();

  renderResults(summary, { wasBestScore, wasBestTime, wasBestStreak });
  renderProgress();
  showScreen("results-screen");
}

function average(values) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function renderResults(summary, bestFlags) {
  $("#final-score").textContent = `${summary.score} Punkte`;
  const bests = [
    bestFlags.wasBestScore && "beste Punktzahl",
    bestFlags.wasBestTime && "beste Durchschnittszeit",
    bestFlags.wasBestStreak && "beste Streak",
  ].filter(Boolean);
  $("#best-message").textContent = bests.length ? "Neue Bestleistung: " + bests.join(", ") + "." : "Trainiere weiter gegen deine gespeicherten Bestwerte.";
  $("#stats-grid").innerHTML = [
    ["Richtig", summary.correct],
    ["Falsch", summary.wrong],
    ["Höchste Streak", summary.bestStreak],
    ["Ø Antwortzeit", formatSeconds(summary.averageTime)],
    ["Gesamtpunkte", summary.score],
    ["Bonuspunkte", summary.bonusPoints],
    ["Gesamtzeit", formatSeconds(summary.totalTime)],
    ["Runden gespeichert", progress.history.length],
  ]
    .map(([label, value]) => `<article class="stat-card"><span class="muted">${label}</span><strong>${value}</strong></article>`)
    .join("");
  $("#topic-report").innerHTML = renderTopicRows(summary.topicStats);
  renderWave($("#results-wave"));
}

function renderTopicRows(stats) {
  return Object.entries(TOPIC_LABELS)
    .map(([topic, label]) => {
      const item = stats[topic] || { total: 0, correct: 0 };
      const percent = item.total ? Math.round((item.correct / item.total) * 100) : 0;
      return `
        <article class="topic-row">
          <div>
            <strong>${TOPIC_ICONS[topic]} ${label}</strong>
            <span class="muted">${item.correct} von ${item.total} richtig</span>
          </div>
          <div class="bar"><span style="width:${percent}%"></span></div>
          <strong>${percent}%</strong>
        </article>
      `;
    })
    .join("");
}

function renderProgress() {
  $("#best-grid").innerHTML = [
    ["Beste Punktzahl", progress.bestScore || "—"],
    ["Beste Zeit", progress.bestTime ? formatSeconds(progress.bestTime) : "—"],
    ["Beste Streak", progress.bestStreak || "—"],
    ["Runden", progress.history.length],
  ]
    .map(([label, value]) => `<article class="best-card"><span class="muted">${label}</span><strong>${value}</strong></article>`)
    .join("");
  renderWave($("#history-wave"));
}

function renderAdminQuestions() {
  const list = $("#admin-question-list");
  if (!list) return;
  $("#question-count-label").textContent = `${questions.length} Fragen`;
  list.innerHTML = questions
    .map(
      (question) => `
        <article class="admin-question" data-question-id="${question.id}">
          <div class="admin-question-actions">
            <span class="source-chip">${question.source}</span>
            <button class="quiet-button" type="button" data-action="save-question" data-id="${question.id}">Speichern</button>
          </div>
          <label>
            Frage
            <textarea data-field="prompt">${escapeHtml(question.prompt)}</textarea>
          </label>
          <label>
            Antwort
            <input data-field="answer" value="${escapeAttribute(question.answer)}" />
          </label>
          <div class="admin-question-meta">
            <label>
              Schwierigkeit
              <select data-field="difficulty">${difficultyOptions(question.difficulty)}</select>
            </label>
            <label>
              Thema
              <select data-field="topic">${topicOptions(question.topic)}</select>
            </label>
            <label>
              Fragetyp
              <input value="${TYPE_LABELS[question.baseType]}" disabled />
            </label>
          </div>
        </article>
      `,
    )
    .join("");
}

function difficultyOptions(active) {
  return ["leicht", "mittel", "schwer"].map((value) => `<option value="${value}" ${value === active ? "selected" : ""}>${value}</option>`).join("");
}

function topicOptions(active) {
  return Object.entries(TOPIC_LABELS)
    .map(([value, label]) => `<option value="${value}" ${value === active ? "selected" : ""}>${label}</option>`)
    .join("");
}

function unlockAdmin(event) {
  event.preventDefault();
  if ($("#admin-code").value !== ADMIN_CODE) {
    notify("Code nicht korrekt", "Bitte prüfe den vierstelligen Code.");
    return;
  }
  $("#admin-panel").classList.remove("hidden");
  $("#admin-code").value = "";
  renderAdminQuestions();
  notify("Redaktion geöffnet", "Du kannst Fragen jetzt bearbeiten oder neu schreiben.");
}

function saveAdminQuestion(questionId) {
  const card = document.querySelector(`[data-question-id="${questionId}"]`);
  if (!card) return;
  const updated = {
    prompt: card.querySelector('[data-field="prompt"]').value.trim(),
    answer: card.querySelector('[data-field="answer"]').value.trim().toLowerCase(),
    difficulty: card.querySelector('[data-field="difficulty"]').value,
    topic: card.querySelector('[data-field="topic"]').value,
  };
  if (!updated.prompt || !updated.answer) {
    notify("Frage unvollständig", "Frage und Antwort müssen ausgefüllt sein.");
    return;
  }
  if (questionId.startsWith("q-")) {
    questionBank.edits[questionId] = updated;
  } else {
    questionBank.custom = questionBank.custom.map((question) => (question.id === questionId ? { ...question, ...updated } : question));
  }
  saveQuestionBank();
  refreshQuestionSet();
  notify("Frage gespeichert", "Die Änderung ist lokal in der App verfügbar.");
}

function addAdminQuestion(event) {
  event.preventDefault();
  const data = new FormData(event.target);
  const question = {
    id: "custom-" + Date.now(),
    prompt: String(data.get("prompt")).trim(),
    answer: String(data.get("answer")).trim().toLowerCase(),
    difficulty: data.get("difficulty"),
    topic: data.get("topic"),
  };
  if (!question.prompt || !question.answer) {
    notify("Frage unvollständig", "Frage und Antwort müssen ausgefüllt sein.");
    return;
  }
  questionBank.custom.unshift(question);
  saveQuestionBank();
  refreshQuestionSet();
  event.target.reset();
  notify("Neue Frage gespeichert", "Sie erscheint sofort im Fragenpool.");
}

function renderWave(svg) {
  const scores = progress.history.map((item) => item.score);
  if (!scores.length) {
    svg.innerHTML = `<text x="210" y="64" text-anchor="middle" fill="#60706b" font-size="15">Noch keine gespeicherten Runden</text>`;
    return;
  }
  const max = Math.max(...scores, 10);
  const points = scores.map((score, index) => {
    const x = scores.length === 1 ? 210 : 24 + (index * 372) / (scores.length - 1);
    const y = 98 - (score / max) * 74;
    return [x, y];
  });
  const path = points.map(([x, y], index) => `${index ? "L" : "M"} ${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const area = `${path} L ${points.at(-1)[0].toFixed(1)} 105 L ${points[0][0].toFixed(1)} 105 Z`;
  svg.innerHTML = `
    <path d="${area}" fill="rgba(37, 111, 104, 0.12)"></path>
    <path d="${path}" fill="none" stroke="#256f68" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"></path>
    ${points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#6d91ff"></circle>`).join("")}
  `;
}

function formatSeconds(value) {
  return `${value.toFixed(1).replace(".", ",")}s`;
}

function playSound(type) {
  try {
    audioContext = audioContext || new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const settings = {
      correct: [720, 0.055],
      wrong: [180, 0.08],
      flame: [980, 0.13],
    }[type];
    oscillator.frequency.value = settings[0];
    oscillator.type = type === "flame" ? "sawtooth" : "sine";
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.05, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + settings[1]);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + settings[1] + 0.03);
  } catch {
    // Browsers can block audio until the first interaction; the quiz remains fully usable.
  }
}

function notify(title, message) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
  $("#toast-stack").appendChild(toast);
  setTimeout(() => toast.remove(), 3600);
}

function resetProgress() {
  progress = { history: [], bestScore: 0, bestTime: 0, bestStreak: 0 };
  saveProgress();
  renderProgress();
  notify("Fortschritt gelöscht", "Die lokalen Bestleistungen wurden zurückgesetzt.");
}

$("#setup-form").addEventListener("submit", startRound);
$("#answer-form").addEventListener("click", (event) => {
  const button = event.target.closest("[data-answer]");
  if (!button) return;
  document.querySelectorAll(".choice-button").forEach((item) => item.classList.remove("selected"));
  button.classList.add("selected");
  submitAnswer(button.dataset.answer);
});
$("#answer-form").addEventListener("submit", (event) => {
  event.preventDefault();
  submitAnswer($("#text-answer").value);
});
$("#why-button").addEventListener("click", () => $("#explanation-box").classList.toggle("hidden"));
$("#next-question").addEventListener("click", nextQuestion);
$("#admin-code-form").addEventListener("submit", unlockAdmin);
$("#new-question-form").addEventListener("submit", addAdminQuestion);
$("#admin-question-list").addEventListener("click", (event) => {
  const button = event.target.closest('[data-action="save-question"]');
  if (!button) return;
  saveAdminQuestion(button.dataset.id);
});
$("#lock-admin").addEventListener("click", () => $("#admin-panel").classList.add("hidden"));
$("#quit-round").addEventListener("click", () => {
  clearInterval(timerId);
  round = null;
  showScreen("setup-screen");
});
$("#play-again").addEventListener("click", (event) => startRound(event));
$("#back-to-setup").addEventListener("click", () => showScreen("setup-screen"));
$("#reset-progress").addEventListener("click", resetProgress);

renderProgress();

window.__quizDebug = { questions, getQuestionPool, normalize };
