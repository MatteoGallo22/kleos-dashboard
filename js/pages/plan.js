// Frontend/js/pages/plan.js
import { DATA } from "../data.mock.js";
import { fmtEUR0, fmtEUR2 } from "../utils.js";

/* =========================
   Line chart SVG with Axes
========================= */
function normalizeSeries(series = []) {
  if (!Array.isArray(series)) return [];

  // If already objects
  if (series.length && typeof series[0] === "object" && series[0] !== null) {
    return series
      .map((p) => ({
        x: String(p.date ?? ""),
        y: Number(p.value ?? 0),
      }))
      .filter((p) => p.x && Number.isFinite(p.y));
  }

  // Fallback numeric array -> x as index labels
  return series
    .map((v, i) => ({ x: String(i + 1), y: Number(v) }))
    .filter((p) => Number.isFinite(p.y));
}

function renderLineChartSVG(
  series = [],
  {
    width = 1200,
    height = 300,
    fit = false, // fit=true => fills container without cropping
    paddingLeft = 120,
    paddingRight = 28,
    paddingTop = 14,
    paddingBottom = 44,
    yLabelFormatter = (v) => String(v),
    xLabelFormatter = (x) => String(x),
    yPadPct = 0.06,
  } = {}
) {
  const w = width;
  const h = height;

  const data = normalizeSeries(series);
  if (data.length < 2) {
    return `<div style="color:var(--muted);font-size:12px">No data</div>`;
  }

  const ys = data.map((d) => d.y);
  let minY = Math.min(...ys);
  let maxY = Math.max(...ys);

  const span0 = maxY - minY || 1;
  const pad = span0 * yPadPct;
  minY -= pad;
  maxY += pad;

  const spanY = maxY - minY || 1;

  const plotW = w - paddingLeft - paddingRight;
  const plotH = h - paddingTop - paddingBottom;
  const dx = plotW / (data.length - 1);

  const x0 = paddingLeft;
  const y0 = h - paddingBottom;

  const points = data
    .map((d, i) => {
      const x = x0 + i * dx;
      const y = paddingTop + plotH * (1 - (d.y - minY) / spanY);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  const xMinLabel = xLabelFormatter(data[0].x);
  const xMaxLabel = xLabelFormatter(data[data.length - 1].x);
  const yMinLabel = yLabelFormatter(minY);
  const yMaxLabel = yLabelFormatter(maxY);

  return `
    <svg
      viewBox="0 0 ${w} ${h}"
      width="100%"
      height="${fit ? "100%" : h}"
      preserveAspectRatio="${fit ? "none" : "xMidYMid meet"}"
      style="display:block"
      aria-label="line chart"
    >
      <!-- Axes -->
      <line x1="${x0}" y1="${paddingTop}" x2="${x0}" y2="${y0}"
            stroke="currentColor" opacity="0.25" vector-effect="non-scaling-stroke"/>
      <line x1="${x0}" y1="${y0}" x2="${w - paddingRight}" y2="${y0}"
            stroke="currentColor" opacity="0.25" vector-effect="non-scaling-stroke"/>

      <!-- Y labels -->
      <text x="${x0 - 12}" y="${paddingTop + 10}"
            text-anchor="end" font-size="10" fill="currentColor" opacity="0.70">
        ${yMaxLabel}
      </text>
      <text x="${x0 - 12}" y="${y0}"
            text-anchor="end" font-size="10" fill="currentColor" opacity="0.70">
        ${yMinLabel}
      </text>

      <!-- X labels -->
      <text x="${x0}" y="${y0 + 22}"
            text-anchor="start" font-size="10" fill="currentColor" opacity="0.70">
        ${xMinLabel}
      </text>
      <text x="${w - paddingRight}" y="${y0 + 22}"
            text-anchor="end" font-size="10" fill="currentColor" opacity="0.70">
        ${xMaxLabel}
      </text>

      <!-- Line -->
      <polyline
        fill="none"
        stroke="currentColor"
        stroke-width="2.25"
        points="${points}"
        opacity="0.92"
        vector-effect="non-scaling-stroke"
      />
      <!-- Soft glow -->
      <polyline
        fill="none"
        stroke="currentColor"
        stroke-width="6"
        points="${points}"
        opacity="0.12"
        vector-effect="non-scaling-stroke"
      />
    </svg>
  `;
}

/* =========================
   Pie chart SVG (donut)
========================= */
function renderPieChartSVG(slices = []) {
  const data = (Array.isArray(slices) ? slices : [])
    .map((s) => ({ label: s.label, value: Number(s.value || 0) }))
    .filter((s) => Number.isFinite(s.value) && s.value > 0);

  const total = data.reduce((a, s) => a + s.value, 0) || 1;

  const size = 120;
  const r = 44;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;

  let acc = 0;

  const rings = data
    .map((s, idx) => {
      const frac = s.value / total;
      const dash = (C * frac).toFixed(2);
      const gap = (C - C * frac).toFixed(2);
      const offset = (-C * acc).toFixed(2);
      acc += frac;

      const op = 0.95 - (idx % 4) * 0.15;

      return `
        <circle
          cx="${cx}" cy="${cy}" r="${r}"
          fill="none"
          stroke="currentColor"
          stroke-width="14"
          stroke-dasharray="${dash} ${gap}"
          stroke-dashoffset="${offset}"
          stroke-linecap="butt"
          opacity="${Math.max(0.35, op).toFixed(2)}"
          transform="rotate(-90 ${cx} ${cy})"
        />
      `;
    })
    .join("");

  const legend = `
    <div class="mini-breakdown" style="margin-top:10px">
      ${data
        .map((s) => {
          const pct = (100 * (s.value / total)).toFixed(0);
          return `
            <div class="bd-row tvl-bd-item"
                 data-asset="${s.label}"
                 role="button"
                 tabindex="0"
                 style="cursor:pointer">
              <div class="bd-top">
                <div class="bd-label">${s.label}</div>
                <div class="bd-value">${pct}%</div>
              </div>
              <div class="bd-bar">
                <div class="bd-fill" style="width:${pct}%"></div>
              </div>
            </div>
          `;
        })
        .join("")}
    </div>
  `;

  return `
    <div style="display:flex;gap:14px;align-items:center;flex-wrap:wrap">
      <svg viewBox="0 0 ${size} ${size}" width="120" height="120" aria-label="pie chart">
        ${rings}
        <circle cx="${cx}" cy="${cy}" r="${r - 10}" fill="var(--card)" opacity="1"></circle>
      </svg>
      <div style="flex:1;min-width:180px">${legend}</div>
    </div>
  `;
}

/* =========================
   KPI card helpers
========================= */
function miniKpiBox({ title, value, subtitle = "Total" }) {
  return `
    <div class="mini-kpi" style="min-width:160px">
      <div class="mini-kpi-k">${title}</div>
      <div class="mini-kpi-v" style="font-size:18px">${value}</div>
      <div style="color:var(--muted);font-size:12px;margin-top:6px">${subtitle}</div>
    </div>
  `;
}

function miniKpiRow(items = []) {
  return `
    <div class="macro-row-body">
      ${items
        .map(
          (it) => `
            <div class="mini-kpi">
              <div class="mini-kpi-k">${it.k}</div>
              <div class="mini-kpi-v">${it.v}</div>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

/* =========================
   Data getters (smart = DEFI)
   - TVL Breakdown rename
   - cumulativeSeriesByTf + ytd alias
   - assetClasses drilldown optional
========================= */
function getDefiData() {
  const d = DATA?.plans?.smart || DATA?.omnibus?.plans?.smart || {};

  const tvlGrowthSeriesByTf =
    d?.tvlGrowthSeriesByTf ||
    d?.aumGrowthSeriesByTf ||
    {
      daily: [
        { date: "2024-08-01", value: 1480000 },
        { date: "2024-08-02", value: 1492000 },
        { date: "2024-08-03", value: 1487000 },
        { date: "2024-08-04", value: 1505000 },
        { date: "2024-08-05", value: 1513000 },
        { date: "2024-08-06", value: 1521000 },
        { date: "2024-08-07", value: 1530000 },
      ],
      weekly: [
        { date: "2024-W27", value: 1360000 },
        { date: "2024-W28", value: 1400000 },
        { date: "2024-W29", value: 1425000 },
        { date: "2024-W30", value: 1460000 },
        { date: "2024-W31", value: 1500000 },
        { date: "2024-W32", value: 1530000 },
      ],
      monthly: [
        { date: "2024-01", value: 1000000 },
        { date: "2024-02", value: 1080000 },
        { date: "2024-03", value: 1120000 },
        { date: "2024-04", value: 1210000 },
        { date: "2024-05", value: 1280000 },
        { date: "2024-06", value: 1360000 },
        { date: "2024-07", value: 1500000 },
        { date: "2024-08", value: 1620000 },
      ],
      ytd: [
        { date: "2024-01-01", value: 1000000 },
        { date: "2024-03-01", value: 1120000 },
        { date: "2024-06-01", value: 1360000 },
        { date: "2024-08-01", value: 1620000 },
      ],
    };

  const rawBreakdown =
    d?.tvlBreakdown ||
    d?.aumByCounter ||
    [
      { label: "Counter A", value: 42 },
      { label: "Counter B", value: 28 },
      { label: "Counter C", value: 18 },
      { label: "Others", value: 12 },
    ];

  const labelMap = {
    "Counter A": "Rosetta",
    "Counter B": "Psalion",
    "Counter C": "Campsor",
    Others: "TrueOne",
    Other: "TrueOne",
  };

  const tvlBreakdown = (Array.isArray(rawBreakdown) ? rawBreakdown : []).map((x) => ({
    label: labelMap[x.label] || x.label,
    value: Number(x.value || 0),
  }));

  const amountReturnSeriesByTf =
    d?.amountReturnSeriesByTf || {
      daily: [
        { date: "2024-08-01", value: 1200 },
        { date: "2024-08-02", value: 1400 },
        { date: "2024-08-03", value: 1100 },
        { date: "2024-08-04", value: 1800 },
        { date: "2024-08-05", value: 1600 },
        { date: "2024-08-06", value: 1900 },
        { date: "2024-08-07", value: 2100 },
      ],
      weekly: [
        { date: "2024-W27", value: 6000 },
        { date: "2024-W28", value: 7200 },
        { date: "2024-W29", value: 5800 },
        { date: "2024-W30", value: 8400 },
        { date: "2024-W31", value: 7900 },
        { date: "2024-W32", value: 9100 },
      ],
      monthly: [
        { date: "2024-02", value: 22000 },
        { date: "2024-03", value: 24000 },
        { date: "2024-04", value: 18000 },
        { date: "2024-05", value: 27000 },
        { date: "2024-06", value: 29000 },
        { date: "2024-07", value: 31000 },
        { date: "2024-08", value: 28000 },
      ],
      yearly: [
        { date: "2021", value: 120000 },
        { date: "2022", value: 160000 },
        { date: "2023", value: 140000 },
        { date: "2024", value: 190000 },
        { date: "2025", value: 210000 },
      ],
    };

  const cumulativeSeriesByTf = {
    ...amountReturnSeriesByTf,
    ytd: amountReturnSeriesByTf?.ytd || amountReturnSeriesByTf?.yearly || [],
  };

  // GLOBAL KPIs (all assets, not drill-down)
  const perf = d?.performanceReturns || DATA?.omnibus?.binanceOverview?.performanceReturns || {};
  const gross = perf?.grossReturnMtdPct ?? 0;
  const net = perf?.netReturnToUsersMtdPct ?? 0;
  const pnl = perf?.pnlContributionEur ?? 0;

  const risk = d?.riskMetrics || DATA?.omnibus?.binanceOverview?.riskMetrics || {};
  const drawdown = risk?.drawdownPct ?? 0;
  const maxDd = risk?.maxDrawdownPct ?? 0;
  const conc = risk?.exposureConcentrationTop3Pct ?? 0;

  // Optional drill-down per asset class
  const assetClasses = d?.assetClasses || {};

  return {
    tvlGrowthSeriesByTf,
    tvlBreakdown,
    cumulativeSeriesByTf,
    performance: { grossReturn: gross, netReturn: net, pnlContribution: pnl },
    risk: { drawdownPct: drawdown, maxDrawdownPct: maxDd, exposureConcentrationPct: conc },
    assetClasses,
  };
}

/* =========================
   TOP UI (FULL WIDTH)
   1) TVL Growth (full width, with KPI column)
   2) TVL Breakdown & Cumulative Performance (full width, big)
========================= */
function renderTopSections({
  tvlGrowthSeriesByTf,
  tvlBreakdown,
  cumulativeSeriesByTf,
  performance,
  risk,
}) {
  /* ---------- TVL Growth (full width) ---------- */
  const defaultTvlTf = "monthly";
  const tvlSeriesDefault = tvlGrowthSeriesByTf?.[defaultTvlTf] || [];
  const tvlNormDefault = normalizeSeries(tvlSeriesDefault);
  const tvlTotalDefault = tvlNormDefault.length ? tvlNormDefault[tvlNormDefault.length - 1].y : 0;

  const tvlTfTabs = `
    <div class="tf-tabs" style="display:flex;gap:8px;align-items:center;justify-content:flex-end">
      <button class="btn tvl-tf-btn" data-tf="daily" type="button">Daily</button>
      <button class="btn tvl-tf-btn" data-tf="weekly" type="button">Weekly</button>
      <button class="btn tvl-tf-btn active" data-tf="monthly" type="button">Monthly</button>
      <button class="btn tvl-tf-btn" data-tf="ytd" type="button">Year to Date</button>
    </div>
  `;

  const tvlGrowthCard = `
    <section class="card xlarge">
      <h3 style="margin:0">TVL Growth</h3>
      <div style="margin-top:12px; display:flex; gap:14px; align-items:stretch">
        <div style="flex:1; min-width:260px">
          <div style="display:flex;gap:12px;align-items:center;justify-content:space-between;margin-bottom:10px">
            <div style="color:var(--muted);font-size:12px">Trend</div>
            ${tvlTfTabs}
          </div>

          <div style="height:300px;width:100%">
            <div id="tvlGrowthChart" data-current-tf="${defaultTvlTf}" style="height:100%">
              ${renderLineChartSVG(tvlSeriesDefault, {
                width: 1600,
                height: 300,
                fit: true,
                paddingLeft: 120,
                paddingRight: 28,
                paddingBottom: 44,
                yLabelFormatter: (v) => fmtEUR0(v),
                xLabelFormatter: (x) => String(x).slice(0, 10),
              })}
            </div>

            <script type="application/json" id="tvlGrowthData">
              ${JSON.stringify(tvlGrowthSeriesByTf || {})}
            </script>
          </div>
        </div>

        <!-- ✅ KPI COLUMN (GLOBAL, ALL ASSETS) -->
        <div style="min-width:240px;display:flex;flex-direction:column;gap:10px">
          <div id="tvlTotalBox">
            ${miniKpiBox({ title: "Total TVL", value: fmtEUR0(tvlTotalDefault), subtitle: `Total (${defaultTvlTf})` })}
          </div>

          ${miniKpiBox({
            title: "Gross Return",
            value: `${Number(performance?.grossReturn || 0).toFixed(2)}%`,
            subtitle: "MTD",
          })}

          ${miniKpiBox({
            title: "Net return to Users",
            value: `${Number(performance?.netReturn || 0).toFixed(2)}%`,
            subtitle: "MTD",
          })}

          ${miniKpiBox({
            title: "Contribution to PNL",
            value: fmtEUR2(performance?.pnlContribution || 0),
            subtitle: "MTD",
          })}

          ${miniKpiBox({
            title: "Max DrawDown",
            value: `${Number(risk?.maxDrawdownPct || 0).toFixed(2)}%`,
            subtitle: "All-time",
          })}
        </div>
      </div>
    </section>
  `;

  /* ---------- Breakdown + Cumulative (full width & big) ---------- */
  const defaultTf = "monthly";
  const defaultAsset = tvlBreakdown?.[0]?.label || "Rosetta";

  const seriesDefault = cumulativeSeriesByTf?.[defaultTf] || [];
  const normDefault = normalizeSeries(seriesDefault);
  const totalDefault = normDefault.length ? normDefault[normDefault.length - 1].y : 0;

  const wrapperTabs = `
    <div class="tf-tabs" style="display:flex;gap:8px;align-items:center;justify-content:flex-end">
      <button class="btn cp-tf-btn" data-tf="daily" type="button">Daily</button>
      <button class="btn cp-tf-btn" data-tf="weekly" type="button">Weekly</button>
      <button class="btn cp-tf-btn active" data-tf="monthly" type="button">Monthly</button>
      <button class="btn cp-tf-btn" data-tf="ytd" type="button">Year to date</button>
    </div>
  `;

  const breakdownCard = `
    <div style="color:var(--muted);font-size:12px;margin-bottom:8px">Distribution</div>
    <div id="tvlBreakdownWrap">
      ${renderPieChartSVG(tvlBreakdown)}
    </div>
  `;

  const cumulativeCard = `
    <div style="display:flex;gap:16px;align-items:stretch">
      <div style="flex:1;min-width:0">
        <div style="color:var(--muted);font-size:12px;margin-bottom:8px">Trend</div>

        <div id="cumulativeChart"
             data-current-tf="${defaultTf}"
             data-current-asset="${defaultAsset}"
             style="height:300px;width:100%">
          ${renderLineChartSVG(seriesDefault, {
            width: 1800,
            height: 300,
            fit: true,
            paddingLeft: 120,
            paddingRight: 28,
            paddingBottom: 44,
            yLabelFormatter: (v) => fmtEUR0(v),
            xLabelFormatter: (x) => String(x).slice(0, 10),
          })}
        </div>

        <script type="application/json" id="cumulativeData">
          ${JSON.stringify(cumulativeSeriesByTf || {})}
        </script>
      </div>

      <div style="min-width:260px;display:flex">
        <div id="cumulativeTotal" style="width:100%">
          ${miniKpiBox({
            title: "Total Return",
            value: fmtEUR0(totalDefault),
            subtitle: `Total (${defaultTf})`,
          })}
        </div>
      </div>
    </div>
  `;

  const breakdownAndCum = `
    <section class="card xlarge">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px">
        <h3 style="margin:0">TVL Breakdown &amp; Cumulative Performance</h3>
        ${wrapperTabs}
      </div>

      <div style="
        display:grid;
        grid-template-columns: minmax(0,1.05fr) minmax(0,1.95fr);
        gap:18px;
        margin-top:12px;
        align-items:stretch;
        width:100%;
      ">
        <div style="min-width:0">
          <h3 style="margin:0">TVL Breakdown</h3>
          <div style="margin-top:12px">${breakdownCard}</div>
        </div>

        <div style="min-width:0">
          <h3 style="margin:0">Cumulative Performance</h3>
          <div style="margin-top:12px">${cumulativeCard}</div>
        </div>
      </div>
    </section>
  `;

  return `
    ${tvlGrowthCard}
    <div style="height:16px"></div>
    ${breakdownAndCum}
  `;
}

/* =========================
   Main render
========================= */
export function renderPlanPage(planKey) {
  if (planKey !== "smart") {
    return `
      <div class="grid">
        <section class="card xlarge">
          <h3>Page</h3>
          <div style="color:var(--muted);margin-top:10px">
            Placeholder per <b>${planKey}</b>. (Puoi replicare la struttura della DEFI Strategy.)
          </div>
        </section>
      </div>
    `;
  }

  const d = getDefiData();

  const topSections = renderTopSections({
    tvlGrowthSeriesByTf: d.tvlGrowthSeriesByTf,
    tvlBreakdown: d.tvlBreakdown,
    cumulativeSeriesByTf: d.cumulativeSeriesByTf,
    performance: d.performance,
    risk: d.risk,
  });

  // These two are drill-down targets (they change when you click Rosetta/Psalion/...)
  const perfCard = `
    <section class="card xlarge" id="perfCard">
      <h3>Performance &amp; Returns</h3>
      <div id="perfRow" class="macro-row" data-tone="green" style="--cols:3;margin-top:12px">
        ${miniKpiRow([
          { k: "Gross return", v: `${Number(d.performance.grossReturn || 0).toFixed(2)}%` },
          { k: "Net return to users", v: `${Number(d.performance.netReturn || 0).toFixed(2)}%` },
          { k: "Contribution to PnL", v: fmtEUR2(d.performance.pnlContribution) },
        ])}
      </div>
    </section>
  `;

  const riskCard = `
    <section class="card xlarge" id="riskCard">
      <h3>Risk Metrics</h3>
      <div id="riskRow" class="macro-row" data-tone="red" style="--cols:3;margin-top:12px">
        ${miniKpiRow([
          { k: "Drawdown", v: `${Number(d.risk.drawdownPct || 0).toFixed(2)}%` },
          { k: "Max drawdown per strategy", v: `${Number(d.risk.maxDrawdownPct || 0).toFixed(2)}%` },
          { k: "Exposure concentration", v: `${Number(d.risk.exposureConcentrationPct || 0).toFixed(2)}%` },
        ])}
      </div>
    </section>
  `;

  return `
    <div class="grid">
      ${topSections}
      <div style="height:16px"></div>
      ${perfCard}
      <div style="height:16px"></div>
      ${riskCard}
    </div>
  `;
}

/* =========================
   Interactions (tabs + drilldown)
========================= */
export function mountPlanPageInteractions() {
  /* ---------- TVL Growth Tabs ---------- */
  const tvlDataEl = document.getElementById("tvlGrowthData");
  const tvlChartEl = document.getElementById("tvlGrowthChart");
  const tvlTotalEl = document.getElementById("tvlTotalBox");
  const tvlButtons = Array.from(document.querySelectorAll(".tvl-tf-btn"));

  if (tvlDataEl && tvlChartEl && tvlTotalEl && tvlButtons.length) {
    let tvlByTf = {};
    try {
      tvlByTf = JSON.parse(tvlDataEl.textContent || "{}") || {};
    } catch {
      tvlByTf = {};
    }

    const setActiveTvlTf = (tf) => {
      tvlButtons.forEach((b) => b.classList.toggle("active", b.dataset.tf === tf));

      const series = tvlByTf?.[tf] || [];
      tvlChartEl.dataset.currentTf = tf;

      tvlChartEl.innerHTML = renderLineChartSVG(series, {
        width: 1600,
        height: 300,
        fit: true,
        paddingLeft: 120,
        paddingRight: 28,
        paddingBottom: 44,
        yLabelFormatter: (v) => fmtEUR0(v),
        xLabelFormatter: (x) => String(x).slice(0, 10),
      });

      const norm = normalizeSeries(series);
      const last = norm.length ? norm[norm.length - 1].y : 0;

      tvlTotalEl.innerHTML = miniKpiBox({
        title: "Total TVL",
        value: fmtEUR0(last),
        subtitle: `Total (${tf})`,
      });
    };

    tvlButtons.forEach((b) => b.addEventListener("click", () => setActiveTvlTf(b.dataset.tf)));
    setActiveTvlTf("monthly");
  }

  /* ---------- Cumulative + Drilldown ---------- */
  const cpChartEl = document.getElementById("cumulativeChart");
  const cpTotalEl = document.getElementById("cumulativeTotal");
  const cpButtons = Array.from(document.querySelectorAll(".cp-tf-btn"));
  const breakdownItems = Array.from(document.querySelectorAll(".tvl-bd-item"));

  const planData = getDefiData();

  const getAssetPayload = (assetLabel) => {
    const base = {
      cumulativeSeriesByTf: planData.cumulativeSeriesByTf,
      performance: planData.performance,
      risk: planData.risk,
    };

    const asset = planData?.assetClasses?.[assetLabel];
    if (!asset) return base;

    return {
      cumulativeSeriesByTf: asset?.cumulativeSeriesByTf || base.cumulativeSeriesByTf,
      performance: asset?.performance || base.performance,
      risk: asset?.risk || base.risk,
    };
  };

  const setActiveBreakdownItem = (assetLabel) => {
    breakdownItems.forEach((el) => {
      el.classList.toggle("is-active", el.dataset.asset === assetLabel);
    });
  };

  const renderPerfAndRisk = (perf, risk) => {
    const perfRow = document.getElementById("perfRow");
    const riskRow = document.getElementById("riskRow");

    if (perfRow) {
      perfRow.innerHTML = miniKpiRow([
        { k: "Gross return", v: `${Number(perf?.grossReturn || 0).toFixed(2)}%` },
        { k: "Net return to users", v: `${Number(perf?.netReturn || 0).toFixed(2)}%` },
        { k: "Contribution to PnL", v: fmtEUR2(perf?.pnlContribution || 0) },
      ]);
    }

    if (riskRow) {
      riskRow.innerHTML = miniKpiRow([
        { k: "Drawdown", v: `${Number(risk?.drawdownPct || 0).toFixed(2)}%` },
        { k: "Max drawdown per strategy", v: `${Number(risk?.maxDrawdownPct || 0).toFixed(2)}%` },
        { k: "Exposure concentration", v: `${Number(risk?.exposureConcentrationPct || 0).toFixed(2)}%` },
      ]);
    }
  };

  const setCumulativeView = ({ tf, assetLabel }) => {
    if (!cpChartEl || !cpTotalEl) return;

    const payload = getAssetPayload(assetLabel);

    cpButtons.forEach((b) => b.classList.toggle("active", b.dataset.tf === tf));
    setActiveBreakdownItem(assetLabel);

    const seriesByTf = payload.cumulativeSeriesByTf || {};
    const series = seriesByTf?.[tf] || [];

    cpChartEl.dataset.currentTf = tf;
    cpChartEl.dataset.currentAsset = assetLabel;

    // big responsive box
    cpChartEl.style.height = "300px";
    cpChartEl.style.width = "100%";

    cpChartEl.innerHTML = renderLineChartSVG(series, {
      width: 1800,
      height: 300,
      fit: true,
      paddingLeft: 120,
      paddingRight: 28,
      paddingBottom: 44,
      yLabelFormatter: (v) => fmtEUR0(v),
      xLabelFormatter: (x) => String(x).slice(0, 10),
    });

    const norm = normalizeSeries(series);
    const last = norm.length ? norm[norm.length - 1].y : 0;

    cpTotalEl.innerHTML = miniKpiBox({
      title: "Total Return",
      value: fmtEUR0(last),
      subtitle: `Total (${tf})`,
    });

    // drilldown only for these two sections:
    renderPerfAndRisk(payload.performance, payload.risk);
  };

  const defaultAsset = planData?.tvlBreakdown?.[0]?.label || "Rosetta";
  setCumulativeView({ tf: "monthly", assetLabel: defaultAsset });

  if (cpButtons.length) {
    cpButtons.forEach((b) =>
      b.addEventListener("click", () => {
        const tf = b.dataset.tf;
        const assetLabel = cpChartEl?.dataset?.currentAsset || defaultAsset;
        setCumulativeView({ tf, assetLabel });
      })
    );
  }

  if (breakdownItems.length) {
    breakdownItems.forEach((el) => {
      const handler = () => {
        const assetLabel = el.dataset.asset || defaultAsset;
        const tf = cpChartEl?.dataset?.currentTf || "monthly";
        setCumulativeView({ tf, assetLabel });
      };

      el.addEventListener("click", handler);
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") handler();
      });
    });
  }
}
