// Frontend/js/pages/users.js
import { escapeHtml, fmtEUR } from "../utils.js";

// Mock data (poi lo collegherai a /api/users)
const USERS = [
  { code: "U006", fullName: "Fabio Conte",  planId: "C-002", plan: "Platinum",   depositedAmountEur: 12000, currency: "USDC", date: "2025-10-06" },
  { code: "U005", fullName: "Elisa Gallo",  planId: "C-001", plan: "Platinum",   depositedAmountEur: 22000, currency: "USDC", date: "2025-10-01" },
  { code: "U004", fullName: "Diego Neri",   planId: "B-002", plan: "Premium",    depositedAmountEur: 5000,  currency: "USDC", date: "2025-09-24" },
  { code: "U003", fullName: "Chiara Bianchi",planId: "B-001", plan: "Premium",   depositedAmountEur: 15000, currency: "USDC", date: "2025-09-17" },
  { code: "U002", fullName: "Bruno Verdi",  planId: "A-002", plan: "Smart Yield",depositedAmountEur: 7500,  currency: "USDC", date: "2025-09-10" },
  { code: "U001", fullName: "Alice Rossi",  planId: "A-001", plan: "Smart Yield",depositedAmountEur: 10000, currency: "USDC", date: "2025-08-29" },
];

function groupSumByPlan(users) {
  const out = { "Smart Yield": 0, Premium: 0, Platinum: 0 };
  users.forEach((u) => (out[u.plan] = (out[u.plan] || 0) + Number(u.depositedAmountEur || 0)));
  return out;
}

function donutSvg(values) {
  // values: [{label, value}]
  const total = values.reduce((a, b) => a + Number(b.value || 0), 0) || 1;
  const cx = 70, cy = 70, r = 42;
  let acc = 0;

  const segments = values
    .map((v) => {
      const frac = Number(v.value || 0) / total;
      const dash = frac * 2 * Math.PI * r;
      const gap = 2 * Math.PI * r - dash;
      const start = acc;
      acc += dash;

      return `
        <circle class="donut-seg"
          cx="${cx}" cy="${cy}" r="${r}"
          stroke-dasharray="${dash} ${gap}"
          stroke-dashoffset="${-start}"
        />
      `;
    })
    .join("");

  const legend = values
    .map(
      (v) => `
      <div class="legend-row">
        <span class="legend-dot"></span>
        <span class="legend-label">${escapeHtml(v.label)}</span>
        <span class="legend-val">${fmtEUR(v.value)}</span>
      </div>
    `
    )
    .join("");

  return `
    <div class="donut-wrap">
      <svg width="160" height="160" viewBox="0 0 140 140" aria-label="NAV breakdown donut">
        <circle cx="${cx}" cy="${cy}" r="${r}" class="donut-bg" />
        ${segments}
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" class="donut-t">${fmtEUR(total)}</text>
        <text x="${cx}" y="${cy + 14}" text-anchor="middle" class="donut-s">Total AuA</text>
      </svg>

      <div class="legend">
        ${legend}
      </div>
    </div>
  `;
}

function barAuAStrategy(sumByPlan) {
  const labels = ["Smart Yield", "Premium", "Platinum"];
  const vals = labels.map((k) => Number(sumByPlan[k] || 0));
  const max = Math.max(...vals, 1);

  return `
    <div class="bars">
      ${labels
        .map((lab, i) => {
          const pct = Math.round((vals[i] / max) * 100);
          return `
            <div class="bar-row">
              <div class="bar-name">${escapeHtml(lab)}</div>
              <div class="bar-track">
                <div class="bar-fill" style="width:${pct}%"></div>
              </div>
              <div class="bar-val">${fmtEUR(vals[i])}</div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function revenueBreakdown(sumByPlan) {
  const total = Object.values(sumByPlan).reduce((a, b) => a + Number(b || 0), 0);

  return `
    <div class="users-metrics">
      <div class="metric-card">
        <div class="metric-k">AUM (total)</div>
        <div class="metric-v">${fmtEUR(total)}</div>
        <div class="metric-s">Growth (total): 0.00%</div>
      </div>

      <div class="metric-card">
        <div class="metric-k">Redemption Requests</div>
        <div class="metric-v">0.00%</div>
        <div class="metric-s">% in range</div>
      </div>

      <div class="metric-card">
        <div class="metric-k">Mode</div>
        <div class="metric-v">Month</div>
        <div class="metric-s">2025-11-18 → 2025-12-15</div>
      </div>

      <div class="metric-card">
        <div class="metric-k">Totale per piano</div>

        <div class="metric-v">
          <span class="pill"><span class="dot good"></span>Smart Yield: ${fmtEUR(sumByPlan["Smart Yield"])}</span>
        </div>

        <div class="metric-v" style="margin-top:8px">
          <span class="pill"><span class="dot warn"></span>Premium: ${fmtEUR(sumByPlan["Premium"])}</span>
        </div>

        <div class="metric-v" style="margin-top:8px">
          <span class="pill"><span class="dot bad"></span>Platinum: ${fmtEUR(sumByPlan["Platinum"])}</span>
        </div>
      </div>
    </div>
  `;
}

function usersTable(users) {
  return `
    <table class="table" aria-label="Users table">
      <thead>
        <tr>
          <th>Code</th>
          <th>Full Name</th>
          <th>Plan ID</th>
          <th>Plan</th>
          <th>Deposited Amount</th>
          <th>Currency</th>
          <th>Date</th>
        </tr>
      </thead>
      <tbody>
        ${users
          .map(
            (u) => `
          <tr>
            <td><b>${escapeHtml(u.code)}</b></td>
            <td>${escapeHtml(u.fullName)}</td>
            <td>${escapeHtml(u.planId)}</td>
            <td>${escapeHtml(u.plan)}</td>
            <td>${fmtEUR(u.depositedAmountEur)}</td>
            <td>${escapeHtml(u.currency)}</td>
            <td>${escapeHtml(u.date)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

export function renderUsersPage() {
  const sum = groupSumByPlan(USERS);

  const donutValues = [
    { label: "Smart Yield", value: sum["Smart Yield"] },
    { label: "Premium", value: sum["Premium"] },
    { label: "Platinum", value: sum["Platinum"] },
  ];

  return `
    <div class="grid">
      <section class="card large">
        <h3>AuA by Strategy <span class="hint">Overview</span></h3>
        ${barAuAStrategy(sum)}
      </section>

      <section class="card large">
        <h3>NAV Breakdown <span class="hint">Plan</span></h3>
        ${donutSvg(donutValues)}
      </section>

      <section class="card xlarge">
        <h3>Revenue Breakdown <span class="hint">Users & AUM</span></h3>
        ${revenueBreakdown(sum)}
      </section>

      <section class="card xlarge">
        <div class="users-head">
          <h3 style="margin:0">Users <span class="hint">List</span></h3>

          <div class="users-controls">
            <input id="usersSearch" class="users-search" placeholder="Search name..." />
            <div class="tabs" role="tablist" aria-label="Plan filters">
              <button class="tab active" data-plan="ALL" type="button">All Plans</button>
              <button class="tab" data-plan="Smart Yield" type="button">Smart Yield</button>
              <button class="tab" data-plan="Premium" type="button">Premium</button>
              <button class="tab" data-plan="Platinum" type="button">Platinum</button>
            </div>
          </div>
        </div>

        <div id="usersTableWrap">
          ${usersTable(USERS)}
        </div>
      </section>
    </div>
  `;
}

export function mountUsersPageInteractions() {
  const tableWrap = document.getElementById("usersTableWrap");
  const search = document.getElementById("usersSearch");
  const tabs = Array.from(document.querySelectorAll(".tab"));

  if (!tableWrap || !search || tabs.length === 0) return;

  let currentPlan = "ALL";
  let query = "";

  function apply() {
    const q = query.trim().toLowerCase();

    const filtered = USERS.filter((u) => {
      const planOk = currentPlan === "ALL" ? true : u.plan === currentPlan;
      const searchOk = !q
        ? true
        : u.fullName.toLowerCase().includes(q) || u.code.toLowerCase().includes(q);
      return planOk && searchOk;
    });

    tableWrap.innerHTML = usersTable(filtered);
  }

  tabs.forEach((t) => {
    t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.remove("active"));
      t.classList.add("active");
      currentPlan = t.dataset.plan || "ALL";
      apply();
    });
  });

  search.addEventListener("input", (e) => {
    query = e.target.value || "";
    apply();
  });
}
