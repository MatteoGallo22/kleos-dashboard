// Frontend/js/pages/users_overview.js
import { escapeHtml } from "../utils.js";

// Tracks global listeners so they can be cleaned up on re-mount
let _overviewAbort = null;

// ---- Mock users (poi li colleghi a /api/users) ----
const USERS = [
  { clientId: "U001", email: "alice.rossi@kleos.app", mobile: "+39 333 111 2222", platform: "iOS", status: "verified", country: "Italy", signupDate: "2025-08-29" },
  { clientId: "U002", email: "bruno.verdi@kleos.app", mobile: "+39 333 222 3333", platform: "Android", status: "verified", country: "Italy", signupDate: "2025-09-10" },
  { clientId: "U003", email: "chiara.bianchi@kleos.app", mobile: "+39 333 444 5555", platform: "Web", status: "pending", country: "United Kingdom", signupDate: "2025-09-17" },
  { clientId: "U004", email: "diego.neri@kleos.app", mobile: "+44 7700 900123", platform: "iOS", status: "rejected", country: "United Kingdom", signupDate: "2025-09-24" },
  { clientId: "U005", email: "elisa.gallo@kleos.app", mobile: "+1 (415) 555-0123", platform: "Android", status: "verified", country: "United States", signupDate: "2025-10-01" },
  { clientId: "U006", email: "fabio.conte@kleos.app", mobile: "+1 (212) 555-0199", platform: "Web", status: "pending", country: "United States", signupDate: "2025-10-06" },
];

// ---- Helpers ----
function normalizeStatus(s) {
  const x = (s || "").toLowerCase();
  if (x === "verified") return "verified";
  if (x === "pending") return "pending";
  if (x === "rejected") return "rejected";
  return "pending";
}
function statusLabel(s) {
  if (s === "verified") return "Verified";
  if (s === "pending") return "Pending";
  if (s === "rejected") return "Rejected";
  return s;
}
function statusPillDotClass(s) {
  if (s === "verified") return "good";
  if (s === "pending") return "warn";
  if (s === "rejected") return "bad";
  return "warn";
}
function countByStatus(users) {
  const out = { verified: 0, pending: 0, rejected: 0 };
  users.forEach((u) => (out[normalizeStatus(u.status)] += 1));
  return out;
}
function groupByCountry(users) {
  const m = new Map();
  users.forEach((u) => {
    const c = u.country || "Unknown";
    if (!m.has(c)) m.set(c, []);
    m.get(c).push(u);
  });
  return m;
}

// ---- Growth series ----
function buildGrowthSeries(users, mode, fromISO, toISO) {
  const sorted = [...users].sort((a, b) => a.signupDate.localeCompare(b.signupDate));
  if (!sorted.length) return { labels: [], values: [] };

  const minDate = sorted[0].signupDate;
  const maxDate = sorted[sorted.length - 1].signupDate;

  const from = fromISO || minDate;
  const to = toISO || maxDate;

  const inRange = sorted.filter((u) => u.signupDate >= from && u.signupDate <= to);

  const keyFn =
    mode === "yearly" ? (d) => d.slice(0, 4)
    : mode === "monthly" ? (d) => d.slice(0, 7)
    : (d) => d;

  const bucket = new Map();
  inRange.forEach((u) => {
    const k = keyFn(u.signupDate);
    bucket.set(k, (bucket.get(k) || 0) + 1);
  });

  const labels = Array.from(bucket.keys()).sort();
  let acc = 0;
  const values = labels.map((k) => (acc += (bucket.get(k) || 0)));

  return { labels, values };
}

// ---- Small SVG charts (RIDOTTI) ----
function lineChartSvg(labels, values) {
  // Ridotto: prima era enorme; ora è compatto
  const W = 440;
  const H = 170;
  const padL = 42, padR = 12, padT = 12, padB = 34;

  const iw = W - padL - padR;
  const ih = H - padT - padB;

  const maxY = Math.max(...values, 1);
  const n = Math.max(values.length, 1);

  const x = (i) => padL + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v) => padT + ih - (v / maxY) * ih;

  const pts = values.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  const yTicks = 3;
  const yLines = Array.from({ length: yTicks + 1 }).map((_, i) => {
    const v = Math.round((maxY * (yTicks - i)) / yTicks);
    const yy = y(v);
    return `
      <line x1="${padL}" y1="${yy}" x2="${W - padR}" y2="${yy}" class="lc-grid" />
      <text x="${padL - 10}" y="${yy + 4}" text-anchor="end" class="lc-axis">${v}</text>
    `;
  }).join("");

  const xLabels = labels.map((lab, i) => {
    if (labels.length > 8 && i % 2 === 1) return "";
    const xx = x(i);
    return `<text x="${xx}" y="${H - 10}" text-anchor="middle" class="lc-axis">${lab}</text>`;
  }).join("");

  return `
    <svg class="uo-chart" viewBox="0 0 ${W} ${H}" aria-label="User growth chart">
      ${yLines}
      <line x1="${padL}" y1="${padT}" x2="${padL}" y2="${H - padB}" class="lc-axisline" />
      <line x1="${padL}" y1="${H - padB}" x2="${W - padR}" y2="${H - padB}" class="lc-axisline" />
      <polyline points="${pts}" class="lc-line" fill="none" />
      ${values.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="2.6" class="lc-dot" />`).join("")}
      ${xLabels}
    </svg>
  `;
}

function pieChartSvg(verified, pending, rejected) {
  // Ridotto e più "card-like"
  const values = [
    { label: "Verified", value: verified, cls: "good" },
    { label: "Pending", value: pending, cls: "warn" },
    { label: "Rejected", value: rejected, cls: "bad" },
  ];
  const total = values.reduce((a, b) => a + b.value, 0) || 1;

  const cx = 60, cy = 60, r = 36;
  let acc = 0;

  const segs = values.map((v) => {
    const frac = v.value / total;
    const dash = frac * 2 * Math.PI * r;
    const gap = 2 * Math.PI * r - dash;
    const start = acc;
    acc += dash;
    return `
      <circle class="pie-seg ${v.cls}"
        cx="${cx}" cy="${cy}" r="${r}"
        stroke-dasharray="${dash} ${gap}"
        stroke-dashoffset="${-start}"
      />
    `;
  }).join("");

  const legend = values.map((v) => `
    <div class="legend-row">
      <span class="pill"><span class="dot ${v.cls}"></span>${v.label}: <b>${v.value}</b></span>
    </div>
  `).join("");

  return `
    <div class="uo-pie">
      <svg class="uo-pie-svg" viewBox="0 0 120 120" aria-label="KYC status pie">
        <circle cx="${cx}" cy="${cy}" r="${r}" class="donut-bg" />
        ${segs}
        <text x="${cx}" y="${cy - 1}" text-anchor="middle" class="donut-t">${total}</text>
        <text x="${cx}" y="${cy + 12}" text-anchor="middle" class="donut-s">Users</text>
      </svg>
      <div class="legend">${legend}</div>
    </div>
  `;
}

// ---- REAL-ish world map (SVG continents) + pins ----
// Pin positions (mercator-like on our viewBox)
const COUNTRY_POINTS = [
  { country: "United States", x: 165, y: 150 },
  { country: "United Kingdom", x: 310, y: 110 },
  { country: "Italy", x: 330, y: 135 },
];

// Continents are stylized paths (not perfect, but it IS a world map)
function worldMapSvg(countriesMap) {
  const W = 560, H = 260;

  const pins = COUNTRY_POINTS.map((p) => {
    const count = countriesMap.get(p.country)?.length || 0;
    const r = Math.max(5, Math.min(14, 5 + count * 3));
    return `
      <g class="map-pin" data-country="${p.country}" tabindex="0" role="button" aria-label="Open ${p.country}">
        <circle cx="${p.x}" cy="${p.y}" r="${r}" class="mp-circle"></circle>
        <circle cx="${p.x}" cy="${p.y}" r="${Math.max(2, r - 4)}" class="mp-core"></circle>
        <text x="${p.x}" y="${p.y - r - 7}" text-anchor="middle" class="mp-label">${p.country}</text>
        <text x="${p.x}" y="${p.y + 4}" text-anchor="middle" class="mp-count">${count}</text>
      </g>
    `;
  }).join("");

  return `
    <svg class="uo-map" viewBox="0 0 ${W} ${H}" aria-label="World map users">
      <rect x="0" y="0" width="${W}" height="${H}" rx="16" class="map-bg" />

      <!-- North America -->
      <path class="map-land" d="M72,96 C105,64 142,58 170,70 C198,82 214,98 236,110
                               C252,120 260,140 250,156 C240,172 214,178 194,176
                               C170,174 156,188 130,190 C102,192 78,178 66,160
                               C54,142 52,114 72,96 Z"/>
      <!-- South America -->
      <path class="map-land" d="M210,170 C222,162 236,166 244,176 C254,188 252,202 246,214
                               C240,226 234,238 226,242 C214,248 202,240 202,228
                               C202,208 198,186 210,170 Z"/>
      <!-- Europe -->
      <path class="map-land" d="M286,92 C304,76 326,76 342,84 C356,90 368,100 364,112
                               C360,124 342,130 330,130 C314,130 300,120 292,112
                               C284,104 278,100 286,92 Z"/>
      <!-- Africa -->
      <path class="map-land" d="M330,138 C350,132 370,146 378,164 C386,182 378,204 366,220
                               C354,236 334,236 324,220 C314,204 308,186 314,168
                               C320,150 314,144 330,138 Z"/>
      <!-- Asia -->
      <path class="map-land" d="M360,92 C394,62 438,62 472,80 C504,96 520,118 510,140
                               C500,162 468,170 446,166 C420,162 404,176 378,176
                               C356,176 350,160 346,142 C342,124 340,106 360,92 Z"/>
      <!-- Australia -->
      <path class="map-land" d="M452,196 C468,190 488,196 498,208 C508,220 498,236 482,242
                               C466,248 446,240 440,226 C434,212 438,202 452,196 Z"/>

      ${pins}
    </svg>
  `;
}

// ---- Users table ----
function usersTable(users) {
  return `
    <table class="table" aria-label="Users table">
      <thead>
        <tr>
          <th>Client ID</th>
          <th>Email</th>
          <th>Mobile</th>
          <th>Platform</th>
          <th>Status</th>
          <th style="width:120px">Action</th>
        </tr>
      </thead>
      <tbody>
        ${users.map((u) => {
          const s = normalizeStatus(u.status);
          const dot = statusPillDotClass(s);
          return `
            <tr>
              <td><b>${escapeHtml(u.clientId)}</b></td>
              <td>${escapeHtml(u.email)}</td>
              <td>${escapeHtml(u.mobile)}</td>
              <td>${escapeHtml(u.platform)}</td>
              <td><span class="pill"><span class="dot ${dot}"></span>${statusLabel(s)}</span></td>
              <td>
                <button class="btn" type="button" data-action="openUser" data-client-id="${escapeHtml(u.clientId)}">
                  View
                </button>
              </td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

// ---- Page render ----
export function renderUsersOverviewPage() {
  const status = countByStatus(USERS);
  const countries = groupByCountry(USERS);
  const series = buildGrowthSeries(USERS, "daily");

  return `
    <div class="grid users-overview-grid">

      <!-- Row 1: Growth (left) + KYC pie (right) -->
      <section class="card xlarge uo-growth">
        <div class="uo-head">
          <div>
            <h3 style="margin:0">User Growth <span class="hint">Time series</span></h3>
            <div class="muted" style="margin-top:6px">Crescita cumulativa utenti nel periodo selezionato.</div>
          </div>

          <div class="tabs" role="tablist" aria-label="Growth mode">
            <button class="tab active" data-growth="daily" type="button">Daily</button>
            <button class="tab" data-growth="monthly" type="button">Monthly</button>
            <button class="tab" data-growth="yearly" type="button">Yearly</button>
            <button class="tab" data-growth="custom" type="button">Da / A</button>
          </div>
        </div>

        <div id="customRange" class="uo-range" style="display:none">
          <div class="chip uo-chip">
            <span>Da</span>
            <input id="fromDate" type="date" />
          </div>
          <div class="chip uo-chip">
            <span>A</span>
            <input id="toDate" type="date" />
          </div>
          <button class="btn" id="applyRange" type="button">Apply</button>
        </div>

        <div id="growthChart" class="uo-chart-wrap">
          ${lineChartSvg(series.labels, series.values)}
        </div>
      </section>

      <section class="card xlarge uo-kyc">
        <h3 style="margin:0">KYC Status <span class="hint">Verified · Pending · Rejected</span></h3>
        <div style="margin-top:10px">
          ${pieChartSvg(status.verified, status.pending, status.rejected)}
        </div>
      </section>

      <!-- Row 2: Map -->
      <section class="card xlarge uo-map-card">
        <div class="uo-head">
          <div>
            <h3 style="margin:0">Users by Country <span class="hint">Map</span></h3>
            <div class="muted" style="margin-top:6px">Clicca un paese per vedere gli utenti iscritti.</div>
          </div>
          <div class="pill">
            <span class="dot good"></span>
            <span id="selectedCountryLabel">No country selected</span>
          </div>
        </div>

        <div style="margin-top:12px">
          <div id="worldMap">
            ${worldMapSvg(countries)}
          </div>
          <div id="countryDetails" style="margin-top:12px"></div>
        </div>
      </section>

      <!-- Row 3: Users directory -->
      <section class="card xlarge">
        <h3 style="margin:0">Users <span class="hint">Directory</span></h3>
        <div id="usersTableWrap" style="margin-top:10px">
          ${usersTable(USERS)}
        </div>
      </section>
    </div>

    <!-- Modal -->
    <div id="modalOverlay" class="modal-overlay" style="display:none">
      <div class="modal">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
          <div>
            <div style="font-weight:700" id="modalTitle">User</div>
            <div class="muted" id="modalSubtitle" style="margin-top:4px">Details</div>
          </div>
          <button class="btn" id="modalClose" type="button">✕</button>
        </div>

        <div id="modalBody" style="margin-top:12px"></div>
      </div>
    </div>

  `;
}

// ---- Mount interactions ----
export function mountUsersOverviewPageInteractions() {
  // Growth tabs
  const tabs = Array.from(document.querySelectorAll("[data-growth]"));
  const growthChart = document.getElementById("growthChart");
  const customRange = document.getElementById("customRange");
  const fromDate = document.getElementById("fromDate");
  const toDate = document.getElementById("toDate");
  const applyRange = document.getElementById("applyRange");

  function renderGrowth(mode, fromISO, toISO) {
    const series = buildGrowthSeries(USERS, mode, fromISO, toISO);
    growthChart.innerHTML = lineChartSvg(series.labels, series.values);
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.remove("active"));
      t.classList.add("active");

      const mode = t.dataset.growth;
      if (mode === "custom") {
        customRange.style.display = "flex";
      } else {
        customRange.style.display = "none";
        renderGrowth(mode);
      }
    });
  });

  if (applyRange) {
    applyRange.addEventListener("click", () => {
      renderGrowth("daily", fromDate?.value || undefined, toDate?.value || undefined);
    });
  }

  // Country map click
  const selectedCountryLabel = document.getElementById("selectedCountryLabel");
  const countryDetails = document.getElementById("countryDetails");
  const countries = groupByCountry(USERS);

  function renderCountryDetails(country) {
    const list = countries.get(country) || [];
    selectedCountryLabel.textContent = `${country} · ${list.length} users`;

    countryDetails.innerHTML = `
      <div class="card" style="margin:0">
        <h3 style="margin:0">Users in ${escapeHtml(country)} <span class="hint">List</span></h3>
        <div style="margin-top:10px">
          ${
            list.length
              ? `
            <table class="table">
              <thead>
                <tr><th>Client ID</th><th>Email</th><th>Status</th><th>Signup</th><th style="width:120px">Action</th></tr>
              </thead>
              <tbody>
                ${list
                  .map((u) => {
                    const s = normalizeStatus(u.status);
                    return `
                      <tr>
                        <td><b>${escapeHtml(u.clientId)}</b></td>
                        <td>${escapeHtml(u.email)}</td>
                        <td><span class="pill"><span class="dot ${statusPillDotClass(s)}"></span>${statusLabel(s)}</span></td>
                        <td>${escapeHtml(u.signupDate)}</td>
                        <td><button class="btn" type="button" data-action="openUser" data-client-id="${escapeHtml(u.clientId)}">View</button></td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
            </table>
          `
              : `<div class="muted">Nessun utente per questo paese.</div>`
          }
        </div>
      </div>
    `;
  }

  document.querySelectorAll(".map-pin").forEach((g) => {
    const handler = () => {
      const c = g.getAttribute("data-country");
      if (c) renderCountryDetails(c);
    };
    g.addEventListener("click", handler);
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handler();
      }
    });
  });

  // Modal logic
  const overlay = document.getElementById("modalOverlay");
  const modalClose = document.getElementById("modalClose");
  const modalTitle = document.getElementById("modalTitle");
  const modalSubtitle = document.getElementById("modalSubtitle");
  const modalBody = document.getElementById("modalBody");

  function openUser(clientId) {
    const u = USERS.find((x) => x.clientId === clientId);
    if (!u) return;
    const s = normalizeStatus(u.status);

    modalTitle.textContent = `User ${u.clientId}`;
    modalSubtitle.textContent = `${u.email}`;
    modalBody.innerHTML = `
      <div class="split">
        <div class="kv"><div class="k">Client ID</div><div class="val">${escapeHtml(u.clientId)}</div></div>
        <div class="kv"><div class="k">Status</div><div class="val"><span class="pill"><span class="dot ${statusPillDotClass(s)}"></span>${statusLabel(s)}</span></div></div>
        <div class="kv"><div class="k">Mobile</div><div class="val">${escapeHtml(u.mobile)}</div></div>
        <div class="kv"><div class="k">Platform</div><div class="val">${escapeHtml(u.platform)}</div></div>
        <div class="kv"><div class="k">Country</div><div class="val">${escapeHtml(u.country)}</div></div>
        <div class="kv"><div class="k">Signup date</div><div class="val">${escapeHtml(u.signupDate)}</div></div>
      </div>
    `;
    overlay.style.display = "flex";
  }

  function closeModal() {
    overlay.style.display = "none";
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (overlay) overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });

  // Use AbortController so these global listeners are removed on next page navigation
  if (_overviewAbort) _overviewAbort.abort();
  _overviewAbort = new AbortController();
  const { signal } = _overviewAbort;

  window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModal(); }, { signal });

  // Delegated action buttons (scoped to content area, cleaned up via signal)
  document.getElementById("content")?.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("[data-action='openUser']");
    if (!btn) return;
    const id = btn.getAttribute("data-client-id");
    if (id) openUser(id);
  }, { signal });
}
