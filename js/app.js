// Frontend/js/app.js

import { auth, onAuthStateChanged, signOut } from "./firebase.js";
import { renderAuthPage, mountAuthPageInteractions } from "./pages/auth.js";

import { renderUsersPage, mountUsersPageInteractions } from "./pages/users.js";
import {
  renderUsersOverviewPage,
  mountUsersOverviewPageInteractions,
} from "./pages/users_overview.js";

// ✅ import per montare le interazioni dei piani (tabs timeframe in DEFI Strategy)
import { mountPlanPageInteractions } from "./pages/plan.js";

// ✅ cache-buster AUTOMATICO: aggiorna sempre i moduli durante lo sviluppo
const V = `v=${Date.now()}`;
const { renderBinancePage } = await import(`./pages/binance.js?${V}`);
const { renderPlanPage } = await import(`./pages/plan.js?${V}`);
const { renderSettingsPage } = await import(`./pages/settings.js?${V}`);

// ✅ NEW: Smart Yield sub-pages (separati per non sovraccaricare plan.js)
const {
  renderSmartYieldUsersPage,
  mountSmartYieldUsersPageInteractions,
} = await import(`./pages/smart_yield_users.js?${V}`);

const {
  renderSmartYieldReconciliationPage,
  mountSmartYieldReconciliationPageInteractions,
} = await import(`./pages/smart_yield_reconciliation.js?${V}`);

/* =======================
   DOM refs
======================= */
const content = document.getElementById("content");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");
const dataStatus = document.getElementById("dataStatus");

// Top buttons
const btnRefresh = document.getElementById("btnRefresh");
const btnExport = document.getElementById("btnExport");
const btnConnect = document.getElementById("btnConnect");

// Sidebar
const btnOmnibus = document.getElementById("btn-omnibus");
const navOmnibus = document.getElementById("nav-omnibus");

const btnUsers = document.getElementById("btn-users");
const navUsers = document.getElementById("nav-users");

const btnSettings = document.getElementById("btn-settings");

// Search input
const search = document.getElementById("search");

/* =======================
   State: pagina corrente
======================= */
let currentPage = "users";

/* =======================
   Auth mode (hide chrome)
======================= */
function setAuthMode(isAuthMode) {
  document.body.classList.toggle("auth-mode", isAuthMode);
}

/* =======================
   UI helpers
======================= */
function setHeader(title, subtitle = "") {
  if (pageTitle) pageTitle.textContent = title || "";
  if (pageSubtitle) pageSubtitle.textContent = subtitle || "";
}

function setActive(page) {
  document.querySelectorAll(".sub-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.page === page);
  });
}

function showAuth() {
  setAuthMode(true);
  currentPage = "auth";
  setHeader("Login", "Accedi per continuare.");
  if (content) content.innerHTML = renderAuthPage();

  mountAuthPageInteractions(() => {
    setAuthMode(false);
    navigate("users");
  });
}

/* =======================
   Router
======================= */
function navigate(page) {
  currentPage = page;
  setActive(page);

  // 🔎 DEBUG: traccia SEMPRE il routing
  console.log("[NAVIGATE] page =", page);

  // Users
  if (page === "users") {
    setHeader("Summary Overview", "");
    content.innerHTML = renderUsersPage();
    mountUsersPageInteractions();
    return;
  }

  // Users Overview
  if (page === "users_overview") {
    setHeader("Users Overview", "");
    content.innerHTML = renderUsersOverviewPage();
    mountUsersOverviewPageInteractions();
    return;
  }

  // Strategy Summary (ex Binance overview)
  if (page === "binance") {
    setHeader("Strategy Summary", "");
    content.innerHTML = renderBinancePage();
    return;
  }

  // ✅ NEW: Smart Yield -> Users
  if (page === "smart_yield_users") {
    setHeader("Smart Yield", "Users");

    // guardrail: se export mismatch, lo vedi subito a schermo
    if (typeof renderSmartYieldUsersPage !== "function") {
      console.error("renderSmartYieldUsersPage missing or not a function", {
        renderSmartYieldUsersPage,
      });
      content.innerHTML = `<div style="padding:20px">❌ renderSmartYieldUsersPage non è una funzione (export mismatch)</div>`;
      return;
    }

    content.innerHTML = renderSmartYieldUsersPage();

    if (typeof mountSmartYieldUsersPageInteractions === "function") {
      mountSmartYieldUsersPageInteractions();
    } else {
      console.warn(
        "mountSmartYieldUsersPageInteractions missing (ok se non serve)"
      );
    }
    return;
  }

  // ✅ NEW: Smart Yield -> Reconciliation
  if (page === "smart_yield_reconciliation") {
    setHeader("Smart Yield", "Reconciliation");

    if (typeof renderSmartYieldReconciliationPage !== "function") {
      console.error(
        "renderSmartYieldReconciliationPage missing or not a function",
        { renderSmartYieldReconciliationPage }
      );
      content.innerHTML = `<div style="padding:20px">❌ renderSmartYieldReconciliationPage non è una funzione (export mismatch)</div>`;
      return;
    }

    content.innerHTML = renderSmartYieldReconciliationPage();

    if (typeof mountSmartYieldReconciliationPageInteractions === "function") {
      mountSmartYieldReconciliationPageInteractions();
    } else {
      console.warn(
        "mountSmartYieldReconciliationPageInteractions missing (ok se non serve)"
      );
    }
    return;
  }

  // Plans (DEFI Strategy / Non Custodial Wallets)
  if (page === "smart" || page === "premium") {
    const map = {
      smart: "DEFI Strategy",
      premium: "Non Custodial Wallets",
    };
    const name = map[page];

    setHeader(name, "Analisi strategica, allocation e performance.");
    content.innerHTML = renderPlanPage(page);

    // ✅ monta interazioni della pagina piano (tabs timeframe ecc.)
    mountPlanPageInteractions();
    return;
  }

  // Settings
  if (page === "settings") {
    setHeader(
      "Settings",
      "Placeholder per integrazioni: ruoli, permessi, notifiche, audit log."
    );
    content.innerHTML = renderSettingsPage();
    return;
  }

  // Default
  navigate("users");
}

// Optional: allow pages to call navigation
window.navigate = navigate;

/* =======================
   ✅ TEST 2: CLICK LOGGER (CAPTURE
   Capisce chi prende davvero il click)
======================= */
document.addEventListener(
  "click",
  (e) => {
    const target = e.target;
    const dataBtn = target?.closest?.("[data-page]");
    console.log(
      "[CLICK CAPTURE]",
      "target=",
      target,
      "| closest [data-page]=",
      dataBtn ? dataBtn.dataset.page : undefined
    );
  },
  true // capture
);

/* =======================
   Sidebar wiring
======================= */
if (btnOmnibus && navOmnibus) {
  btnOmnibus.addEventListener("click", (e) => {
    // evitiamo che il click faccia cose strane con delegation
    e.preventDefault();
    e.stopPropagation();
    navOmnibus.classList.toggle("open");
  });
}

if (btnUsers && navUsers) {
  btnUsers.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    navUsers.classList.toggle("open");
    // click sul gruppo porta alla pagina users
    navigate("users");
  });
}

// Settings
if (btnSettings) {
  btnSettings.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigate("settings");
  });
}

/* =======================
   ✅ CLICK HANDLER ROBUSTO (DELEGATION)
   Gestisce TUTTI i bottoni con data-page
   anche se DOM cambia / classi cambiano
======================= */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-page]");
  if (!btn) return;

  // se è un bottone dentro subnav, impediamo side-effects
  e.preventDefault();
  e.stopPropagation();

  const page = btn.dataset.page;
  if (!page) return;

  navigate(page);
});

/* =======================
   Topbar buttons
======================= */
if (btnRefresh) {
  btnRefresh.addEventListener("click", () => {
    if (dataStatus) dataStatus.textContent = "Refreshed";
    const pageToReload =
      currentPage && currentPage !== "auth" ? currentPage : "users";
    navigate(pageToReload);
  });
}

if (btnExport) {
  btnExport.addEventListener("click", () => {
    alert("Export (demo): qui puoi generare CSV/PDF dal backend.");
  });
}

// Logout
if (btnConnect) {
  btnConnect.textContent = "🚪 Logout";
  btnConnect.addEventListener("click", async () => {
    try {
      await signOut(auth);
      if (dataStatus) dataStatus.textContent = "Signed out";
      showAuth();
    } catch (e) {
      alert("Logout error: " + (e?.message || e));
    }
  });
}

/* =======================
   Search behavior (demo)
======================= */
if (search) {
  search.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const q = search.value.trim().toLowerCase();
      if (!q) return;

      if (
        q.includes("users overview") ||
        (q.includes("overview") && q.includes("users"))
      )
        return navigate("users_overview");

      if (
        q.includes("strategy summary") ||
        (q.includes("strategy") && q.includes("summary"))
      )
        return navigate("binance");

      // ✅ NEW: search shortcuts for Smart Yield sub-pages
      if (
        q.includes("smart yield users") ||
        (q.includes("smart") && q.includes("users"))
      )
        return navigate("smart_yield_users");

      if (
        q.includes("reconciliation") ||
        q.includes("riconcil") ||
        (q.includes("smart") && q.includes("recon"))
      )
        return navigate("smart_yield_reconciliation");

      if (q.includes("defi") || q.includes("smart")) return navigate("smart");
      if (q.includes("non custodial") || q.includes("wallet"))
        return navigate("premium");

      if (q.includes("users")) return navigate("users");
      if (q.includes("binance")) return navigate("binance");
      if (q.includes("settings")) return navigate("settings");

      document.querySelector(".main")?.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  window.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      search.focus();
    }
  });
}

/* =======================
   Auth gate (BOOTSTRAP)
======================= */
onAuthStateChanged(auth, (user) => {
  if (!user) {
    showAuth();
  } else {
    setAuthMode(false);
    navigate("users");
  }
});
