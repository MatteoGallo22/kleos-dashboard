// Frontend/js/pages/settings.js
export function renderSettingsPage() {
  return `
    <div class="grid">
      <section class="card xlarge">
        <h3>Configurazioni <span class="hint">Placeholder</span></h3>

        <div class="split">
          <div class="kv"><div class="k">Binance API</div><div class="val">Non connesso (demo)</div></div>
          <div class="kv"><div class="k">Ambiente</div><div class="val">Production</div></div>
          <div class="kv"><div class="k">Ruoli</div><div class="val">Admin / Viewer</div></div>
          <div class="kv"><div class="k">Audit log</div><div class="val">(to-do)</div></div>
        </div>

        <table class="table" aria-label="Settings table">
          <thead><tr><th>Sezione</th><th>Descrizione</th><th>Stato</th></tr></thead>
          <tbody>
            <tr><td>API keys</td><td>Gestione chiavi e permessi</td><td><span class="pill"><span class="dot warn"></span>Da fare</span></td></tr>
            <tr><td>Notifiche</td><td>Email/Telegram per alert</td><td><span class="pill"><span class="dot warn"></span>Da fare</span></td></tr>
            <tr><td>Export</td><td>CSV/PDF report</td><td><span class="pill"><span class="dot warn"></span>Da fare</span></td></tr>
          </tbody>
        </table>
      </section>
    </div>
  `;
}
