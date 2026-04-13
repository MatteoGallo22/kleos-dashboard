// Frontend/js/pages/smart_yield_reconciliation.js
import { escapeHtml, formatDate, formatMoney, formatPercent, normalizeReconciliationRow } from “../utils.js”;

export function renderSmartYieldReconciliationPage() {
  return `
    <div class="page">
      <div class="panel">
        <div class="panel-head">
          <h3>Smart Yield — Reconciliation</h3>
          <p class="muted">Riconciliazione utenti: depositi, profitti e net profit.</p>
        </div>

        <div class="panel-body">
          <div style="display:flex; gap:12px; align-items:center; justify-content:space-between; flex-wrap:wrap;">
            <input id="syRecSearch" class="input" placeholder="Search..." style="max-width:320px;" />
            <div style="display:flex; gap:8px;">
              <button id="syRecRefresh" class="btn">🔄 Refresh</button>
              <button id="syRecExport" class="btn">⬇️ Export</button>
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
                  <th>Profit %</th>
                  <th>Net Profit</th>
                </tr>
              </thead>
              <tbody id="syRecTbody">
                <tr>
                  <td colspan="9" class="muted">Caricamento…</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div id="syRecEmpty" class="muted" style="display:none; padding:14px 0;">
            Nessun record trovato.
          </div>
        </div>
      </div>
    </div>
  `;
}

export function mountSmartYieldReconciliationPageInteractions() {
  const tbody = document.getElementById("syRecTbody");
  const empty = document.getElementById("syRecEmpty");
  const input = document.getElementById("syRecSearch");
  const btnRefresh = document.getElementById("syRecRefresh");
  const btnExport = document.getElementById("syRecExport");

  // fallback: prova a leggere dai mock se esistono
  // suggerito: window.__MOCK__.reconciliation oppure window.mockReconciliation
  const getRows = () => {
    const data =
      (window.__MOCK__ && (window.__MOCK__.reconciliation || window.__MOCK__.reconciliations)) ||
      window.mockReconciliation ||
      window.mockReconciliations ||
      // fallback: se non esiste, usa users
      (window.__MOCK__ && window.__MOCK__.users) ||
      window.mockUsers ||
      [];

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
        const r = normalizeReconciliationRow(raw);

        return `
          <tr>
            <td>${escapeHtml(r.code)}</td>
            <td>${escapeHtml(r.fullName)}</td>
            <td>${escapeHtml(r.planId)}</td>
            <td>${escapeHtml(r.plan)}</td>
            <td>${formatMoney(r.deposited, "")}</td>
            <td>${escapeHtml(r.currency || "-")}</td>
            <td>${formatDate(r.date)}</td>
            <td>${formatPercent(r.profitPct)}</td>
            <td>${formatMoney(r.netProfit, r.currency)}</td>
          </tr>
        `;
      })
      .join("");
  };

  const applyFilter = () => {
    const q = (input?.value || "").trim().toLowerCase();
    const rows = getRows();
    if (!q) return renderRows(rows);

    const filtered = rows.filter((u) => {
      const blob = JSON.stringify(u).toLowerCase();
      return blob.includes(q);
    });
    renderRows(filtered);
  };

  const exportCsv = (rows) => {
    const normalized = rows.map(normalizeReconciliationRow);

    const header = [
      "Code",
      "Full Name",
      "Plan ID",
      "Plan",
      "Deposited Amount",
      "Currency",
      "Date",
      "Profit %",
      "Net Profit",
    ];

    const toCell = (v) => {
      const s = v === null || v === undefined ? "" : String(v);
      // CSV safe
      const escaped = s.replaceAll('"', '""');
      return `"${escaped}"`;
    };

    const lines = [
      header.map(toCell).join(","),
      ...normalized.map((r) =>
        [
          r.code,
          r.fullName,
          r.planId,
          r.plan,
          typeof r.deposited === "number" ? r.deposited : r.deposited,
          r.currency,
          formatDate(r.date),
          typeof r.profitPct === "number" ? r.profitPct.toFixed(2) : r.profitPct,
          typeof r.netProfit === "number" ? r.netProfit : r.netProfit,
        ]
          .map(toCell)
          .join(",")
      ),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `smart_yield_reconciliation_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  };

  // init
  renderRows(getRows());

  input?.addEventListener("input", applyFilter);

  btnRefresh?.addEventListener("click", () => {
    renderRows(getRows());
    applyFilter();
  });

  btnExport?.addEventListener("click", () => {
    exportCsv(getRows());
  });
}
