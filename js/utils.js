// js/utils.js — Shared utilities (escapeHtml, formatters, normalizers)

export function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function formatDate(v) {
  if (!v) return "-";
  const d =
    typeof v === "number"
      ? new Date(v)
      : v instanceof Date
      ? v
      : new Date(String(v));

  if (Number.isNaN(d.getTime())) return escapeHtml(v);

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export const fmtEUR = (n) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

export const fmtEUR0 = fmtEUR;

export const fmtEUR2 = (n) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number(n || 0));

export const fmtPct2 = (n) => `${Number(n || 0).toFixed(2)}%`;

export function formatMoney(amount, ccy = "") {
  if (amount === null || amount === undefined || amount === "-") return "-";
  const n = typeof amount === "number" ? amount : Number(amount);
  if (Number.isNaN(n)) return escapeHtml(amount);
  const str = n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return ccy ? `${str} ${escapeHtml(ccy)}` : str;
}

export function formatPercent(p) {
  if (p === null || p === undefined || p === "-") return "-";
  const n = typeof p === "number" ? p : Number(p);
  if (Number.isNaN(n)) return escapeHtml(p);
  return `${n.toFixed(2)}%`;
}

function normalizeDeposited(dep) {
  if (dep === null || dep === undefined || dep === "-") return "-";
  const n = typeof dep === "number" ? dep : Number(dep);
  if (Number.isNaN(n)) return dep;
  if (Math.abs(n) > 100000) return n / 100;
  return n;
}

export function normalizeUser(u) {
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

  deposited = normalizeDeposited(deposited);

  const currency = u.currency || u.ccy || "EUR";

  const date =
    u.date ||
    u.firstDepositDate ||
    u.firstDepositDateMs ||
    u.firstDeposit ||
    u.createdAt ||
    u.dateMs ||
    "-";

  return { code, fullName, planId, plan, deposited, currency, date };
}

export function normalizeReconciliationRow(u) {
  const base = normalizeUser(u);

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

  const current =
    u.currentValue ?? u.balance ?? u.equity ?? u.currentAmount ?? null;

  const depNum = typeof base.deposited === "number" ? base.deposited : Number(base.deposited);

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

  return { ...base, profitPct, netProfit };
}
