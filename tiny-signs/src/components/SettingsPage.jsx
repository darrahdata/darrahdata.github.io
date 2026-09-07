export default function SettingsPage({ settings, onChangeSettings, onResetProgress }) {
  return (
    <main id="main-content" className="page-shell settings-page">
      <div className="page-intro">
        <p className="eyebrow">Make it comfortable</p>
        <h1>Settings</h1>
        <p>Your progress stays in this browser. Videos and preview images load from YouTube; the optional camera mirror is never uploaded.</p>
      </div>
      <div className="settings-grid">
        <section className="card setting-card">
          <div><p className="eyebrow">Signing hand</p><h2>Which hand feels natural?</h2><p>Use the same comfortable hand consistently. Human videos keep the original signer’s orientation.</p></div>
          <div className="segmented-control">
            <button type="button" className={settings.dominantHand === "right" ? "selected" : ""} aria-pressed={settings.dominantHand === "right"} onClick={() => onChangeSettings({ dominantHand: "right" })}>Right</button>
            <button type="button" className={settings.dominantHand === "left" ? "selected" : ""} aria-pressed={settings.dominantHand === "left"} onClick={() => onChangeSettings({ dominantHand: "left" })}>Left</button>
          </div>
        </section>
        <section className="card setting-card">
          <div><p className="eyebrow">Display</p><h2>Low-light mode</h2><p>Use a darker, softer screen during overnight routines.</p></div>
          <button type="button" className="button secondary" aria-pressed={settings.lowLight} onClick={() => onChangeSettings({ lowLight: !settings.lowLight })}>{settings.lowLight ? "Use day mode" : "Use low light"}</button>
        </section>
        <section className="card setting-card">
          <div><p className="eyebrow">Lesson depth</p><h2>Optional details</h2><p>Quick mode stays short. Learn mode adds exact technique and common mix-ups.</p></div>
          <button type="button" className="button secondary" aria-pressed={settings.learnMore} onClick={() => onChangeSettings({ learnMore: !settings.learnMore })}>{settings.learnMore ? "Use quick mode" : "Show learn mode"}</button>
        </section>
        <section className="card setting-card privacy-setting">
          <div><p className="eyebrow">Camera privacy</p><h2>Your mirror stays here.</h2><p>The camera opens only after you tap. Video is not recorded, stored, uploaded, or analyzed, and the camera stops when you close or leave practice.</p></div>
          <span aria-hidden="true">◎</span>
        </section>
        <section className="card setting-card reset-setting">
          <div><p className="eyebrow">Local history</p><h2>Reset practice history</h2><p>This clears only practice and modeled counts saved in this browser.</p></div>
          <button type="button" className="button danger" onClick={onResetProgress}>Reset local history</button>
        </section>
      </div>
    </main>
  );
}
