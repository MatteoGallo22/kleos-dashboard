// Frontend/js/pages/auth.js
import { auth, signInWithEmailAndPassword } from "../firebase.js";

export function renderAuthPage() {
  return `
    <div class="auth-wrapper">
      <div class="auth-card">

        <div class="auth-logo">
          <img src="./assets/logo-kleos.svg" alt="Kleos Capital" />
        </div>

        <h2 class="auth-title">Kleos Capital</h2>
        <p class="auth-subtitle">Secure access to the dashboard</p>

        <div class="auth-form">
          <input id="authEmail" type="email" placeholder="Email" />
          <input id="authPassword" type="password" placeholder="Password" />
          <button class="btn primary auth-btn" id="btnLogin" type="button">Login</button>
          <p id="authError" class="auth-error"></p>
        </div>

      </div>
    </div>
  `;
}

export function mountAuthPageInteractions(onSuccess) {
  const emailInput = document.getElementById("authEmail");
  const passInput = document.getElementById("authPassword");
  const errorEl = document.getElementById("authError");

  async function doLogin() {
    errorEl.textContent = "";
    try {
      await signInWithEmailAndPassword(auth, emailInput.value.trim(), passInput.value);
      onSuccess();
    } catch {
      errorEl.textContent = "Invalid email or password";
    }
  }

  document.getElementById("btnLogin").addEventListener("click", doLogin);
  passInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLogin();
  });
}
