const rarityClass = {
  Standard: "standard",
  Erweitert: "erweitert",
  Exklusiv: "exklusiv",
  Elite: "elite",
  "Limitierte Edition": "limitiert",
  "Ultra-Limitierte Edition": "ultra",
};

const maxPassLevel = 50;

const themeCatalog = [
  {
    id: "minimal",
    name: "Minimal Edition",
    className: "",
    colors: ["#eef1f4", "#ffffff"],
    bonus: "+0% XP",
    price: "Start",
  },
  {
    id: "midnight",
    name: "Midnight Edition",
    className: "theme-midnight",
    colors: ["#08111f", "#d8b56e"],
    bonus: "+1% XP",
    price: "390 Diamanten",
  },
  {
    id: "ice",
    name: "Ice Edition",
    className: "theme-ice",
    colors: ["#f7feff", "#168899"],
    bonus: "+1% XP",
    price: "290 Diamanten",
  },
  {
    id: "carbon",
    name: "Carbon Edition",
    className: "theme-carbon",
    colors: ["#14161a", "#c7cbd1"],
    bonus: "+1% XP",
    price: "4,99 EUR",
  },
  {
    id: "pinkwave",
    name: "Pinkwave Edition",
    className: "theme-pinkwave",
    colors: ["#fff3f8", "#9f466c"],
    bonus: "+1% XP",
    price: "250 Diamanten",
  },
  {
    id: "neon",
    name: "Neon Edition",
    className: "theme-neon",
    colors: ["#050b16", "#1ca7ec"],
    bonus: "+1% XP",
    price: "Event",
  },
];

const initialStocks = [
  { id: "nordtech", symbol: "NT", name: "NordTech AG", sector: "Technologie", price: 118, prev: 118, owned: 0, volatility: 0.072 },
  { id: "alpine", symbol: "AB", name: "Alpine Bank", sector: "Finanzen", price: 76, prev: 76, owned: 0, volatility: 0.047 },
  { id: "solaris", symbol: "SE", name: "Solaris Energy", sector: "Energie", price: 44, prev: 44, owned: 0, volatility: 0.095 },
  { id: "primehomes", symbol: "PH", name: "PrimeHomes RE", sector: "Immobilien", price: 132, prev: 132, owned: 0, volatility: 0.054 },
  { id: "medica", symbol: "MC", name: "Medica Labs", sector: "Gesundheit", price: 58, prev: 58, owned: 0, volatility: 0.063 },
  { id: "orbit", symbol: "OX", name: "Orbit Express", sector: "Logistik", price: 34, prev: 34, owned: 0, volatility: 0.082 },
  { id: "cloudpeak", symbol: "CP", name: "CloudPeak Systems", sector: "Software", price: 149, prev: 149, owned: 0, volatility: 0.068 },
  { id: "harbor", symbol: "HH", name: "Harbor Hospitality", sector: "Konsum", price: 27, prev: 27, owned: 0, volatility: 0.052 },
  { id: "bioforge", symbol: "BF", name: "BioForge SE", sector: "Biotech", price: 88, prev: 88, owned: 0, volatility: 0.11 },
  { id: "terra", symbol: "TG", name: "TerraGrid Utilities", sector: "Versorger", price: 63, prev: 63, owned: 0, volatility: 0.032 },
];

const initialEtfs = [
  { id: "world-core", symbol: "WC", name: "World Core ETF", sector: "Global", price: 91, prev: 91, owned: 0, volatility: 0.018 },
  { id: "dividend-select", symbol: "DS", name: "Dividend Select ETF", sector: "Dividenden", price: 64, prev: 64, owned: 0, volatility: 0.014 },
  { id: "future-cities", symbol: "FC", name: "Future Cities ETF", sector: "Urbanisierung", price: 38, prev: 38, owned: 0, volatility: 0.026 },
];

const initialProperties = [
  {
    id: "studio",
    name: "Micro Studio",
    cost: 980,
    rent: 46,
    level: 1,
    owned: true,
    paint: "#dfe7ef",
    paintName: "Arctic Grey",
  },
  {
    id: "loft",
    name: "City Loft",
    cost: 3200,
    rent: 155,
    level: 1,
    owned: false,
    paint: "#e8dfd1",
    paintName: "Warm Sand",
  },
  {
    id: "villa",
    name: "Glass Villa",
    cost: 12500,
    rent: 640,
    level: 1,
    owned: false,
    paint: "#d9f7fb",
    paintName: "Ice Pearl",
  },
];

const shopItems = [
  { category: "Boost-Items", name: "Dividend Boost 24h", rarity: "Erweitert", description: "+6% Miete und Dividenden fuer einen Tag.", priceType: "gems", basePrice: 34 },
  { category: "Boost-Items", name: "Focus Portfolio", rarity: "Standard", description: "+4% XP fuer die naechsten 20 Aktionen.", priceType: "cash", basePrice: 420 },
  { category: "Schutz-Items", name: "Crash Guard", rarity: "Exklusiv", description: "Reduziert den naechsten grossen Kursverlust um 35%.", priceType: "gems", basePrice: 88 },
  { category: "Schutz-Items", name: "Safe Lease", rarity: "Erweitert", description: "Schuetzt eine Immobilie vor Mietausfall-Events.", priceType: "cash", basePrice: 760 },
  { category: "Kosmetik-Items", name: "Silberner Profilrahmen", rarity: "Exklusiv", description: "Cleaner Metallrahmen fuer dein Investor-Profil.", priceType: "gems", basePrice: 120 },
  { category: "Limitierte Items", name: "Goldene Aktie #42/100", rarity: "Ultra-Limitierte Edition", description: "Weltweit limitierter Prestige-Gegenstand mit +0,5% XP.", priceType: "real", basePrice: 19.99 },
  { category: "Avatar-Shop", name: "Carbon Mantel", rarity: "Elite", description: "Minimalistisches Outfit mit kleinem Handels-XP-Bonus.", priceType: "gems", basePrice: 210 },
  { category: "Avatar-Shop", name: "Executive Sneaker", rarity: "Erweitert", description: "Dezenter Avatar-Stil fuer langfristige Missionen.", priceType: "cash", basePrice: 950 },
  { category: "Design-Editionen", name: "Midnight Edition", rarity: "Limitierte Edition", description: "Dunkelblau, Gold und ruhige Kontraste fuer das gesamte UI.", priceType: "gems", basePrice: 390 },
  { category: "Design-Editionen", name: "Carbon Edition", rarity: "Exklusiv", description: "Schwarz, Silber und reduzierte Oberflaechen.", priceType: "real", basePrice: 4.99 },
];

const events = [
  { name: "Dividenden-Boost", detail: "+8% ETF-Ertraege", reward: "seltene Diamantchance" },
  { name: "Immobilien-Boom", detail: "+12% Miete", reward: "Event-Farbe moeglich" },
  { name: "Geldregen", detail: "kleine EUR-Drops", reward: "Daily Bonus" },
  { name: "Crash Watch", detail: "hoehere Volatilitaet", reward: "guenstige Einstiege" },
];

const initialOpponents = [
  {
    id: "akeller",
    name: "A. Keller",
    style: "Momentum",
    cash: 1410,
    holdings: { nordtech: 3, cloudpeak: 2, solaris: 4 },
    lastMove: "wartet auf Runde 2",
  },
  {
    id: "mira",
    name: "Mira Capital",
    style: "Dividende",
    cash: 1680,
    holdings: { alpine: 4, terra: 5, primehomes: 2 },
    lastMove: "haelt defensive Werte",
  },
  {
    id: "nordclan",
    name: "NordClan",
    style: "Riskant",
    cash: 1120,
    holdings: { bioforge: 3, orbit: 5, harbor: 4 },
    lastMove: "sucht Volatilitaet",
  },
];

const defaultState = {
  cash: 1250,
  gems: 24,
  xp: 0,
  round: 1,
  rentCollectedRound: 0,
  roundLog: "Runde 1: Markt eroeffnet.",
  passLevel: 1,
  activeTab: "stocks",
  activeTheme: "minimal",
  premium: false,
  pushEnabled: false,
  meetupConnected: false,
  meetupEventsSynced: 0,
  selectedShopCategory: "Boost-Items",
  stocks: initialStocks,
  etfs: initialEtfs,
  properties: initialProperties,
  opponents: initialOpponents,
  rules: [
    { id: "rule-1", assetId: "nordtech", condition: "gain", value: 6, action: "sell", active: true, anchorPrice: 118 },
    { id: "rule-2", assetId: "solaris", condition: "loss", value: 9, action: "buy", active: true, anchorPrice: 44 },
  ],
  notifications: [],
  ownedThemes: ["minimal"],
};

let state = loadState();

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem("capitalAtelierState"));
    if (!stored) return structuredClone(defaultState);
    return {
      ...structuredClone(defaultState),
      ...stored,
      stocks: mergeAssets(initialStocks, stored.stocks),
      etfs: mergeAssets(initialEtfs, stored.etfs),
      properties: mergeAssets(initialProperties, stored.properties),
      opponents: mergeOpponents(initialOpponents, stored.opponents),
    };
  } catch {
    return structuredClone(defaultState);
  }
}

function mergeAssets(defaults, stored = []) {
  return defaults.map((asset) => ({ ...asset, ...(stored.find((item) => item.id === asset.id) || {}) }));
}

function mergeOpponents(defaults, stored = []) {
  return defaults.map((opponent) => {
    const saved = stored.find((item) => item.id === opponent.id) || {};
    return {
      ...opponent,
      ...saved,
      holdings: { ...opponent.holdings, ...(saved.holdings || {}) },
    };
  });
}

function saveState() {
  localStorage.setItem("capitalAtelierState", JSON.stringify(state));
}

function euro(value, digits = 0) {
  return value.toLocaleString("de-DE", {
    currency: "EUR",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
    style: "currency",
  });
}

function gems(value) {
  return Math.floor(value).toLocaleString("de-DE");
}

function allAssets() {
  return [...state.stocks, ...state.etfs];
}

function getAsset(assetId) {
  return allAssets().find((asset) => asset.id === assetId);
}

function netWorth() {
  const securityValue = allAssets().reduce((total, asset) => total + asset.price * asset.owned, 0);
  const propertyValue = state.properties.reduce((total, property) => {
    return total + (property.owned ? property.cost * (1 + (property.level - 1) * 0.22) : 0);
  }, 0);
  return state.cash + securityValue + propertyValue;
}

function opponentWorth(opponent) {
  return (
    opponent.cash +
    state.stocks.reduce((total, asset) => {
      return total + (opponent.holdings[asset.id] || 0) * asset.price;
    }, 0)
  );
}

function xpNeededForLevel(level) {
  return 180 + (level - 1) * 20;
}

function passRewardForLevel(level) {
  if (level > maxPassLevel) return { gems: 0, label: "Alles freigeschaltet" };
  if (level % 10 === 0) return { gems: 6, label: "6 Diamanten" };
  if (level % 5 === 0) return { gems: 4, label: "4 Diamanten" };
  if (level % 3 === 0) return { gems: 2, label: "2 Diamanten" };
  return { gems: 1, label: "1 Diamant" };
}

function addXp(amount) {
  const themeBonus = state.activeTheme === "minimal" ? 1 : 1.01;
  const premiumBonus = state.premium ? 1.04 : 1;
  state.xp += Math.round(amount * themeBonus * premiumBonus);
  while (state.passLevel < maxPassLevel && state.xp >= xpNeededForLevel(state.passLevel)) {
    state.xp -= xpNeededForLevel(state.passLevel);
    state.passLevel += 1;
    const reward = passRewardForLevel(state.passLevel);
    state.gems += reward.gems;
    notify("Battle Pass Level " + state.passLevel, "Belohnung erhalten: " + reward.label + ".");
  }
  if (state.passLevel >= maxPassLevel) state.xp = 0;
}

function notify(title, message, important = false) {
  state.notifications.unshift({ title, message, at: Date.now() });
  state.notifications = state.notifications.slice(0, 12);

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
  document.getElementById("toast-stack").appendChild(toast);
  setTimeout(() => toast.remove(), 4200);

  if (state.pushEnabled && important && "Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body: message });
  }
}

function updateWallet() {
  document.getElementById("cash-balance").textContent = euro(state.cash);
  document.getElementById("gem-balance").textContent = gems(state.gems);
  document.getElementById("net-worth").textContent = euro(netWorth());
  document.getElementById("pass-level").textContent = "Level " + state.passLevel + " / 50";
  const xpNeeded = xpNeededForLevel(state.passLevel);
  const nextReward = passRewardForLevel(state.passLevel + 1);
  document.getElementById("pass-xp").textContent =
    state.passLevel >= maxPassLevel ? "Max Level" : `${state.xp} / ${xpNeeded} XP`;
  document.getElementById("pass-next-reward").textContent =
    state.passLevel >= maxPassLevel ? "Alle Belohnungen" : "Level " + (state.passLevel + 1) + ": " + nextReward.label;
  document.getElementById("xp-progress").style.width =
    state.passLevel >= maxPassLevel ? "100%" : `${Math.min(100, (state.xp / xpNeeded) * 100)}%`;
}

function renderRoundHud() {
  const rentCollected = state.rentCollectedRound === state.round;
  const rentButton = document.getElementById("collect-rent");
  document.getElementById("round-number").textContent = "Runde " + state.round;
  document.getElementById("rent-status").textContent = rentCollected ? "Eingezogen" : "Offen";
  document.getElementById("round-log").textContent = state.roundLog;
  rentButton.disabled = rentCollected;
  rentButton.textContent = rentCollected ? "Miete eingezogen" : "Miete einziehen";
}

function renderStocks() {
  document.getElementById("stock-list").innerHTML = state.stocks.map(renderAssetCard).join("");
  const ruleAsset = document.getElementById("rule-asset");
  ruleAsset.innerHTML = state.stocks.map((asset) => `<option value="${asset.id}">${asset.name}</option>`).join("");
}

function renderEtfs() {
  document.getElementById("etf-list").innerHTML = state.etfs.map(renderAssetCard).join("");
}

function renderAssetCard(asset) {
  const change = ((asset.price - asset.prev) / asset.prev) * 100;
  const isUp = change >= 0;
  return `
    <article class="market-card">
      <header>
        <div class="asset-name">
          <span class="asset-icon">${asset.symbol}</span>
          <div>
            <strong>${asset.name}</strong>
            <small>${asset.sector} · Bestand ${asset.owned}</small>
          </div>
        </div>
        <span class="change ${isUp ? "up" : "down"}">${isUp ? "+" : ""}${change.toFixed(2)}%</span>
      </header>
      <div class="asset-metrics">
        <div>
          <span>Preis</span>
          <div class="price">${euro(asset.price, 2)}</div>
        </div>
        <div>
          <span>Wert</span>
          <div class="price">${euro(asset.price * asset.owned)}</div>
        </div>
      </div>
      <div class="asset-actions">
        <button data-action="buy-asset" data-id="${asset.id}">Kaufen</button>
        <button data-action="sell-asset" data-id="${asset.id}">Verkaufen</button>
      </div>
    </article>
  `;
}

function renderRules() {
  const maxRules = state.premium ? 8 : 3;
  const activeRules = state.rules.filter((rule) => rule.active).length;
  document.getElementById("rule-limit").textContent = `${activeRules} / ${maxRules} aktiv`;
  document.getElementById("rules-list").innerHTML = state.rules
    .map((rule) => {
      const asset = getAsset(rule.assetId);
      return `
        <article class="rule-row">
          <div>
            <strong>${asset ? asset.name : "Unbekannt"}</strong>
            <small>${conditionLabel(rule)} · ${rule.action === "buy" ? "kaufen" : "verkaufen"}</small>
          </div>
          <label class="switch">
            <input type="checkbox" ${rule.active ? "checked" : ""} data-action="toggle-rule" data-id="${rule.id}" />
            <span></span>
          </label>
        </article>
      `;
    })
    .join("");
}

function conditionLabel(rule) {
  const value = Number(rule.value).toLocaleString("de-DE");
  if (rule.condition === "gain") return `bei +${value}%`;
  if (rule.condition === "loss") return `bei -${value}%`;
  if (rule.condition === "above") return `ueber ${euro(rule.value)}`;
  return `unter ${euro(rule.value)}`;
}

function renderProperties() {
  document.getElementById("property-list").innerHTML = state.properties
    .map((property) => {
      const cost = property.owned ? Math.round(property.cost * 0.38 * property.level) : property.cost;
      const rent = Math.round(property.rent * property.level * paintBonus(property.paintName));
      return `
        <article class="property-card">
          <div class="property-art" style="--paint: ${property.paint}"></div>
          <div class="content">
            <header>
              <div>
                <strong>${property.name}</strong>
                <small>${property.owned ? "Level " + property.level + " · " + property.paintName : "Noch nicht gekauft"}</small>
              </div>
              <span class="limit-chip">${property.owned ? euro(rent) + " Miete" : euro(cost)}</span>
            </header>
            <div class="property-actions">
              <button data-action="${property.owned ? "upgrade-property" : "buy-property"}" data-id="${property.id}">
                ${property.owned ? "Upgrade " + euro(cost) : "Kaufen"}
              </button>
              <button class="secondary" data-action="paint-property" data-id="${property.id}">
                Farbe
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function paintBonus(paintName) {
  if (paintName.includes("Event")) return 1.08;
  if (paintName.includes("Diamond")) return 1.05;
  return 1.02;
}

function renderEvents() {
  document.getElementById("event-strip").innerHTML = events
    .map(
      (event) => `
        <article class="event-card">
          <div>
            <strong>${event.name}</strong>
            <div class="muted">${event.detail}</div>
          </div>
          <span class="limit-chip">${event.reward}</span>
        </article>
      `,
    )
    .join("");
}

function renderShopCategories() {
  const categories = [...new Set(shopItems.map((item) => item.category))];
  document.getElementById("shop-categories").innerHTML = categories
    .map(
      (category) => `
        <button class="${category === state.selectedShopCategory ? "active" : ""}" data-action="shop-category" data-category="${category}">
          ${category}
        </button>
      `,
    )
    .join("");
}

function dynamicPrice(item) {
  const demand = 1 + (Math.sin(Date.now() / 100000 + item.name.length) + 1) * 0.055;
  const eventModifier = item.category.includes("Limitierte") ? 1.14 : 0.98;
  return item.basePrice * demand * eventModifier;
}

function renderShop() {
  renderShopCategories();
  document.getElementById("shop-list").innerHTML = shopItems
    .filter((item) => item.category === state.selectedShopCategory)
    .map((item) => {
      const price = dynamicPrice(item);
      const priceLabel =
        item.priceType === "gems" ? `${Math.round(price)} Diamanten` : item.priceType === "cash" ? euro(price) : `${price.toFixed(2)} EUR`;
      const cls = rarityClass[item.rarity] || "standard";
      return `
        <article class="shop-card">
          <header>
            <div>
              <strong>${item.name}</strong>
              <small>${item.description}</small>
            </div>
            <span class="rarity ${cls}">${item.rarity}</span>
          </header>
          <footer>
            <span class="price">${priceLabel}</span>
            <button data-action="buy-shop" data-name="${item.name}">Kaufen</button>
          </footer>
        </article>
      `;
    })
    .join("");
}

function renderThemes() {
  const activeTheme = themeCatalog.find((theme) => theme.id === state.activeTheme) || themeCatalog[0];
  document.getElementById("active-theme-label").textContent = activeTheme.name;
  document.getElementById("theme-list").innerHTML = themeCatalog
    .map(
      (theme) => `
        <article class="theme-option">
          <div>
            <strong>${theme.name}</strong>
            <div class="muted">${theme.price} · ${theme.bonus}</div>
          </div>
          <button class="theme-swatch" aria-label="${theme.name}" data-action="theme" data-id="${theme.id}">
            <span style="background:${theme.colors[0]}"></span>
            <span style="background:${theme.colors[1]}"></span>
          </button>
        </article>
      `,
    )
    .join("");
}

function renderLeaderboard() {
  const rows = state.opponents.map((opponent) => [opponent.name, opponentWorth(opponent), opponent.lastMove]);
  rows.push(["You", netWorth(), "Aktives Portfolio"]);
  rows.sort((a, b) => b[1] - a[1]);
  document.getElementById("leaderboard").innerHTML = rows
    .map(
      (row, index) => `
        <li>
          <div>
            <strong>#${index + 1} ${row[0]}</strong>
            <small>${row[2]}</small>
          </div>
          <span>${euro(row[1])}</span>
        </li>
      `,
    )
    .join("");
}

function renderOpponents() {
  document.getElementById("opponent-strip").innerHTML = state.opponents
    .map(
      (opponent) => `
        <article class="opponent-card">
          <div>
            <strong>${opponent.name}</strong>
            <small>${opponent.style} · ${opponent.lastMove}</small>
          </div>
          <span>${euro(opponentWorth(opponent))}</span>
        </article>
      `,
    )
    .join("");
}

function renderMeetupConnection() {
  const card = document.getElementById("meetup-card");
  const status = state.meetupConnected ? "Verbunden" : "Nicht verbunden";
  const detail = state.meetupConnected
    ? `${state.meetupEventsSynced} Meetup-Events fuer Boni und Clan-Aktivitaet synchronisiert.`
    : "Verbinde Meetup, um lokale Investor-Events als kleine In-Game-Boni zu synchronisieren.";
  const buttonLabel = state.meetupConnected ? "Meetup syncen" : "Connect with Meetup";
  card.innerHTML = `
    <div class="meetup-mark">M</div>
    <div class="meetup-copy">
      <div>
        <strong>Meetup</strong>
        <span class="meetup-status ${state.meetupConnected ? "connected" : ""}">${status}</span>
      </div>
      <p>${detail}</p>
    </div>
    <button data-action="connect-meetup">${buttonLabel}</button>
  `;
}

function applyTheme() {
  document.body.className = "";
  const theme = themeCatalog.find((item) => item.id === state.activeTheme);
  if (theme && theme.className) document.body.classList.add(theme.className);
}

function renderActiveTab() {
  document.querySelectorAll(".tab-page").forEach((page) => page.classList.remove("active"));
  document.querySelectorAll(".bottom-nav button").forEach((button) => button.classList.remove("active"));
  document.getElementById("tab-" + state.activeTab).classList.add("active");
  document.querySelector(`[data-tab="${state.activeTab}"]`).classList.add("active");
  document.getElementById("screen-title").textContent = {
    stocks: "Aktien",
    realestate: "Immobilien",
    etfs: "ETFs",
    shop: "Shop",
    profile: "Profil",
  }[state.activeTab];
}

function render() {
  updateWallet();
  renderRoundHud();
  renderActiveTab();
  renderStocks();
  renderEtfs();
  renderRules();
  renderProperties();
  renderEvents();
  renderShop();
  renderThemes();
  renderLeaderboard();
  renderOpponents();
  renderMeetupConnection();
  applyTheme();
  document.getElementById("premium-toggle").checked = state.premium;
  document.getElementById("push-toggle").checked = state.pushEnabled;
  saveState();
}

function buyAsset(assetId, silent = false) {
  const asset = getAsset(assetId);
  if (!asset) return false;
  if (state.cash < asset.price) {
    if (!silent) notify("Nicht genug Kapital", "Baue Cash durch Mieten, ETFs oder Daily Rewards auf.");
    return false;
  }
  state.cash -= asset.price;
  asset.owned += 1;
  addXp(8);
  if (!silent) notify("Kauf ausgefuehrt", `${asset.name} wurde ins Portfolio gelegt.`);
  return true;
}

function sellAsset(assetId, silent = false) {
  const asset = getAsset(assetId);
  if (!asset || asset.owned <= 0) {
    if (!silent) notify("Kein Bestand", "Dieses Asset ist aktuell nicht im Portfolio.");
    return false;
  }
  state.cash += asset.price;
  asset.owned -= 1;
  addXp(7);
  if (!silent) notify("Verkauf ausgefuehrt", `${asset.name} wurde verkauft.`);
  return true;
}

function moveMarket(forceCrash = false) {
  [...state.stocks, ...state.etfs].forEach((asset) => {
    asset.prev = asset.price;
    const shockChance = asset.volatility > 0.04 ? 0.08 : 0.03;
    const shock = forceCrash
      ? -0.22 - Math.random() * 0.18
      : Math.random() < shockChance
        ? (Math.random() > 0.5 ? 1 : -1) * (0.1 + Math.random() * 0.28)
        : 0;
    const drift = (Math.random() - 0.48) * asset.volatility;
    asset.price = Math.max(2, asset.price * (1 + drift + shock));

    const tickChange = ((asset.price - asset.prev) / asset.prev) * 100;
    if (Math.abs(tickChange) > 12) {
      notify(
        tickChange > 0 ? "Starke Kursbewegung" : "Crash-Signal",
        `${asset.name}: ${tickChange > 0 ? "+" : ""}${tickChange.toFixed(1)}%`,
        true,
      );
    }
  });
  runAutoTrader();
}

function advanceRound(forceCrash = false) {
  state.round += 1;
  moveMarket(forceCrash);
  simulateOpponents(forceCrash);
  addXp(forceCrash ? 4 : 2);
  state.roundLog = forceCrash
    ? `Runde ${state.round}: Crash-Runde erschuettert den Markt.`
    : `Runde ${state.round}: Markt, Gegner und Auto-Trader wurden simuliert.`;
  notify(forceCrash ? "Crash-Runde" : "Neue Runde", state.roundLog, forceCrash);
  render();
}

function simulateOpponents(forceCrash = false) {
  state.opponents.forEach((opponent) => {
    opponent.cash += 70 + Math.round(Math.random() * 90);
    const rankedStocks = [...state.stocks].sort((a, b) => {
      const changeA = (a.price - a.prev) / a.prev;
      const changeB = (b.price - b.prev) / b.prev;
      if (opponent.style === "Momentum") return changeB - changeA;
      if (opponent.style === "Dividende") return a.volatility - b.volatility;
      return b.volatility - a.volatility;
    });
    const target = rankedStocks[Math.floor(Math.random() * Math.min(4, rankedStocks.length))];
    if (!target) return;

    const owned = opponent.holdings[target.id] || 0;
    const shouldSell = owned > 0 && (forceCrash || Math.random() < 0.34);
    if (shouldSell) {
      const quantity = Math.max(1, Math.ceil(owned * 0.45));
      opponent.holdings[target.id] = owned - quantity;
      opponent.cash += quantity * target.price;
      opponent.lastMove = `${quantity}x ${target.symbol} verkauft`;
      return;
    }

    const maxQuantity = Math.min(3, Math.floor(opponent.cash / target.price));
    if (maxQuantity <= 0) {
      opponent.lastMove = "sammelt Cash";
      return;
    }

    const quantity = 1 + Math.floor(Math.random() * maxQuantity);
    opponent.cash -= quantity * target.price;
    opponent.holdings[target.id] = owned + quantity;
    opponent.lastMove = `${quantity}x ${target.symbol} gekauft`;
  });
}

function runAutoTrader() {
  state.rules
    .filter((rule) => rule.active)
    .forEach((rule) => {
      const asset = getAsset(rule.assetId);
      if (!asset) return;
      const anchor = rule.anchorPrice || asset.prev || asset.price;
      const move = ((asset.price - anchor) / anchor) * 100;
      const triggered =
        (rule.condition === "gain" && move >= rule.value) ||
        (rule.condition === "loss" && move <= -rule.value) ||
        (rule.condition === "above" && asset.price >= rule.value) ||
        (rule.condition === "below" && asset.price <= rule.value);

      if (!triggered) return;
      const success = rule.action === "buy" ? buyAsset(asset.id, true) : sellAsset(asset.id, true);
      rule.anchorPrice = asset.price;
      if (success) {
        notify(
          "Auto-Trader ausgeloest",
          `${asset.name}: Regel ${conditionLabel(rule)} hat ${rule.action === "buy" ? "gekauft" : "verkauft"}.`,
          true,
        );
      }
    });
}

function addRule() {
  const maxRules = state.premium ? 8 : 3;
  const activeRules = state.rules.filter((rule) => rule.active).length;
  const assetId = document.getElementById("rule-asset").value;
  const asset = getAsset(assetId);
  const rule = {
    id: "rule-" + Date.now(),
    assetId,
    condition: document.getElementById("rule-condition").value,
    value: Number(document.getElementById("rule-value").value || 1),
    action: document.getElementById("rule-action").value,
    active: activeRules < maxRules,
    anchorPrice: asset ? asset.price : 0,
  };
  state.rules.unshift(rule);
  notify("Regel angelegt", rule.active ? "Auto-Trader-Regel ist aktiv." : "Limit erreicht: Regel wurde pausiert angelegt.");
  render();
}

function toggleRule(ruleId, checked) {
  const maxRules = state.premium ? 8 : 3;
  const activeRules = state.rules.filter((rule) => rule.active).length;
  const rule = state.rules.find((item) => item.id === ruleId);
  if (!rule) return;
  if (checked && !rule.active && activeRules >= maxRules) {
    notify("Regel-Limit erreicht", "Premium-Spieler koennen mehr Regeln gleichzeitig aktivieren.");
    render();
    return;
  }
  const asset = getAsset(rule.assetId);
  rule.active = checked;
  rule.anchorPrice = asset ? asset.price : rule.anchorPrice;
  render();
}

function buyOrUpgradeProperty(id, upgrade = false) {
  const property = state.properties.find((item) => item.id === id);
  if (!property) return;
  const cost = upgrade ? Math.round(property.cost * 0.38 * property.level) : property.cost;
  if (state.cash < cost) {
    notify("Nicht genug Kapital", "Immobilien brauchen Geduld und stabile Cashflows.");
    return;
  }
  state.cash -= cost;
  property.owned = true;
  if (upgrade) property.level += 1;
  addXp(upgrade ? 18 : 28);
  notify(upgrade ? "Immobilie verbessert" : "Immobilie gekauft", `${property.name} generiert jetzt hoehere Miete.`, true);
  render();
}

function paintProperty(id) {
  const property = state.properties.find((item) => item.id === id);
  if (!property || !property.owned) {
    notify("Erst kaufen", "Farben koennen nur auf eigene Immobilien angewendet werden.");
    return;
  }
  const options = [
    { name: "Graphite", color: "#d8dde4", cost: 120, type: "cash" },
    { name: "Diamond Blue", color: "#d7f7ff", cost: 18, type: "gems" },
    { name: "Event Gold", color: "#ead6a4", cost: 0, type: "event" },
  ];
  const option = options[Math.floor(Math.random() * options.length)];
  if (option.type === "cash" && state.cash < option.cost) return notify("Nicht genug EUR", "Normale Farben kosten Euro.");
  if (option.type === "gems" && state.gems < option.cost) return notify("Nicht genug Diamanten", "Seltene Farben kosten Diamanten.");
  if (option.type === "cash") state.cash -= option.cost;
  if (option.type === "gems") state.gems -= option.cost;
  property.paint = option.color;
  property.paintName = option.name;
  addXp(10);
  notify("Farbe angewendet", `${property.name} nutzt jetzt ${option.name}.`);
  render();
}

function collectRent() {
  if (state.rentCollectedRound === state.round) {
    notify("Miete bereits eingezogen", "Starte die naechste Runde, um wieder Miete zu erhalten.");
    render();
    return;
  }
  const rent = state.properties.reduce((total, property) => {
    if (!property.owned) return total;
    return total + Math.round(property.rent * property.level * paintBonus(property.paintName));
  }, 0);
  state.cash += rent;
  state.rentCollectedRound = state.round;
  addXp(12);
  notify("Miete eingegangen", `${euro(rent)} wurden deinem Konto gutgeschrieben.`, true);
  render();
}

function claimDaily() {
  const cashReward = 120 + Math.round(Math.random() * 260);
  const gemReward = Math.random() < 0.38 ? 1 + Math.floor(Math.random() * 4) : 0;
  state.cash += cashReward;
  state.gems += gemReward;
  addXp(16);
  notify("Daily Chance", `${euro(cashReward)}${gemReward ? " und " + gemReward + " Diamanten" : ""} erhalten.`, true);
  render();
}

function buyShopItem(name) {
  const item = shopItems.find((entry) => entry.name === name);
  if (!item) return;
  const price = dynamicPrice(item);
  if (item.priceType === "cash") {
    if (state.cash < price) return notify("Nicht genug EUR", "Dieses Item kann auch spaeter gekauft werden.");
    state.cash -= price;
  }
  if (item.priceType === "gems") {
    if (state.gems < price) return notify("Nicht genug Diamanten", "Diamanten gibt es auch durch Missionen, Events und Codes.");
    state.gems -= Math.round(price);
  }
  if (item.priceType === "real") {
    state.gems += 8;
    notify("Echtgeld-Kauf simuliert", "Im Prototyp wird kein echter Kauf ausgefuehrt; du erhaeltst 8 Bonus-Diamanten.");
  } else {
    addXp(10);
    notify("Shop-Kauf", `${item.name} wurde freigeschaltet.`);
  }
  render();
}

function onlineAction(action) {
  if (action === "send-cash") {
    const amount = Math.min(100, Math.floor(state.cash * 0.08));
    state.cash -= amount;
    addXp(8);
    notify("Geld gesendet", `${euro(amount)} an einen Clan-Kontakt ueberwiesen.`);
  }
  if (action === "trade-item") {
    state.gems += 2;
    addXp(9);
    notify("Tausch abgeschlossen", "Ein seltenes Kosmetik-Item wurde gegen 2 Diamanten getauscht.");
  }
  if (action === "risk-steal") {
    const success = Math.random() > 0.46;
    const amount = 90 + Math.round(Math.random() * 180);
    state.cash += success ? amount : -Math.min(state.cash, amount);
    addXp(success ? 12 : 4);
    notify(success ? "Coup gelungen" : "Coup gescheitert", success ? `${euro(amount)} erbeutet.` : `${euro(amount)} Strafe gezahlt.`, true);
  }
  if (action === "join-clan") {
    state.cash += 160;
    addXp(14);
    notify("Clan Bonus", "Dein Clan zahlt einen kleinen Wochenbonus.");
  }
  render();
}

function connectMeetup() {
  if (!state.meetupConnected) {
    state.meetupConnected = true;
    state.meetupEventsSynced = 3;
    state.gems += 3;
    state.cash += 180;
    addXp(18);
    notify("Meetup verbunden", "3 lokale Events synchronisiert: 180 EUR und 3 Diamanten erhalten.", true);
    render();
    return;
  }

  state.meetupEventsSynced += 1;
  state.cash += 60;
  addXp(6);
  notify("Meetup aktualisiert", "Ein neues Event wurde mit deinem Clan-Feed synchronisiert.");
  render();
}

document.querySelector(".bottom-nav").addEventListener("click", (event) => {
  const button = event.target.closest("[data-tab]");
  if (!button) return;
  state.activeTab = button.dataset.tab;
  render();
});

document.body.addEventListener("click", (event) => {
  const target = event.target.closest(
    "[data-action], #next-round, #simulate-crash, #collect-rent, #claim-daily, #add-rule, #send-cash, #trade-item, #risk-steal, #join-clan",
  );
  if (!target) return;

  if (target.id === "next-round") return advanceRound(false);
  if (target.id === "simulate-crash") return advanceRound(true);
  if (target.id === "collect-rent") return collectRent();
  if (target.id === "claim-daily") return claimDaily();
  if (target.id === "add-rule") return addRule();
  if (["send-cash", "trade-item", "risk-steal", "join-clan"].includes(target.id)) return onlineAction(target.id);

  const { action, id, category, name } = target.dataset;
  if (action === "buy-asset") buyAsset(id);
  if (action === "sell-asset") sellAsset(id);
  if (action === "buy-property") buyOrUpgradeProperty(id, false);
  if (action === "upgrade-property") buyOrUpgradeProperty(id, true);
  if (action === "paint-property") paintProperty(id);
  if (action === "connect-meetup") connectMeetup();
  if (action === "shop-category") {
    state.selectedShopCategory = category;
    render();
  }
  if (action === "buy-shop") buyShopItem(name);
  if (action === "theme") {
    const theme = themeCatalog.find((entry) => entry.id === id);
    if (!theme) return;
    state.activeTheme = theme.id;
    if (!state.ownedThemes.includes(theme.id)) state.ownedThemes.push(theme.id);
    notify("Design Edition aktiviert", `${theme.name} passt das gesamte UI an.`);
    render();
  }
});

document.body.addEventListener("change", async (event) => {
  const target = event.target;
  if (target.id === "premium-toggle") {
    state.premium = target.checked;
    notify("Premium-Modus", state.premium ? "Mehr Auto-Trader-Regeln sind aktivierbar." : "Premium-Komfort deaktiviert.");
    render();
  }
  if (target.id === "push-toggle") {
    state.pushEnabled = target.checked;
    if (state.pushEnabled && "Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
    notify("Push-Benachrichtigungen", state.pushEnabled ? "Optionale Meldungen sind aktiv." : "Push ist deaktiviert.");
    render();
  }
  if (target.dataset.action === "toggle-rule") {
    toggleRule(target.dataset.id, target.checked);
  }
});

render();
