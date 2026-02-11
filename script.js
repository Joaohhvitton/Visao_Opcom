window.APP_CONFIG = {
  googleSheets: {
    sheetId: "1nc6XcUjsddOm7qxTm1O1tLuNn_vxxdFZzI9S4kZAWLc",
    apiKey: "AIzaSyD9PazDh8LE7O6m76ODALpX9swQgdafgs4",
    range: "Base!A:P"
  }
};

Chart.register(ChartDataLabels);

const loginBtn = document.getElementById("loginBtn");
const loginText = document.getElementById("loginText");
const loginError = document.getElementById("loginError");
const user = document.getElementById("user");
const pass = document.getElementById("pass");
const loginScreen = document.getElementById("loginScreen");
const welcomePopup = document.getElementById("welcomePopup");
const welcomeOkBtn = document.getElementById("welcomeOkBtn");
const logoutPopup = document.getElementById("logoutPopup");
const logoutCancelBtn = document.getElementById("logoutCancelBtn");
const logoutConfirmBtn = document.getElementById("logoutConfirmBtn");
const collaboratorBtn = document.getElementById("collaboratorBtn");
const collaboratorPopup = document.getElementById("collaboratorPopup");
const collaboratorCloseBtn = document.getElementById("collaboratorCloseBtn");
const collaboratorTickerTrack = document.getElementById("collaboratorTickerTrack");
const userBadge = document.getElementById("userBadge");
const themeBtn = document.getElementById("themeBtn");
const upload = document.getElementById("upload");
const squadFilter = document.getElementById("squadFilter");
const kpiTotal = document.getElementById("kpiTotal");
const kpiDone = document.getElementById("kpiDone");
const kpiBug = document.getElementById("kpiBug");

const USERS = {
  admin: { pass: "123", role: "admin" },
  teste: { pass: "123", role: "teste" }
};

function resolveGoogleSheetsConfig() {
  const fromNested = window.APP_CONFIG?.googleSheets;
  const fromRoot = window.APP_CONFIG;
  const fromAltGlobal = window.GOOGLE_SHEETS_CONFIG;

  const cfg = fromNested || fromAltGlobal || fromRoot || {};

  return {
    sheetId: cfg.sheetId || cfg.SHEET_ID || "1nc6XcUjsddOm7qxTm1O1tLuNn_vxxdFZzI9S4kZAWLc",
    apiKey: cfg.apiKey || cfg.API_KEY || "AIzaSyD9PazDh8LE7O6m76ODALpX9swQgdafgs4",
    range: cfg.range || cfg.SHEET_RANGE || "Base!A:P"
  };
}

const googleSheetsConfig = resolveGoogleSheetsConfig();
const SHEET_ID = googleSheetsConfig.sheetId;
const API_KEY = googleSheetsConfig.apiKey;
const SHEET_RANGE = googleSheetsConfig.range;

let base = [];
let dark = false;

const baseColor = "#530F0A";
const accent = "#ff6b57";

const COLLABORATOR_SQUADS = {
  "João Vitor": ["captura", "pix"],
  "Alyne": ["comercial"],
  "Keroleen": ["operações"],
  "Danilo": ["dados"]
};

const WELCOME_POPUP_KEY = "welcomePopupSeen";

function showWelcomePopup() {
  if (!welcomePopup || sessionStorage.getItem(WELCOME_POPUP_KEY)) return;
  welcomePopup.classList.remove("hidden");
}

function hideWelcomePopup() {
  if (!welcomePopup) return;
  welcomePopup.classList.add("hidden");
  sessionStorage.setItem(WELCOME_POPUP_KEY, "1");
}


/* LOGIN */

function doLogin() {
  loginError.innerText = "";
  loginBtn.classList.add("loading");
  loginText.innerText = "Validando...";

  setTimeout(async () => {
    try {
      const u = user.value.trim();
      const p = pass.value.trim();

      if (!USERS[u] || USERS[u].pass !== p) {
        loginBtn.classList.remove("loading");
        loginText.innerText = "Entrar";
        loginError.innerText = "Login inválido";
        return;
      }

      sessionStorage.setItem("role", USERS[u].role);
      sessionStorage.setItem("user", u);

      loginScreen.style.display = "none";
      applyRole();
      await loadGoogleSheetBase();
      showWelcomePopup();

      loginBtn.classList.remove("loading");
      loginText.innerText = "Entrar";
    } catch (err) {
      console.error("Erro no fluxo de login", err);
      loginBtn.classList.remove("loading");
      loginText.innerText = "Entrar";
      loginError.innerText = "Erro ao entrar. Tente novamente.";
      loginScreen.style.display = "flex";
    }
  }, 600);
}

function logout() {
  if (!logoutPopup) {
    sessionStorage.clear();
    location.reload();
    return;
  }
  logoutPopup.classList.remove("hidden");
}

function cancelLogout() {
  if (!logoutPopup) return;
  logoutPopup.classList.add("hidden");
}

function confirmLogout() {
  sessionStorage.clear();
  location.reload();
}

function openCollaboratorPopup() {
  if (!collaboratorPopup) return;
  renderCollaboratorCards(getFilteredData());
  collaboratorPopup.classList.remove("hidden");
}

function closeCollaboratorPopup() {
  if (!collaboratorPopup) return;
  collaboratorPopup.classList.add("hidden");
}

/* ROLE */

function applyRole() {
  const role = sessionStorage.getItem("role");
  userBadge.innerText = "👤 " + sessionStorage.getItem("user");
  upload.style.display = role === "admin" ? "block" : "none";
}

/* THEME */

function toggleTheme() {
  dark = !dark;
  document.body.classList.toggle("dark");
  themeBtn.innerText = dark ? "☀️" : "🌙";
}

/* GOOGLE SHEETS */

function buildGoogleSheetUrl(range = SHEET_RANGE) {
  return `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?key=${API_KEY}`;
}

async function fetchSheetRows(range) {
  const response = await fetch(buildGoogleSheetUrl(range));
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const apiMessage = payload?.error?.message || `HTTP ${response.status}`;
    throw new Error(apiMessage);
  }

  return payload.values || [];
}

function normalizeRows(headers, dataRows) {
  return dataRows.map(row => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index] || "";
    });
    return item;
  });
}

async function loadGoogleSheetBase() {
  if (!SHEET_ID || !API_KEY) {
    alert("Configuração do Google Sheets ausente. Verifique se config.js está publicado e carregado antes de script.js.");
    console.error("Google Sheets config inválida", { SHEET_ID, API_KEY, SHEET_RANGE });
    return;
  }

  try {
    let rows = [];

    try {
      rows = await fetchSheetRows(SHEET_RANGE);
    } catch (err) {
      const invalidRange = String(err.message || "").toLowerCase().includes("unable to parse range");
      if (!invalidRange || SHEET_RANGE === "A:P") {
        throw err;
      }
      rows = await fetchSheetRows("A:P");
    }

    if (rows.length < 2) {
      base = [];
      clearDashboard();
      return;
    }

    const [headers, ...dataRows] = rows;
    base = normalizeRows(headers, dataRows);

    buildFilter();
    render();
  } catch (err) {
    console.error(err);
    alert(`Não foi possível carregar dados do Google Sheets. Motivo: ${err.message}`);
  }
}

/* UPLOAD */

upload.onchange = e => {
  if (sessionStorage.getItem("role") !== "admin") {
    alert("Somente admin pode importar");
    return;
  }

  const file = e.target.files?.[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = evt => {
    const wb = XLSX.read(evt.target.result, { type: "binary" });
    base = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
    buildFilter();
    render();
  };
  reader.readAsBinaryString(file);
};

/* HELPERS */

function splitSquad(v) {
  if (!v) return [];
  return v.split(",").map(x => x.trim());
}

function count(col, data, multi = false) {
  const m = {};
  data.forEach(r => {
    const vals = multi ? splitSquad(r[col]) : [r[col]];
    vals.forEach(v => {
      if (!v) return;
      m[v] = (m[v] || 0) + 1;
    });
  });
  return m;
}

function getFilteredData() {
  if (!base.length) return [];

  return squadFilter.value === "Todos"
    ? base
    : base.filter(r => splitSquad(r["Squad/Team"]).includes(squadFilter.value));
}



function normalizeText(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSquadLabel(value) {
  return normalizeText(value)
    .replace(/\b(squad|team|time)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isCollaboratorSquad(squadLabel, collaboratorTargets) {
  const normalizedSquad = normalizeSquadLabel(squadLabel);
  return collaboratorTargets.some(target => {
    const normalizedTarget = normalizeSquadLabel(target);
    return normalizedSquad === normalizedTarget || normalizedSquad.includes(normalizedTarget);
  });
}

function renderCollaboratorCards(data) {
  const container = document.getElementById("collaboratorCards");
  if (!container) return;

  const totals = buildCollaboratorTotals(data);

  const cards = totals.map(({ name, total }) => {

    return `
      <div class="kpiCard">
        <div>Quantidade de Demanda ${name}</div>
        <div class="kpiValue">${total}</div>
      </div>
    `;
  });

  container.innerHTML = cards.join("");
}

function buildCollaboratorTotals(data) {
  const squadTotals = count("Squad/Team", data, true);

  return Object.entries(COLLABORATOR_SQUADS).map(([name, squads]) => {
    const total = Object.entries(squadTotals).reduce((acc, [squad, amount]) => {
      return acc + (isCollaboratorSquad(squad, squads) ? amount : 0);
    }, 0);

    return { name, total };
  });
}

function renderCollaboratorTicker(data) {
  if (!collaboratorTickerTrack) return;

  const totals = buildCollaboratorTotals(data);
  const message = totals
    .map(item => `${item.name}: ${item.total} demandas`)
    .join("   •   ");

  collaboratorTickerTrack.textContent = message || "Sem dados de demandas por colaborador.";
}

function resetChart(id) {
  const ctx = document.getElementById(id);
  if (ctx?.chart) {
    ctx.chart.destroy();
  }
}

function clearDashboard() {
  squadFilter.innerHTML = "<option>Todos</option>";
  kpiTotal.innerText = "0";
  kpiDone.innerText = "0";
  kpiBug.innerText = "0%";
  renderCollaboratorCards([]);
  renderCollaboratorTicker([]);
  ["squadChart", "statusChart", "tipoChart", "prioChart"].forEach(resetChart);
}

/* FILTER */

function buildFilter() {
  const s = new Set();
  base.forEach(r => splitSquad(r["Squad/Team"]).forEach(x => s.add(x)));
  squadFilter.innerHTML =
    "<option>Todos</option>" + [...s].map(x => `<option>${x}</option>`).join("");
}

squadFilter.onchange = () => {
  animateFilterRefresh();
  render();
};

function animateFilterRefresh() {
  document.querySelectorAll(".card,.kpiCard").forEach((el, i) => {
    el.classList.add("updating");
    setTimeout(() => el.classList.remove("updating"), 300 + i * 40);
  });
}

/* DRAW */

function draw(id, map) {
  const ctx = document.getElementById(id);
  if (ctx.chart) ctx.chart.destroy();

  const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const labels = entries.map(e => e[0]);
  const values = entries.map(e => e[1]);
  const max = Math.max(...values, 0);

  ctx.chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: values.map(v => (v === max ? accent : baseColor)),
        borderRadius: 15
      }]
    },
    options: {
      animation: { duration: 900 },
      plugins: {
        legend: { display: false },
        datalabels: { color: "#fff", font: { weight: "bold" } }
      },
      scales: { x: { grid: { display: false } }, y: { grid: { display: false } } }
    }
  });
}

/* RENDER */

function render() {
  if (!base.length) {
    clearDashboard();
    return;
  }

  const data = getFilteredData();

  const total = data.length;
  const done = data.filter(r => (r.Status || "").toLowerCase().includes("concl")).length;
  const bug = data.filter(r => (r.Tipo || "").toLowerCase().includes("bug")).length;

  kpiTotal.innerText = total;
  kpiDone.innerText = done;
  kpiBug.innerText = Math.round((bug / total) * 100 || 0) + "%";

  renderCollaboratorTicker(data);

  draw("squadChart", count("Squad/Team", data, true));
  draw("statusChart", count("Status", data));
  draw("tipoChart", count("Tipo", data));
  draw("prioChart", count("Prioridade", data));
}

/* AUTO LOAD */

window.onload = async () => {
  if (sessionStorage.getItem("role")) {
    loginScreen.style.display = "none";
    applyRole();
    await loadGoogleSheetBase();
    showWelcomePopup();
  }
};

if (welcomeOkBtn) {
  welcomeOkBtn.addEventListener("click", hideWelcomePopup);
}

if (welcomePopup) {
  welcomePopup.addEventListener("click", e => {
    if (e.target === welcomePopup) hideWelcomePopup();
  });
}

if (logoutCancelBtn) {
  logoutCancelBtn.addEventListener("click", cancelLogout);
}

if (logoutConfirmBtn) {
  logoutConfirmBtn.addEventListener("click", confirmLogout);
}

if (logoutPopup) {
  logoutPopup.addEventListener("click", e => {
    if (e.target === logoutPopup) cancelLogout();
  });
}


if (collaboratorBtn) {
  collaboratorBtn.addEventListener("click", openCollaboratorPopup);
}

if (collaboratorCloseBtn) {
  collaboratorCloseBtn.addEventListener("click", closeCollaboratorPopup);
}

if (collaboratorPopup) {
  collaboratorPopup.addEventListener("click", e => {
    if (e.target === collaboratorPopup) closeCollaboratorPopup();
  });
}

loginBtn.addEventListener("click", doLogin);

