// Frontend/js/app.js

import { auth, onAuthStateChanged, signOut } from "./firebase.js";
import { renderAuthPage, mountAuthPageInteractions } from "./pages/auth.js";

import { renderUsersPage, mountUsersPageInteractions } from "./pages/users.js";
import {
  renderUsersOverviewPage,
  mountUsersOverviewPageInteractions,
} from "./pages/users_overview.js";

const { renderBinancePage, mountBinancePageInteractions } = await import("./pages/binance.js");
const { renderPlanPage, mountPlanPageInteractions } = await import("./pages/plan.js");
const { renderSettingsPage } = await import("./pages/settings.js");

const {
  renderSmartYieldUsersPage,
  mountSmartYieldUsersPageInteractions,
} = await import("./pages/smart_yield_users.js");

const {
  renderSmartYieldReconciliationPage,
  mountSmartYieldReconciliationPageInteractions,
} = await import("./pages/smart_yield_reconciliation.js");

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
   Route registry
======================= */
const ROUTES = {
  users: {
    title: "Summary Overview",
    render: renderUsersPage,
    mount: mountUsersPageInteractions,
  },
  users_overview: {
    title: "Users Overview",
    render: renderUsersOverviewPage,
    mount: mountUsersOverviewPageInteractions,
  },
  binance: {
    title: "Strategy Summary",
    render: renderBinancePage,
    mount: mountBinancePageInteractions,
  },
  smart_yield_users: {
    title: "Smart Yield",
    subtitle: "Users",
    render: renderSmartYieldUsersPage,
    mount: mountSmartYieldUsersPageInteractions,
  },
  smart_yield_reconciliation: {
    title: "Smart Yield",
    subtitle: "Reconciliation",
    render: renderSmartYieldReconciliationPage,
    mount: mountSmartYieldReconciliationPageInteractions,
  },
  smart: {
    title: "DEFI Strategy",
    subtitle: "Analisi strategica, allocation e performance.",
    render: () => renderPlanPage("smart"),
    mount: mountPlanPageInteractions,
  },
  premium: {
    title: "Non Custodial Wallets",
    subtitle: "Analisi strategica, allocation e performance.",
    render: () => renderPlanPage("premium"),
    mount: mountPlanPageInteractions,
  },
  settings: {
    title: "Settings",
    subtitle: "Placeholder per integrazioni: ruoli, permessi, notifiche, audit log.",
    render: renderSettingsPage,
  },
};

/* =======================
   Router
======================= */
function navigate(page) {
  const route = ROUTES[page];
  if (!route) { navigate("users"); return; }

  currentPage = page;
  setActive(page);
  setHeader(route.title, route.subtitle || "");
  content.innerHTML = route.render();
  if (route.mount) route.mount();
}

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
   Sidebar navigation delegation
   Scoped to sidebar to avoid conflicts with page-internal [data-page] elements
======================= */
const sidebar = document.querySelector(".sidebar");
if (sidebar) {
  sidebar.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-page]");
    if (!btn) return;

    e.preventDefault();
    e.stopPropagation();

    const page = btn.dataset.page;
    if (page) navigate(page);
  });
}

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
