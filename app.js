const STORAGE_KEY = "immunoQuizProgress";
const QUESTION_STORAGE_KEY = "immunoQuizQuestionBankV2";
const COLOR_THEME_STORAGE_KEY = "immunoQuizColorTheme";
const AD_NEXT_STORAGE_KEY = "immunoQuizNextAdAt";
const AD_FREE_UNTIL_STORAGE_KEY = "immunoQuizAdFreeUntil";
const ADMIN_CODE = "1234";
const AD_FREE_CODE = "6767";
const AD_INTERVAL_MS = 10 * 60 * 1000;
const AD_DURATION_MS = 10 * 1000;
const AD_FREE_MS = 30 * 60 * 1000;
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
const DIFFICULTIES = ["leicht", "mittel", "schwer"];
const COLOR_THEMES = [
  { id: "wald", name: "Waldgrün", accent: "#256f68", accent2: "#6d91ff", heroEnd: "#234d74" },
  { id: "meer", name: "Meerblau", accent: "#1d6fa5", accent2: "#5fd4c8", heroEnd: "#16466d" },
  { id: "lila", name: "Lila", accent: "#8b5cf6", accent2: "#ec4899", heroEnd: "#6d28d9" },
  { id: "rosa", name: "Rosa", accent: "#ff7ab6", accent2: "#ffd1e5", heroEnd: "#ff9fcb" },
  { id: "pink", name: "Pink", accent: "#c0447a", accent2: "#ffad66", heroEnd: "#78305d" },
  { id: "orange", name: "Orange", accent: "#c76a1d", accent2: "#f3c969", heroEnd: "#7a431b" },
  { id: "anthrazit", name: "Anthrazit", accent: "#334155", accent2: "#38bdf8", heroEnd: "#111827" },
];

const questionRows = (difficulty, answer, prompts) => prompts.map((prompt) => [difficulty, prompt, answer]);
const inputQuestionRows = (difficulty, entries) => entries.map(([prompt, answer]) => [difficulty, prompt, answer]);

const rawQuestions = [
  ...questionRows("leicht", "nein", [
    "Können Viren sich ohne Wirtszelle vermehren?",
    "Können Antibiotika Viren bekämpfen?",
    "Können Bakterien ohne Nahrung über Jahre aktiv bleiben?",
    "Kann man eine Virusinfektion durch Händewaschen komplett verhindern?",
    "Können Antikörper Viren herstellen?",
    "Können Viren selbst Energie erzeugen?",
    "Können Bakterien immer Krankheiten auslösen?",
    "Kann man sich durch Gedanken anstecken?",
    "Können Antikörper ohne Erreger entstehen?",
    "Können Viren ohne Zellen mutieren?",
    "Können Bakterien ohne Wasser leben?",
    "Kann man eine Infektion immer sofort bemerken?",
    "Können Viren durch Licht sichtbar werden?",
    "Können Antikörper Bakterien teilen?",
    "Können Bakterien Viren herstellen?",
  ]),
  ...questionRows("mittel", "nein", [
    "Können T-Killerzellen Antikörper bilden?",
    "Können Viren gleichzeitig DNA und RNA besitzen?",
    "Kann die unspezifische Immunabwehr Gedächtniszellen bilden?",
    "Können B-Zellen Viren direkt zerstören?",
    "Kann man eine bakterielle Infektion mit Virostatika behandeln?",
    "Können Makrophagen Antikörper produzieren?",
    "Können Viren ohne passende Rezeptoren an Zellen andocken?",
    "Können Bakterien Antikörper neutralisieren?",
    "Kann das Immunsystem ohne Antigene reagieren?",
    "Können Viren Proteine ohne Ribosomen herstellen?",
    "Können Bakterien ohne Zellmembran überleben?",
    "Können Antikörper Viren aktiv vermehren?",
    "Können Viren ohne Wirtszellen Energie speichern?",
    "Können Bakterien ohne Stoffwechsel aktiv bleiben?",
    "Können Antikörper ohne B-Zellen entstehen?",
  ]),
  ...questionRows("schwer", "nein", [
    "Können Viren ihre eigene Zellwand bilden?",
    "Können Bakterien ohne DNA überleben?",
    "Kann die spezifische Immunabwehr ohne T-Helferzellen starten?",
    "Können Viren Antikörper zerstören?",
    "Können Bakterien Viren in sich vermehren?",
    "Kann eine Impfung sofort vollständigen Schutz bieten?",
    "Können Gedächtniszellen ohne vorherige Infektion entstehen?",
    "Können Viren ohne Wirtszellen mutieren?",
    "Können Antikörper körpereigene Zellen angreifen?",
    "Können Bakterien ohne Stoffwechsel aktiv bleiben?",
  ]),
  ...questionRows("leicht", "nein", [
    "Können Viren ohne Wirtszellen Proteine herstellen?",
    "Können Bakterien ohne Zellmembran überleben?",
    "Kann die spezifische Immunabwehr ohne Antigene starten?",
    "Können Antikörper Viren vermehren?",
    "Können Viren selbstständig wachsen?",
    "Können Bakterien ohne Wasser Stoffwechsel betreiben?",
    "Kann man eine Infektion immer sofort erkennen?",
    "Können Viren ohne Rezeptoren an Zellen andocken?",
    "Können B-Zellen Viren direkt zerstören?",
    "Können Antikörper ohne B-Zellen entstehen?",
  ]),
  ...questionRows("mittel", "nein", [
    "Können Bakterien ohne DNA existieren?",
    "Können Viren ohne Wirtszellen mutieren?",
    "Können Makrophagen Antikörper bilden?",
    "Können Viren Antikörper zerstören?",
    "Können Bakterien Viren in sich vermehren?",
    "Kann eine Impfung sofort vollständigen Schutz geben?",
    "Können Gedächtniszellen ohne Infektion entstehen?",
    "Können Viren ohne Wirtszellen Energie speichern?",
    "Können Antikörper körpereigene Zellen angreifen?",
    "Können Bakterien ohne Stoffwechsel aktiv bleiben?",
    "Können Viren sich durch Teilung vermehren?",
    "Können Bakterien ohne Ribosomen Proteine herstellen?",
    "Kann die unspezifische Abwehr Viren gezielt erkennen?",
    "Können Viren ohne Erbmaterial existieren?",
    "Können Antikörper Bakterien teilen?",
  ]),
  ...questionRows("schwer", "nein", [
    "Können Bakterien ohne Zellwand stabil bleiben?",
    "Können Viren ohne Hülle überleben?",
    "Können T-Helferzellen Viren direkt töten?",
    "Können B-Zellen ohne Aktivierung Antikörper bilden?",
    "Können Viren ohne Wirtszellen replizieren?",
    "Können Bakterien ohne Enzyme leben?",
    "Können Antikörper ohne Antigene wirken?",
    "Können Viren ohne Kapsid stabil bleiben?",
    "Können Bakterien ohne Zellteilung wachsen?",
    "Können Viren ohne Wirtszellen Proteine verändern?",
    "Können Antikörper Viren aktiv zerstören?",
    "Können Bakterien ohne Plasmide überleben?",
    "Können Viren ohne Wirtszellen über Wochen aktiv bleiben?",
    "Können Antikörper ohne Immunsystem existieren?",
    "Können Bakterien ohne Zellkern Informationen speichern?",
  ]),
  ...questionRows("leicht", "ja", [
    "Können Bakterien nützlich sein?",
    "Können Viren Krankheiten auslösen?",
    "Kann man sich durch Niesen anstecken?",
    "Können Antikörper Erreger erkennen?",
    "Kann Fieber eine Abwehrreaktion sein?",
    "Können Bakterien sich teilen?",
    "Kann man sich durch verunreinigtes Wasser anstecken?",
    "Können Viren mutieren?",
    "Können Haustiere Krankheiten übertragen?",
    "Können Antikörper gespeichert werden?",
    "Können Bakterien Wärme schlecht vertragen?",
    "Kann man sich durch Küssen anstecken?",
    "Können Viren über die Luft übertragen werden?",
    "Können Antikörper Viren blockieren?",
    "Können Bakterien Antibiotika überleben?",
    "Kann Stress das Immunsystem schwächen?",
    "Können Viren Tiere infizieren?",
    "Können Antikörper Erreger markieren?",
    "Kann man sich durch gemeinsam genutzte Flaschen anstecken?",
    "Können Bakterien im Körper leben?",
    "Können Viren DNA besitzen?",
    "Können Bakterien RNA besitzen?",
    "Kann man sich durch Blut anstecken?",
    "Können Viren Organe infizieren?",
    "Können Antikörper im Blut schwimmen?",
    "Können Bakterien Toxine bilden?",
    "Kann man sich durch verunreinigte Lebensmittel anstecken?",
    "Können Viren RNA besitzen?",
    "Können Bakterien Krankheiten verursachen?",
    "Können Antikörper Viren verklumpen?",
    "Können Viren Zellen zerstören?",
    "Können Bakterien sich schnell vermehren?",
    "Können Antikörper im Körper bleiben?",
    "Können Viren über Oberflächen übertragen werden?",
    "Können Bakterien Hitze überleben?",
    "Können Antikörper Erreger neutralisieren?",
    "Können Viren im Körper ruhen?",
    "Können Bakterien sich anpassen?",
    "Können Antikörper im Immunsystem gespeichert werden?",
    "Können Viren durch Tröpfchen übertragen werden?",
  ]),
  ...questionRows("mittel", "ja", [
    "Können Bakterien Sporen bilden?",
    "Können Viren ihre Oberfläche verändern?",
    "Können T-Helferzellen B-Zellen aktivieren?",
    "Können Antikörper Antigene erkennen?",
    "Können Bakterien horizontal Gene übertragen?",
    "Können Viren Zellen umprogrammieren?",
    "Können Makrophagen Erreger fressen?",
    "Können B-Zellen zu Plasmazellen werden?",
    "Können Viren DNA in Wirtszellen einbauen?",
    "Können Antikörper Viren neutralisieren?",
    "Können Bakterien Biofilme bilden?",
    "Können Viren mehrere Arten infizieren?",
    "Können Antikörper verklumpen?",
    "Können Bakterien Toxine abgeben?",
    "Können Viren Immunzellen infizieren?",
    "Können Antikörper Viren blockieren?",
    "Können Bakterien Plasmide austauschen?",
    "Können Viren Enzyme nutzen, um Zellen zu öffnen?",
    "Können Antikörper im Blut zirkulieren?",
    "Können Bakterien sich an Umwelt anpassen?",
    "Können Viren Wirtszellen zerstören?",
    "Können Antikörper Gedächtniszellen aktivieren?",
    "Können Bakterien Krankheiten verursachen?",
    "Können Viren RNA besitzen?",
    "Können Antikörper Viren verklumpen?",
    "Können Bakterien Zellwände haben?",
    "Können Viren Organe infizieren?",
    "Können Antikörper im Körper bleiben?",
    "Können Bakterien Hitze überleben?",
    "Können Viren über Oberflächen übertragen werden?",
  ]),
  ...questionRows("schwer", "ja", [
    "Können dendritische Zellen Antigene präsentieren?",
    "Können Viren ihre Oberfläche stark verändern?",
    "Können T-Helferzellen die Immunantwort steuern?",
    "Können Bakterien Resistenzgene austauschen?",
    "Können Viren DNA in Wirtszellen integrieren?",
    "Können Antikörper Viren neutralisieren?",
    "Können Bakterien Biofilme bilden?",
    "Können Viren Immunzellen infizieren?",
    "Können Antikörper Antigene verklumpen?",
    "Können Bakterien Toxine freisetzen?",
    "Können Viren Wirtszellen lysieren?",
    "Können Antikörper Gedächtniszellen aktivieren?",
    "Können Bakterien Plasmide übertragen?",
    "Können Viren Enzyme nutzen, um Zellen zu öffnen?",
    "Können Antikörper Viren blockieren?",
    "Können Bakterien sich extrem schnell vermehren?",
    "Können Viren mehrere Arten infizieren?",
    "Können Antikörper im Blut zirkulieren?",
    "Können Bakterien Zellwände verstärken?",
    "Können Viren RNA besitzen?",
    "Können Antikörper Viren verklumpen?",
    "Können Bakterien Hitze überleben?",
    "Können Viren Organe infizieren?",
    "Können Antikörper im Körper bleiben?",
    "Können Bakterien Resistenz entwickeln?",
    "Können Viren über Oberflächen übertragen werden?",
  ]),
  // Eingabe-Fragen fuer den Fragetyp "Nur Eingabe".
  ...inputQuestionRows("leicht", [
    ["Wie heißt die erste Schutzschicht des Körpers?", "haut"],
    ["Wie nennt man die Zeit zwischen Ansteckung und Symptomen?", "inkubationszeit"],
    ["Wie heißen die Abwehrstoffe der B-Zellen?", "antikörper"],
    ["Wie nennt man die Übertragung durch Niesen?", "tröpfcheninfektion"],
    ["Wie heißt die Krankheit durch Influenzaviren?", "grippe"],
    ["Wie heißen die Zellen, die Erreger fressen?", "fresszellen"],
    ["Wie nennt man die Übertragung durch verunreinigtes Wasser?", "wasserinfektion"],
    ["Wie heißt die Reaktion, die Fieber auslöst?", "pyrogenreaktion"],
    ["Wie heißen die Zellen, die infizierte Zellen zerstören?", "t-killerzellen"],
    ["Wie heißen die Erkennungsmerkmale auf Erregern?", "antigene"],
    ["Wie nennt man die Übertragung durch Lebensmittel?", "lebensmittelinfektion"],
    ["Wie nennt man die Zellen, die Antikörper speichern?", "gedächtniszellen"],
    ["Wie heißt die Schutzreaktion des Körpers bei Hitze?", "schwitzen"],
    ["Wie nennt man die Abwehrreaktion gegen Allergene?", "allergie"],
    ["Wie heißt die Flüssigkeit, in der Antikörper schwimmen?", "blut"],
    ["Wie nennt man die Übertragung durch Speichel?", "kontaktinfektion"],
    ["Wie heißt die Reaktion, wenn der Körper Krankheitserreger erkennt?", "immunantwort"],
    ["Wie nennt man die Abwehrzellen im Blut?", "leukozyten"],
    ["Wie heißt die Übertragung durch Tiere?", "vektorinfektion"],
    ["Wie nennt man die Phase nach der Infektion?", "krankheitsphase"],
    ["Wie heißt die Phase, in der Symptome verschwinden?", "abklingphase"],
    ["Wie nennt man die Erreger, die Krankheiten auslösen?", "krankheitserreger"],
    ["Wie heißt die Flüssigkeit, die Zellen umgibt?", "gewebe"],
    ["Wie nennt man die Abwehrreaktion gegen Viren?", "antivirale immunantwort"],
    ["Wie heißt die Übertragung durch die Luft?", "luftinfektion"],
    ["Wie nennt man die Abwehrreaktion gegen Bakterien?", "antibakterielle immunantwort"],
    ["Wie heißt die Flüssigkeit, die Viren transportiert?", "blut"],
    ["Wie nennt man die Zellen, die Antikörper freisetzen?", "plasmazellen"],
    ["Wie heißt die Reaktion, wenn Antikörper Viren verklumpen?", "agglutination"],
    ["Wie nennt man die Abwehrreaktion des Körpers?", "immunantwort"],
    ["Wie heißt die Übertragung durch Hautkontakt?", "kontaktinfektion"],
    ["Wie nennt man die Zellen, die Viren anzeigen?", "antigenpräsentierende zellen"],
    ["Wie heißt die Reaktion, wenn der Körper Antikörper bildet?", "immunantwort"],
    ["Wie nennt man die Übertragung durch Blut?", "blutinfektion"],
    ["Wie heißt die Phase, in der Erreger sich vermehren?", "inkubationszeit"],
    ["Wie nennt man die Abwehrreaktion gegen Pilze?", "antifungale immunantwort"],
    ["Wie heißt die Reaktion, wenn der Körper Viren erkennt?", "antivirale immunantwort"],
    ["Wie nennt man die Zellen, die Viren zerstören?", "t-killerzellen"],
    ["Wie heißt die Phase, in der man sich erholt?", "genesungsphase"],
    ["Wie nennt man die Abwehrreaktion gegen Parasiten?", "antiparasitäre immunantwort"],
    ["Wie heißt die Flüssigkeit, die Immunzellen transportiert?", "lymphflüssigkeit"],
    ["Wie nennt man die Zellen, die Viren markieren?", "antikörper"],
    ["Wie heißt die Übertragung durch Tiere?", "vektorinfektion"],
    ["Wie nennt man die Abwehrreaktion gegen Giftstoffe?", "entgiftungsreaktion"],
    ["Wie heißt die Reaktion, wenn der Körper Viren blockiert?", "neutralisation"],
    ["Wie nennt man die Zellen, die Antikörper freisetzen?", "plasmazellen"],
    ["Wie heißt die Phase, in der Symptome auftreten?", "krankheitsphase"],
    ["Wie nennt man die Abwehrreaktion gegen Viren?", "antivirale immunantwort"],
    ["Wie heißt die Reaktion, wenn Antikörper Erreger markieren?", "opsonisierung"],
    ["Wie nennt man die Zellen, die Antigene anzeigen?", "antigenpräsentierende zellen"],
  ]),
  ...inputQuestionRows("mittel", [
    ["Wie nennt man die gezielte Immunabwehr?", "spezifische immunabwehr"],
    ["Wie heißen die Zellen, die Antikörper herstellen?", "b-zellen"],
    ["Wie nennt man die Zellen, die Antigene präsentieren?", "dendritische zellen"],
    ["Wie heißt die Phase stärkster Symptome?", "krankheitsphase"],
    ["Wie nennt man die Immunzellen, die Antikörper speichern?", "gedächtniszellen"],
    ["Wie heißt die Übertragung durch Tiere?", "vektorinfektion"],
    ["Wie nennt man die Immunreaktion nach Impfung?", "aktive immunisierung"],
    ["Wie heißt die schnelle Immunabwehr?", "unspezifische immunabwehr"],
    ["Wie nennt man die Phase der Erholung?", "genesungsphase"],
    ["Wie heißt die Reaktion, wenn Antikörper Viren blockieren?", "neutralisation"],
    ["Wie nennt man die Verklumpung von Antigenen?", "agglutination"],
    ["Wie heißt die Reaktion, wenn Makrophagen Erreger aufnehmen?", "phagozytose"],
    ["Wie nennt man die Immunreaktion, die Gedächtniszellen bildet?", "sekundäre immunantwort"],
    ["Wie heißt die Phase, in der Erregerzahl sinkt?", "abklingphase"],
    ["Wie nennt man die Proteine, die infizierte Zellen aussenden?", "interferone"],
    ["Wie heißt die Reaktion, wenn Antikörper Erreger markieren?", "opsonisierung"],
    ["Wie nennt man die Immunzellen, die Virenreste präsentieren?", "dendritische zellen"],
    ["Wie heißt die Reaktion, wenn Viren Zellen zerstören?", "lyse"],
    ["Wie nennt man die Phase, in der Erreger sich stark vermehren?", "inkubationszeit"],
    ["Wie heißt die Immunreaktion gegen Viren?", "antivirale immunantwort"],
  ]),
  ...inputQuestionRows("schwer", [
    ["Wie nennt man die Reaktion, wenn Makrophagen Antigene präsentieren?", "antigenpräsentation"],
    ["Wie heißt die Immunreaktion, die Gedächtniszellen bildet?", "sekundäre immunantwort"],
    ["Wie nennt man die Verklumpung von Viren durch Antikörper?", "agglutination"],
    ["Wie heißt die Reaktion, wenn Antikörper Viren blockieren?", "neutralisation"],
    ["Wie nennt man die Phase, in der der Körper Erreger vollständig beseitigt?", "genesungsphase"],
    ["Wie heißt die Reaktion, wenn Viren DNA in Wirtszellen einbauen?", "integration"],
    ["Wie nennt man die Immunzellen, die Virenreste anzeigen?", "dendritische zellen"],
    ["Wie heißt die Reaktion, wenn Viren Zellen auflösen?", "lyse"],
  ]),
];

let questionBank = loadQuestionBank();
let questions = buildQuestionSet();
let progress = loadProgress();
let selectedColorThemeId = loadColorThemeId();
let round = null;
let timerId = null;
let adTimerId = null;
let adCountdownId = null;
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
      edits: sanitizeQuestionEdits(stored?.edits),
      custom: Array.isArray(stored?.custom) ? stored.custom.map(sanitizeCustomQuestion).filter(Boolean) : [],
    };
  } catch {
    return { edits: {}, custom: [] };
  }
}

function isRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function textValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sanitizeQuestionFields(question) {
  if (!isRecord(question)) return null;
  const sanitized = {};
  const prompt = textValue(question.prompt);
  const answer = textValue(question.answer).toLowerCase();
  if (prompt) sanitized.prompt = prompt;
  if (answer) sanitized.answer = answer;
  if (DIFFICULTIES.includes(question.difficulty)) sanitized.difficulty = question.difficulty;
  if (Object.prototype.hasOwnProperty.call(TOPIC_LABELS, question.topic)) sanitized.topic = question.topic;
  return sanitized;
}

function sanitizeQuestionEdits(edits) {
  if (!isRecord(edits)) return {};
  return Object.entries(edits).reduce((validEdits, [id, edit]) => {
    const sanitized = sanitizeQuestionFields(edit);
    if (/^q-\d+$/.test(id) && sanitized && Object.keys(sanitized).length) validEdits[id] = sanitized;
    return validEdits;
  }, {});
}

function sanitizeCustomQuestion(question) {
  const sanitized = sanitizeQuestionFields(question);
  const id = isRecord(question) ? textValue(question.id) : "";
  if (!id || !sanitized?.prompt || !sanitized.answer || !sanitized.difficulty || !sanitized.topic) return null;
  return { id, ...sanitized };
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

function loadColorThemeId() {
  const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
  return COLOR_THEMES.some((theme) => theme.id === stored) ? stored : COLOR_THEMES[0].id;
}

function selectedColorTheme() {
  return COLOR_THEMES.find((theme) => theme.id === selectedColorThemeId) || COLOR_THEMES[0];
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function applyColorTheme() {
  const theme = selectedColorTheme();
  const [r, g, b] = hexToRgb(theme.accent);
  const root = document.documentElement;
  root.style.setProperty("--accent", theme.accent);
  root.style.setProperty("--accent-rgb", `${r}, ${g}, ${b}`);
  root.style.setProperty("--accent-2", theme.accent2);
  root.style.setProperty("--accent-soft", `rgba(${r}, ${g}, ${b}, 0.1)`);
  root.style.setProperty("--hero-start", colorWithAlpha(theme.accent, 0.95));
  root.style.setProperty("--hero-end", colorWithAlpha(theme.heroEnd, 0.92));
}

function colorWithAlpha(hex, alpha) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function renderColorPalette() {
  const palette = $("#color-palette");
  if (!palette) return;
  palette.innerHTML = COLOR_THEMES.map(
    (theme) => `
      <button class="color-option ${theme.id === selectedColorThemeId ? "active" : ""}" type="button" data-color-theme="${theme.id}">
        <span class="palette-swatch" style="--swatch-a:${theme.accent}; --swatch-b:${theme.accent2}"></span>
        <span>${theme.name}</span>
      </button>
    `,
  ).join("");
}

function selectColorTheme(themeId) {
  if (!COLOR_THEMES.some((theme) => theme.id === themeId)) return;
  selectedColorThemeId = themeId;
  localStorage.setItem(COLOR_THEME_STORAGE_KEY, selectedColorThemeId);
  applyColorTheme();
  renderColorPalette();
  renderProgress();
  if ($("#results-screen").classList.contains("active")) renderWave($("#results-wave"));
  closeColorSettingsPanel();
  notify("Farbe geändert", `${selectedColorTheme().name} ist jetzt aktiv.`);
}

function storedTime(key) {
  return Number(localStorage.getItem(key) || 0);
}

function setStoredTime(key, value) {
  localStorage.setItem(key, String(value));
}

function adFreeUntil() {
  return storedTime(AD_FREE_UNTIL_STORAGE_KEY);
}

function isAdFreeActive() {
  return adFreeUntil() > Date.now();
}

function formatClockTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
}

function updateAdFreeStatus() {
  const status = $("#ad-free-status");
  if (!status) return;
  if (isAdFreeActive()) {
    status.textContent = `Werbefrei aktiv bis ${formatClockTime(adFreeUntil())}.`;
    return;
  }
  status.textContent = "Code 6767: 30 Minuten ohne Herr Holzmann.";
}

function ensureNextAdTime() {
  const nextAdAt = storedTime(AD_NEXT_STORAGE_KEY);
  if (!nextAdAt) setStoredTime(AD_NEXT_STORAGE_KEY, Date.now() + AD_INTERVAL_MS);
}

function scheduleAdBreak() {
  clearTimeout(adTimerId);
  updateAdFreeStatus();
  ensureNextAdTime();

  if (isAdFreeActive()) {
    adTimerId = setTimeout(scheduleAdBreak, Math.min(adFreeUntil() - Date.now(), AD_INTERVAL_MS));
    return;
  }

  const delay = Math.max(0, storedTime(AD_NEXT_STORAGE_KEY) - Date.now());
  adTimerId = setTimeout(showAdBreak, delay);
}

function showAdBreak() {
  if (isAdFreeActive()) {
    setStoredTime(AD_NEXT_STORAGE_KEY, adFreeUntil() + AD_INTERVAL_MS);
    scheduleAdBreak();
    return;
  }

  const overlay = $("#ad-break");
  let remaining = Math.ceil(AD_DURATION_MS / 1000);
  $("#ad-countdown").textContent = remaining;
  overlay.classList.remove("hidden");

  clearInterval(adCountdownId);
  adCountdownId = setInterval(() => {
    remaining -= 1;
    $("#ad-countdown").textContent = Math.max(0, remaining);
    if (remaining <= 0) finishAdBreak();
  }, 1000);
}

function finishAdBreak() {
  clearInterval(adCountdownId);
  $("#ad-break").classList.add("hidden");
  setStoredTime(AD_NEXT_STORAGE_KEY, Date.now() + AD_INTERVAL_MS);
  scheduleAdBreak();
}

function redeemAdFreeCode(event) {
  event.preventDefault();
  const input = $("#ad-free-code");
  if (input.value.trim() !== AD_FREE_CODE) {
    notify("Code nicht korrekt", "Der Werbefrei-Code lautet nicht so.");
    return;
  }

  const until = Date.now() + AD_FREE_MS;
  setStoredTime(AD_FREE_UNTIL_STORAGE_KEY, until);
  setStoredTime(AD_NEXT_STORAGE_KEY, until + AD_INTERVAL_MS);
  input.value = "";
  updateAdFreeStatus();
  scheduleAdBreak();
  notify("Werbefrei aktiviert", "30 Minuten lang kommt Herr Holzmann nicht vorbei.");
}

function closeColorSettingsPanel() {
  $("#color-settings-panel").classList.add("hidden");
  $("#color-settings-toggle").setAttribute("aria-expanded", "false");
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

  closeColorSettingsPanel();
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
  const lastPoint = points[points.length - 1];
  const area = `${path} L ${lastPoint[0].toFixed(1)} 105 L ${points[0][0].toFixed(1)} 105 Z`;
  svg.innerHTML = `
    <path d="${area}" fill="var(--accent-soft)"></path>
    <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"></path>
    ${points.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="var(--accent-2)"></circle>`).join("")}
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
$("#color-settings-toggle").addEventListener("click", () => {
  const panel = $("#color-settings-panel");
  const isOpen = !panel.classList.contains("hidden");
  panel.classList.toggle("hidden", isOpen);
  $("#color-settings-toggle").setAttribute("aria-expanded", String(!isOpen));
});
$("#color-palette").addEventListener("click", (event) => {
  const button = event.target.closest("[data-color-theme]");
  if (!button) return;
  selectColorTheme(button.dataset.colorTheme);
});
$("#ad-free-form").addEventListener("submit", redeemAdFreeCode);
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

applyColorTheme();
renderColorPalette();
renderProgress();
scheduleAdBreak();

window.__quizDebug = { questions, getQuestionPool, normalize, COLOR_THEMES, showAdBreak, scheduleAdBreak };
