// Frontend/js/pages/smart_yield_reconciliation.js

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(v) {
  if (!v) return "-";
  // support: ms timestamp, ISO string, Date
  const d =
    typeof v === "number"
      ? new Date(v)
      : v instanceof Date
      ? v
      : new Date(String(v));

  if (Number.isNaN(d.getTime())) return escapeHtml(v);

  // formato semplice dd/mm/yyyy
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatMoney(amount, ccy = "") {
  if (amount === null || amount === undefined || amount === "-") return "-";
  const n = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(n)) return escapeHtml(amount);

  // non imposto locale/valuta “hard”, restiamo semplici
  const str = n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return ccy ? `${str} ${escapeHtml(ccy)}` : str;
}

function formatPercent(p) {
  if (p === null || p === undefined || p === "-") return "-";
  const n = typeof p === "number" ? p : Number(p);
  if (Number.isNaN(n)) return escapeHtml(p);
  return `${n.toFixed(2)}%`;
}

/**
 * Prova a derivare deposited, netProfit e profitPct anche se i campi cambiano.
 * - deposited: u.depositedAmount / totalAmountEurCents / totalAmountCents / amount / deposited
 * - netProfit: u.netProfit / profit / pnl / netProfitEurCents / profitEurCents
 * - profitPct: u.profitPct / profitPercent / profit_percentage
 *
 * Se netProfit non c’è ma esiste currentValue/balance/equity, prova:
 *   netProfit = current - deposited
 */
function normalizeRow(u) {
  const code = u.code || u.userCode || u.userId || u.id || "-";

  const fullName =
    u.fullName ||
    u.name ||
    `${u.firstName || ""} ${u.lastName || ""}`.trim() ||
    "-";

  const planId = u.planId || u.plan_id || u.planCode || "-";
  const plan = u.plan || u.planName || u.plan_label || "Smart Yield";

  let deposited =
    u.depositedAmount ??
    u.totalAmountEurCents ??
    u.totalAmountCents ??
    u.amount ??
    u.deposited ??
    "-";

  // Se arriva in cents, di solito è int: prova a convertirlo se sembra "grande"
  if (typeof deposited === "number" && Math.abs(deposited) > 100000) {
    deposited = deposited / 100;
  }

  const currency = u.currency || u.ccy || "EUR";

  const date =
    u.date ||
    u.firstDepositDate ||
    u.firstDepositDateMs ||
    u.firstDeposit ||
    u.createdAt ||
    u.dateMs ||
    "-";

  let netProfit =
    u.netProfit ??
    u.profit ??
    u.pnl ??
    u.netProfitEurCents ??
    u.profitEurCents ??
    "-";

  if (typeof netProfit === "number" && Math.abs(netProfit) > 100000) {
    netProfit = netProfit / 100;
  }

  let profitPct =
    u.profitPct ??
    u.profitPercent ??
    u.profit_percentage ??
    u.profitRate ??
    "-";

  // Se mancano netProfit/profitPct ma abbiamo un "current"
  const current =
    u.currentValue ?? u.balance ?? u.equity ?? u.currentAmount ?? null;

  const depNum = typeof deposited === "number" ? deposited : Number(deposited);

  if ((netProfit === "-" || netProfit === null) && current !== null) {
    const curNum = typeof current === "number" ? current : Number(current);
    if (!Number.isNaN(curNum) && !Number.isNaN(depNum)) {
      netProfit = curNum - depNum;
    }
  }

  if (profitPct === "-" || profitPct === null) {
    const npNum = typeof netProfit === "number" ? netProfit : Number(netProfit);
    if (!Number.isNaN(npNum) && !Number.isNaN(depNum) && depNum !== 0) {
      profitPct = (npNum / depNum) * 100;
    }
  }

  return { code, fullName, planId, plan, deposited, currency, date, profitPct, netProfit };
}

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
        const r = normalizeRow(raw);

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
    const normalized = rows.map(normalizeRow);

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
