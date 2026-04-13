// Frontend/js/pages/binance.js
import { DATA } from "../data.mock.js";
import { fmtEUR0, fmtEUR2, fmtPct2 } from "../utils.js";

/* =========================
   Charts (SVG)
========================= */
function renderBarChartSVG(
  values = [],
  {
    height = 190,
    maxY = null,
    valueFormatter = (v) => String(v),
    labelFormatter = (l) => String(l),
    showTopLabels = true,
  } = {}
) {
  const data = Array.isArray(values) ? values : [];
  if (!data.length) return `<div style="color:var(--muted);font-size:12px">No data</div>`;

  const norm =
    typeof data[0] === "object"
      ? data
          .map((d) => ({
            label: String(d.label ?? ""),
            value: Number(d.value ?? 0),
          }))
          .filter((d) => d.label && Number.isFinite(d.value))
      : data
          .map((v, i) => ({ label: `Item ${i + 1}`, value: Number(v) }))
          .filter((d) => Number.isFinite(d.value));

  if (!norm.length) return `<div style="color:var(--muted);font-size:12px">No data</div>`;

  const w = 520;
  const h = height;

  const padL = 46;
  const padR = 16;
  const padT = 18;
  const padB = 36;

  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const maxVal = maxY ?? Math.max(...norm.map((d) => d.value), 1);
  const safeMax = maxVal || 1;

  const n = norm.length;
  const gap = 14;
  const barW = Math.max(16, (plotW - gap * (n - 1)) / n);

  const x0 = padL;
  const y0 = h - padB;

  const bars = norm
    .map((d, i) => {
      const x = x0 + i * (barW + gap);
      const bh = Math.max(0, (d.value / safeMax) * plotH);
      const y = padT + (plotH - bh);

      const topText = showTopLabels
        ? `<text x="${x + barW / 2}" y="${y - 7}"
             text-anchor="middle" font-size="11"
             fill="currentColor" opacity="0.82">${valueFormatter(d.value)}</text>`
        : "";

      const bottomText = `<text x="${x + barW / 2}" y="${h - 12}"
             text-anchor="middle" font-size="11"
             fill="currentColor" opacity="0.72">${labelFormatter(d.label)}</text>`;

      const op = 0.42 + (i % 3) * 0.1;

      return `
        ${topText}
        <rect x="${x.toFixed(2)}" y="${y.toFixed(2)}"
              width="${barW.toFixed(2)}" height="${bh.toFixed(2)}"
              rx="7" ry="7"
              fill="currentColor" opacity="${op.toFixed(2)}"></rect>
        ${bottomText}
      `;
    })
    .join("");

  return `
    <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" aria-label="bar chart">
      <line x1="${x0}" y1="${padT}" x2="${x0}" y2="${y0}"
            stroke="currentColor" opacity="0.55" stroke-width="1.8"/>
      <line x1="${x0}" y1="${y0}" x2="${w - padR}" y2="${y0}"
            stroke="currentColor" opacity="0.55" stroke-width="1.8"/>
      ${bars}
    </svg>
  `;
}

function renderGroupedBarChartSVG(
  groups = [],
  {
    height = 190,
    valueFormatter = (v) => String(v),
    labelFormatter = (l) => String(l),
    seriesLabels = ["Liquidity", "TVL"],
  } = {}
) {
  const data = Array.isArray(groups) ? groups : [];
  if (!data.length) return `<div style="color:var(--muted);font-size:12px">No data</div>`;

  // keep "invested" key for backward compatibility with your DATA shape
  const norm = data
    .map((d) => ({
      label: String(d.label ?? ""),
      liquidity: Number(d.liquidity ?? 0),
      invested: Number(d.invested ?? 0),
    }))
    .filter((d) => d.label && Number.isFinite(d.liquidity) && Number.isFinite(d.invested));

  if (!norm.length) return `<div style="color:var(--muted);font-size:12px">No data</div>`;

  const w = 520;
  const h = height;

  const padL = 46;
  const padR = 16;
  const padT = 18;
  const padB = 36;

  const plotW = w - padL - padR;
  const plotH = h - padT - padB;

  const maxVal = Math.max(...norm.flatMap((d) => [d.liquidity, d.invested]), 1);
  const safeMax = maxVal || 1;

  const n = norm.length;
  const groupGap = 18;
  const innerGap = 10;

  const groupW = (plotW - groupGap * (n - 1)) / n;
  const barW = Math.max(12, (groupW - innerGap) / 2);

  const x0 = padL;
  const y0 = h - padB;

  const legend = `
    <div style="display:flex;gap:12px;align-items:center;margin:6px 0 2px;color:var(--muted);font-size:12px">
      <span style="display:inline-flex;gap:6px;align-items:center">
        <i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:currentColor;opacity:0.55"></i>
        ${seriesLabels[0]}
      </span>
      <span style="display:inline-flex;gap:6px;align-items:center">
        <i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:currentColor;opacity:0.35"></i>
        ${seriesLabels[1]}
      </span>
    </div>
  `;

  const bars = norm
    .map((d, i) => {
      const gx = x0 + i * (groupW + groupGap);

      const bhL = Math.max(0, (d.liquidity / safeMax) * plotH);
      const yL = padT + (plotH - bhL);

      const bhI = Math.max(0, (d.invested / safeMax) * plotH);
      const yI = padT + (plotH - bhI);

      const xL = gx;
      const xI = gx + barW + innerGap;

      return `
        <text x="${xL + barW / 2}" y="${yL - 7}" text-anchor="middle"
              font-size="11" fill="currentColor" opacity="0.82">${valueFormatter(d.liquidity)}</text>
        <text x="${xI + barW / 2}" y="${yI - 7}" text-anchor="middle"
              font-size="11" fill="currentColor" opacity="0.82">${valueFormatter(d.invested)}</text>

        <rect x="${xL.toFixed(2)}" y="${yL.toFixed(2)}"
              width="${barW.toFixed(2)}" height="${bhL.toFixed(2)}"
              rx="7" ry="7" fill="currentColor" opacity="0.55"></rect>
        <rect x="${xI.toFixed(2)}" y="${yI.toFixed(2)}"
              width="${barW.toFixed(2)}" height="${bhI.toFixed(2)}"
              rx="7" ry="7" fill="currentColor" opacity="0.35"></rect>

        <text x="${gx + groupW / 2}" y="${h - 12}" text-anchor="middle"
              font-size="11" fill="currentColor" opacity="0.72">${labelFormatter(d.label)}</text>
      `;
    })
    .join("");

  return `
    ${legend}
    <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" aria-label="grouped bar chart">
      <line x1="${x0}" y1="${padT}" x2="${x0}" y2="${y0}"
            stroke="currentColor" opacity="0.55" stroke-width="1.8"/>
      <line x1="${x0}" y1="${y0}" x2="${w - padR}" y2="${y0}"
            stroke="currentColor" opacity="0.55" stroke-width="1.8"/>
      ${bars}
    </svg>
  `;
}

function renderTvlGrowMockSVG({ w = 560, h = 220 } = {}) {
  const padL = 70;
  const padT = 26;
  const padB = 48;

  const x0 = padL;
  const y0 = h - padB;
  const xMax = w - 18;

  return `
    <svg viewBox="0 0 ${w} ${h}" width="100%" height="${h}" aria-label="TVL Grow">
      <line x1="${x0}" y1="${padT}" x2="${x0}" y2="${y0}" stroke="currentColor" opacity="0.62" stroke-width="2.2"/>
      <line x1="${x0}" y1="${y0}" x2="${xMax}" y2="${y0}" stroke="currentColor" opacity="0.62" stroke-width="2.2"/>

      <text x="22" y="${padT + 6}" font-size="13" fill="currentColor" opacity="0.85">TVL</text>
      <text x="${xMax - 28}" y="${h - 16}" font-size="13" fill="currentColor" opacity="0.85">Time</text>

      <polyline
        fill="none"
        stroke="currentColor"
        stroke-width="3.2"
        opacity="0.92"
        points="
          ${x0},${y0 - 8}
          ${x0 + 55},${y0 - 18}
          ${x0 + 110},${y0 - 32}
          ${x0 + 165},${y0 - 46}
          ${x0 + 220},${y0 - 68}
          ${x0 + 275},${y0 - 90}
          ${x0 + 330},${y0 - 112}
          ${x0 + 385},${y0 - 132}
          ${xMax},${y0 - 150}
        "
      />
      <polyline
        fill="none"
        stroke="currentColor"
        stroke-width="8"
        opacity="0.12"
        points="
          ${x0},${y0 - 8}
          ${x0 + 55},${y0 - 18}
          ${x0 + 110},${y0 - 32}
          ${x0 + 165},${y0 - 46}
          ${x0 + 220},${y0 - 68}
          ${x0 + 275},${y0 - 90}
          ${x0 + 330},${y0 - 112}
          ${x0 + 385},${y0 - 132}
          ${xMax},${y0 - 150}
        "
      />
    </svg>
  `;
}

function renderDonutMockSVG({
  a = 45,
  b = 35,
  c = 20,
  labels = ["Slice A", "Slice B", "Slice C"],
} = {}) {
  const A = Number(a) || 0;
  const B = Number(b) || 0;
  const C = Number(c) || 0;
  const total = A + B + C || 1;

  const pA = Math.round((A / total) * 100);
  const pB = Math.round((B / total) * 100);
  const pC = Math.max(0, 100 - pA - pB);

  const circ = 276.46;
  const dashA = (circ * (pA / 100)).toFixed(2);
  const dashB = (circ * (pB / 100)).toFixed(2);
  const dashC = (circ * (pC / 100)).toFixed(2);

  const gapA = (circ - dashA).toFixed(2);
  const gapB = (circ - dashB).toFixed(2);
  const gapC = (circ - dashC).toFixed(2);

  const offA = 0;
  const offB = (-Number(dashA)).toFixed(2);
  const offC = (-(Number(dashA) + Number(dashB))).toFixed(2);

  return `
    <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
      <svg viewBox="0 0 120 120" width="120" height="120" aria-label="donut">
        <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" stroke-width="14" opacity="0.85"
          stroke-dasharray="${dashA} ${gapA}" stroke-dashoffset="${offA}"
          transform="rotate(-90 60 60)"/>
        <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" stroke-width="14" opacity="0.55"
          stroke-dasharray="${dashB} ${gapB}" stroke-dashoffset="${offB}"
          transform="rotate(-90 60 60)"/>
        <circle cx="60" cy="60" r="44" fill="none" stroke="currentColor" stroke-width="14" opacity="0.35"
          stroke-dasharray="${dashC} ${gapC}" stroke-dashoffset="${offC}"
          transform="rotate(-90 60 60)"/>
        <circle cx="60" cy="60" r="34" fill="var(--card)" opacity="1"></circle>
      </svg>

      <div class="mini-breakdown" style="flex:1;min-width:180px">
        <div class="bd-row">
          <div class="bd-top"><div class="bd-label">${labels[0] ?? "Slice A"}</div><div class="bd-value">${pA}%</div></div>
          <div class="bd-bar"><div class="bd-fill" style="width:${pA}%"></div></div>
        </div>
        <div class="bd-row">
          <div class="bd-top"><div class="bd-label">${labels[1] ?? "Slice B"}</div><div class="bd-value">${pB}%</div></div>
          <div class="bd-bar"><div class="bd-fill" style="width:${pB}%"></div></div>
        </div>
        <div class="bd-row">
          <div class="bd-top"><div class="bd-label">${labels[2] ?? "Slice C"}</div><div class="bd-value">${pC}%</div></div>
          <div class="bd-bar"><div class="bd-fill" style="width:${pC}%"></div></div>
        </div>
      </div>
    </div>
  `;
}

/* =========================
   UI: Breakdown blocks (bar list)
========================= */
function renderBreakdown({ entries = [], total = null, isPct = false, valueFmt = null }) {
  if (!Array.isArray(entries) || entries.length === 0) return "";

  const safeTotal =
    total ??
    (isPct ? 100 : entries.reduce((acc, e) => acc + Number(e.value || 0), 0) || 1);

  return `
    <div class="mini-breakdown">
      ${entries
        .map((e) => {
          const v = Number(e.value || 0);
          const pct = isPct ? v : (v / safeTotal) * 100;

          const valueText =
            typeof e.display === "string"
              ? e.display
              : valueFmt
              ? valueFmt(v)
              : isPct
              ? `${v.toFixed(0)}%`
              : fmtEUR0(v);

          return `
            <div class="bd-row">
              <div class="bd-top">
                <div class="bd-label">${e.label}</div>
                <div class="bd-value">${valueText}</div>
              </div>
              <div class="bd-bar">
                <div class="bd-fill" style="width:${Math.max(0, Math.min(100, pct)).toFixed(
                  2
                )}%"></div>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderMiniTilesColumn(items = []) {
  return `
    <div style="display:flex;flex-direction:column;gap:10px">
      ${items
        .map(
          (it) => `
          <div style="
            padding:12px 12px;
            border-radius:14px;
            background:rgba(255,255,255,0.04);
            border:1px solid rgba(255,255,255,0.06);
          ">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:10px">
              <div style="color:var(--muted);font-size:12px">${it.label}</div>
              <div style="font-weight:700">${it.value}</div>
            </div>
          </div>
        `
        )
        .join("")}
    </div>
  `;
}

/* =========================
   UI: Macro rows + mini cards
========================= */
function renderSubCard(card) {
  const { k, v, mode, entries, total, isPct, valueFmt, html } = card;

  const body =
    mode === "breakdown"
      ? renderBreakdown({ entries, total, isPct, valueFmt })
      : html
      ? v
      : `<div class="mini-kpi-v">${v}</div>`;

  return `
    <div class="mini-kpi">
      <div class="mini-kpi-k">${k}</div>
      ${body}
    </div>
  `;
}

/**
 * headExtra: HTML string injected between header and body (used for "global" timeframe tabs)
 */
function renderMacroRow({ title, rightLabel, items, tone = "blue", cols = 4, headExtra = "" }) {
  return `
    <section class="macro-row" data-tone="${tone}" style="--cols:${cols}">
      <div class="macro-row-head">
        <div class="macro-row-title">${title}</div>
        ${rightLabel ? `<div class="macro-row-meta">${rightLabel}</div>` : ``}
      </div>

      ${headExtra ? `<div class="macro-row-head-extra">${headExtra}</div>` : ""}

      <div class="macro-row-body">
        ${items.map(renderSubCard).join("")}
      </div>
    </section>
  `;
}

/* =========================
   Timeframe tabs UI
========================= */
function renderTfTabs({ widgetId, defaultTf = "monthly" }) {
  return `
    <div class="tf-tabs" style="display:flex;gap:8px;align-items:center;margin:10px 0 8px">
      <button class="btn tf-btn ${defaultTf === "daily" ? "active" : ""}" data-widget="${widgetId}" data-tf="daily" type="button">Daily</button>
      <button class="btn tf-btn ${defaultTf === "weekly" ? "active" : ""}" data-widget="${widgetId}" data-tf="weekly" type="button">Weekly</button>
      <button class="btn tf-btn ${defaultTf === "monthly" ? "active" : ""}" data-widget="${widgetId}" data-tf="monthly" type="button">Monthly</button>
      <button class="btn tf-btn ${defaultTf === "ytd" ? "active" : ""}" data-widget="${widgetId}" data-tf="ytd" type="button">YTD</button>
    </div>
  `;
}

/**
 * Scope tabs: one set of tabs controlling multiple widgets
 */
function renderTfTabsScope({ scope, defaultTf = "monthly" }) {
  return `
    <div class="tf-tabs" data-scope="${scope}"
         style="display:flex;gap:8px;align-items:center;margin:10px 0 8px">
      <button class="btn tf-btn ${defaultTf === "daily" ? "active" : ""}" data-scope="${scope}" data-tf="daily" type="button">Daily</button>
      <button class="btn tf-btn ${defaultTf === "weekly" ? "active" : ""}" data-scope="${scope}" data-tf="weekly" type="button">Weekly</button>
      <button class="btn tf-btn ${defaultTf === "monthly" ? "active" : ""}" data-scope="${scope}" data-tf="monthly" type="button">Monthly</button>
      <button class="btn tf-btn ${defaultTf === "ytd" ? "active" : ""}" data-scope="${scope}" data-tf="ytd" type="button">YTD</button>
    </div>
  `;
}

/* =========================
   Main page
========================= */
export function renderBinancePage() {
  const overview = DATA?.omnibus?.binanceOverview;

  if (!overview) {
    return `
      <div class="grid">
        <section class="card xlarge">
          <h3>Strategy Summary <span class="hint">Overview</span></h3>
          <div style="color:var(--muted);margin-top:10px">
            Manca <b>DATA.omnibus.binanceOverview</b> in <b>data.mock.js</b>.
          </div>
        </section>
      </div>
    `;
  }

  const exposure = overview.exposureBreakdown || {};
  const liq = overview.liquidity || {};
  const widgets = overview.liquidityWidgets || {};

  // KPI: supports either overview.strategyKpis or overview.kpis
  const kpis = overview.strategyKpis || overview.kpis || {};
  const totalTvlEur = Number(kpis.totalTvlEur ?? kpis.totalTvl ?? 1620000);
  const grossReturnPct = Number(kpis.grossReturnPctMtd ?? kpis.grossReturnPct ?? 3.1);
  const netReturnPct = Number(kpis.netReturnToUsersPctMtd ?? kpis.netReturnToUsersPct ?? 2.34);
  const contributionToPnlEur = Number(kpis.contributionToPnlEurMtd ?? kpis.contributionToPnlEur ?? 286000);
  const maxDrawdownPct = Number(kpis.maxDrawdownPctAllTime ?? kpis.maxDrawdownPct ?? 3.85);

  // Return by Product (pct)
  const returnByProductByTf =
    widgets.returnByProductByTf || {
      daily: [
        { label: "Smart", value: 0.8 },
        { label: "Premium", value: 1.1 },
        { label: "Platinum", value: 1.4 },
      ],
      weekly: [
        { label: "Smart", value: 2.2 },
        { label: "Premium", value: 2.8 },
        { label: "Platinum", value: 3.3 },
      ],
      monthly: [
        { label: "Smart", value: 3.5 },
        { label: "Premium", value: 5.0 },
        { label: "Platinum", value: 7.0 },
      ],
      ytd: [
        { label: "Smart", value: 12.0 },
        { label: "Premium", value: 16.0 },
        { label: "Platinum", value: 21.0 },
      ],
    };

  // Liquidity / TVL (grouped bars)
  const liquidityInvestedByTf =
    widgets.liquidityInvestedByTf || {
      daily: [
        { label: "Smart", liquidity: 300000, invested: 240000 },
        { label: "Premium", liquidity: 420000, invested: 310000 },
        { label: "Platinum", liquidity: 520000, invested: 380000 },
      ],
      weekly: [
        { label: "Smart", liquidity: 320000, invested: 260000 },
        { label: "Premium", liquidity: 450000, invested: 350000 },
        { label: "Platinum", liquidity: 560000, invested: 420000 },
      ],
      monthly: [
        { label: "Smart", liquidity: 360000, invested: 300000 },
        { label: "Premium", liquidity: 500000, invested: 420000 },
        { label: "Platinum", liquidity: 620000, invested: 520000 },
      ],
      ytd: [
        { label: "Smart", liquidity: 720000, invested: 600000 },
        { label: "Premium", liquidity: 980000, invested: 820000 },
        { label: "Platinum", liquidity: 1150000, invested: 980000 },
      ],
    };

  // Revenue by Product (EUR)
  const revenueByProductByTf =
    widgets.revenueByProductByTf || {
      daily: [
        { label: "Smart", value: 1200 },
        { label: "Premium", value: 1800 },
        { label: "Platinum", value: 2400 },
      ],
      weekly: [
        { label: "Smart", value: 6500 },
        { label: "Premium", value: 9200 },
        { label: "Platinum", value: 12400 },
      ],
      monthly: [
        { label: "Smart", value: 28000 },
        { label: "Premium", value: 41000 },
        { label: "Platinum", value: 56000 },
      ],
      ytd: [
        { label: "Smart", value: 190000 },
        { label: "Premium", value: 260000 },
        { label: "Platinum", value: 340000 },
      ],
    };

  // Liquidity buckets (EUR)
  const fallbackBuckets =
    liq.bucketsEur || {
      "T+0": 2500000,
      "T+1": 1900000,
      "T+7": 3100000,
      "T+30": 2400000,
      locked: 2470000,
    };

  const liquidityBucketsByTf =
    widgets.liquidityBucketsByTf || {
      daily: fallbackBuckets,
      weekly: fallbackBuckets,
      monthly: fallbackBuckets,
      ytd: fallbackBuckets,
    };

  const bucketsToEntries = (obj) =>
    Object.entries(obj || {}).map(([k, v]) => ({ label: k, value: v }));

  const defaultTf = "monthly";

  /* =========================
     Exposure Breakdown
     - Renamed cards
     - Revenue moved here from Liquidity
  ========================= */
  const exposureRow = renderMacroRow({
    title: "Exposure Breakdown",
    rightLabel: "Overview",
    tone: "purple",
    cols: 4,
    items: [
      {
        k: "TVL Growth (%)",
        html: true,
        v: `
          <div style="color:var(--muted);font-size:12px;margin-bottom:6px"></div>
          ${renderTvlGrowMockSVG({ w: 560, h: 220 })}
        `,
      },
      {
        k: "TVL by Product",
        html: true,
        v: `
          <div style="color:var(--muted);font-size:12px;margin-bottom:6px"></div>
          ${renderDonutMockSVG({
            a: 50,
            b: 30,
            c: 20,
            labels: ["Smart Yield", "Premium", "Platinum"],
          })}
        `,
      },
      {
        k: "TVL KPIs",
        html: true,
        v: `
          <div style="color:var(--muted);font-size:12px;margin-bottom:10px"></div>
          ${renderMiniTilesColumn([
            { label: "Total TVL", value: fmtEUR0(totalTvlEur) },
            { label: "Gross Return", value: fmtPct2(grossReturnPct) },
            { label: "Net return to Users", value: fmtPct2(netReturnPct) },
            { label: "Contribution to PNL", value: fmtEUR2(contributionToPnlEur) },
            { label: "Max DrawDown", value: fmtPct2(maxDrawdownPct) },
          ])}
        `,
      },
      {
        k: "Revenue by Product",
        html: true,
        v: `
          ${renderTfTabs({ widgetId: "revenueByProduct", defaultTf })}
          <div id="w-revenueByProduct" data-tf="${defaultTf}">
            ${renderBarChartSVG(revenueByProductByTf[defaultTf], {
              valueFormatter: (v) => fmtEUR0(v),
              labelFormatter: (l) => String(l).slice(0, 10),
            })}
          </div>
          <script type="application/json" id="data-revenueByProduct">
            ${JSON.stringify(revenueByProductByTf)}
          </script>
        `,
      },
    ],
  });

  /* =========================
     Liquidity row
     - Global timeframe tabs (one set above the widgets)
     - No per-card buttons
     - Revenue removed (moved to Exposure)
  ========================= */
  const liquidityRow = renderMacroRow({
    title: "Liquidity",
    rightLabel: "Overview",
    tone: "cyan",
    cols: 3,
    headExtra: renderTfTabsScope({ scope: "liquidity", defaultTf }),
    items: [
      {
        k: "Return by Product",
        html: true,
        v: `
          <div id="w-returnByProduct" data-tf="${defaultTf}">
            ${renderBarChartSVG(returnByProductByTf[defaultTf], {
              valueFormatter: (v) => `${Number(v || 0).toFixed(1)}%`,
              labelFormatter: (l) => String(l).slice(0, 10),
            })}
          </div>
          <script type="application/json" id="data-returnByProduct">
            ${JSON.stringify(returnByProductByTf)}
          </script>
        `,
      },
      {
        k: "Liquidity / TVL",
        html: true,
        v: `
          <div id="w-liquidityInvested" data-tf="${defaultTf}">
            ${renderGroupedBarChartSVG(liquidityInvestedByTf[defaultTf], {
              valueFormatter: (v) => fmtEUR0(v),
              labelFormatter: (l) => String(l).slice(0, 10),
              seriesLabels: ["Liquidity", "TVL"],
            })}
          </div>
          <script type="application/json" id="data-liquidityInvested">
            ${JSON.stringify(liquidityInvestedByTf)}
          </script>
        `,
      },
      {
        k: "Liquidity Buckets",
        html: true,
        v: `
          <div id="w-liquidityBuckets" data-tf="${defaultTf}">
            ${(() => {
              const entries = bucketsToEntries(liquidityBucketsByTf[defaultTf]);
              const total = entries.reduce((a, e) => a + Number(e.value || 0), 0) || 1;
              return renderBreakdown({ entries, total, valueFmt: fmtEUR0 });
            })()}
          </div>
          <script type="application/json" id="data-liquidityBuckets">
            ${JSON.stringify(liquidityBucketsByTf)}
          </script>
        `,
      },
    ],
  });

  /* =========================
     Bottom: Exposure by Asset class
     - ONLY: DeFi Strategy + Non Custodial Wallets
  ========================= */
  const exposureAssetClassBottom = renderMacroRow({
    title: "Exposure by Asset class",
    rightLabel: "Overview",
    tone: "purple",
    cols: 1,
    items: [
      {
        k: "Asset class distribution (TVL)",
        html: true,
        v: (() => {
          const pct = exposure.assetExposurePct || {};

          const defi = Number(pct.defiStrategy ?? pct.defi ?? 0);
          const nonCust = Number(pct.nonCustodialWallets ?? pct.nonCustodial ?? 0);

          const entries = [
            { label: "DeFi Strategy", value: defi },
            { label: "Non Custodial Wallets", value: nonCust },
          ].filter((e) => Number.isFinite(e.value));

          const total = entries.reduce((a, e) => a + e.value, 0) || 1;

          return `
            <div style="color:var(--muted);font-size:12px;margin-bottom:10px">Distribution</div>
            ${renderBreakdown({
              entries,
              total,
              isPct: false,
              valueFmt: (v) => `${Number(v || 0).toFixed(0)}%`,
            })}
          `;
        })(),
      },
    ],
  });

  return `
    <div class="grid">
      <section class="card xlarge">
        <h3>Strategy Summary <span class="hint">Overview</span></h3>
        <div style="height:14px"></div>

        <div class="macro-stack">
          ${exposureRow}
          ${liquidityRow}
          ${exposureAssetClassBottom}
        </div>
      </section>
    </div>
  `;
}

/* =========================
   Interactions (timeframe tabs)
========================= */
let __binanceMountDone = false;

export function mountBinancePageInteractions() {
  if (__binanceMountDone) return;
  __binanceMountDone = true;

  const widgetConfig = {
    returnByProduct: {
      dataId: "data-returnByProduct",
      containerId: "w-returnByProduct",
      render: (series) =>
        renderBarChartSVG(series, {
          valueFormatter: (v) => `${Number(v || 0).toFixed(1)}%`,
          labelFormatter: (l) => String(l).slice(0, 10),
        }),
    },
    liquidityInvested: {
      dataId: "data-liquidityInvested",
      containerId: "w-liquidityInvested",
      render: (series) =>
        renderGroupedBarChartSVG(series, {
          valueFormatter: (v) => fmtEUR0(v),
          labelFormatter: (l) => String(l).slice(0, 10),
          seriesLabels: ["Liquidity", "TVL"],
        }),
    },
    revenueByProduct: {
      dataId: "data-revenueByProduct",
      containerId: "w-revenueByProduct",
      render: (series) =>
        renderBarChartSVG(series, {
          valueFormatter: (v) => fmtEUR0(v),
          labelFormatter: (l) => String(l).slice(0, 10),
        }),
    },
    liquidityBuckets: {
      dataId: "data-liquidityBuckets",
      containerId: "w-liquidityBuckets",
      render: (obj) => {
        const entries = Object.entries(obj || {}).map(([k, v]) => ({ label: k, value: v }));
        const total = entries.reduce((a, e) => a + Number(e.value || 0), 0) || 1;
        return renderBreakdown({ entries, total, valueFmt: fmtEUR0 });
      },
    },
  };

  document.addEventListener("click", (ev) => {
    const btn = ev.target?.closest?.(".tf-btn");
    if (!btn) return;

    const tf = btn.dataset.tf;
    if (!tf) return;

    // CASE 1) Global scope tabs (Liquidity)
    const scope = btn.dataset.scope;
    if (scope === "liquidity") {
      const parentTabs = btn.closest(".tf-tabs");
      if (parentTabs) {
        parentTabs.querySelectorAll(".tf-btn").forEach((b) =>
          b.classList.toggle("active", b === btn)
        );
      }

      const liquidityWidgets = ["returnByProduct", "liquidityInvested", "liquidityBuckets"];

      liquidityWidgets.forEach((widgetId) => {
        const cfg = widgetConfig[widgetId];
        if (!cfg) return;

        const dataEl = document.getElementById(cfg.dataId);
        const container = document.getElementById(cfg.containerId);
        if (!dataEl || !container) return;

        let byTf = {};
        try {
          byTf = JSON.parse(dataEl.textContent || "{}") || {};
        } catch {
          byTf = {};
        }

        const payload = byTf?.[tf];
        container.dataset.tf = tf;
        container.innerHTML = cfg.render(payload);
      });

      return;
    }

    // CASE 2) Per-widget tabs (e.g. Revenue by Product in Exposure)
    const widgetId = btn.dataset.widget;
    if (!widgetId) return;

    const cfg = widgetConfig[widgetId];
    if (!cfg) return;

    const dataEl = document.getElementById(cfg.dataId);
    const container = document.getElementById(cfg.containerId);
    if (!dataEl || !container) return;

    const parentTabs = btn.closest(".tf-tabs");
    if (parentTabs) {
      parentTabs.querySelectorAll(".tf-btn").forEach((b) =>
        b.classList.toggle("active", b === btn)
      );
    }

    let byTf = {};
    try {
      byTf = JSON.parse(dataEl.textContent || "{}") || {};
    } catch {
      byTf = {};
    }

    const payload = byTf?.[tf];
    container.dataset.tf = tf;
    container.innerHTML = cfg.render(payload);
  });
}
