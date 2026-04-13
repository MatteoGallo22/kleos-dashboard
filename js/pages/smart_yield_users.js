// Frontend/js/pages/smart_yield_users.js
import { escapeHtml, formatDate, normalizeUser } from "../utils.js";

export function renderSmartYieldUsersPage() {
  return `
    <div class="page">
      <div class="panel">
        <div class="panel-head">
          <h3>Smart Yield — Users</h3>
          <p class="muted">Elenco utenti e dettagli piano Smart Yield.</p>
        </div>

        <div class="panel-body">
          <div style="display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap;">
            <input id="syUsersSearch" class="input" placeholder="Search user..." style="max-width:320px;" />
            <div style="display:flex; gap:8px;">
              <button id="syUsersRefresh" class="btn">🔄 Refresh</button>
              <button id="syUsersExport" class="btn">⬇️ Export</button>
            </div>
          </div>

          <div style="height:14px;"></div>

          <div class="table-wrap">
            <table class="table">
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
              <tbody id="syUsersTbody">
                <tr>
                  <td colspan="7" class="muted">Caricamento…</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div id="syUsersEmpty" class="muted" style="display:none; padding:14px 0;">
            Nessun utente trovato.
          </div>
        </div>
      </div>
    </div>
  `;
}

export function mountSmartYieldUsersPageInteractions() {
  const tbody = document.getElementById("syUsersTbody");
  const empty = document.getElementById("syUsersEmpty");
  const input = document.getElementById("syUsersSearch");
  const btnRefresh = document.getElementById("syUsersRefresh");
  const btnExport = document.getElementById("syUsersExport");

  // fallback: prova a leggere dai mock se esistono
  // (adatta questo blocco quando colleghi API reali)
  const getRows = () => {
    const data = (window.__MOCK__ && window.__MOCK__.users) || window.mockUsers || [];
    return Array.isArray(data) ? data : [];
  };

  const renderRows = (rows) => {
    if (!tbody) return;

    if (!rows || rows.length === 0) {
      tbody.innerHTML = "";
      if (empty) empty.style.display = "block";
      return;
    }
    if (empty) empty.style.display = "none";

    tbody.innerHTML = rows
      .map((raw) => {
        const u = normalizeUser(raw);
        return `
          <tr>
            <td>${escapeHtml(u.code)}</td>
            <td>${escapeHtml(u.fullName)}</td>
            <td>${escapeHtml(u.planId)}</td>
            <td>${escapeHtml(u.plan)}</td>
            <td>${typeof u.deposited === "number" ? u.deposited.toLocaleString(undefined, { maximumFractionDigits: 2 }) : escapeHtml(u.deposited)}</td>
            <td>${escapeHtml(u.currency)}</td>
            <td>${formatDate(u.date)}</td>
          </tr>
        `;
      })
      .join("");
  };

  const applyFilter = () => {
    const q = (input?.value || "").trim().toLowerCase();
    const rows = getRows();
    if (!q) return renderRows(rows);

    const filtered = rows.filter((u) => JSON.stringify(u).toLowerCase().includes(q));
    renderRows(filtered);
  };

  // init
  renderRows(getRows());

  input?.addEventListener("input", applyFilter);

  btnRefresh?.addEventListener("click", () => {
    renderRows(getRows());
    applyFilter();
  });

  btnExport?.addEventListener("click", () => {
    alert("Export Users (demo): collega qui la generazione CSV.");
  });
}
