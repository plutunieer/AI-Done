export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">B</div>
          <span className="font-semibold text-gray-900 text-xl">AI Done</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Datenschutzerklärung</h1>
        <p className="text-gray-400 text-sm mb-10">Letzte Aktualisierung: Mai 2026</p>

        <div className="space-y-8 text-gray-600 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Verantwortlicher</h2>
            <p>Verantwortlich für die Datenverarbeitung auf dieser Plattform ist der Betreiber von defipal.io. Bei Fragen zum Datenschutz wenden Sie sich bitte an: <a href="mailto:info@defipal.io" className="text-blue-500 hover:underline">info@defipal.io</a></p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Welche Daten wir erheben</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong>Kontodaten:</strong> Name, E-Mail-Adresse und Passwort (verschlüsselt gespeichert)</li>
              <li><strong>Google Kalender-Daten:</strong> Termine und Ereignisse aus Ihrem Google Kalender, sofern Sie die Verbindung autorisieren</li>
              <li><strong>Aufgaben &amp; Ziele:</strong> Von Ihnen erstellte Tasks, Projekte und Gesprächsverläufe mit dem KI-Assistenten</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Verwendung von Google Kalender</h2>
            <p>AI Done greift mit Ihrer ausdrücklichen Zustimmung auf Ihren Google Kalender zu. Wir verwenden diese Daten ausschliesslich um:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Bestehende Termine zu lesen und bei der Planung zu berücksichtigen</li>
              <li>Neue Termine in Ihrem Namen zu erstellen</li>
              <li>Termine zu löschen oder zu verschieben, wenn Sie dies anfordern</li>
            </ul>
            <p className="mt-3">Ihre Kalender-Daten werden nicht an Dritte weitergegeben und nicht für Werbezwecke verwendet. Sie können den Zugriff jederzeit unter <a href="https://myaccount.google.com/permissions" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">myaccount.google.com/permissions</a> widerrufen.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Datenspeicherung</h2>
            <p>Ihre Daten werden in einer gesicherten Datenbank (Neon Postgres) gespeichert. Passwörter werden ausschliesslich in verschlüsselter Form gespeichert (bcrypt). Google OAuth-Tokens werden ebenfalls verschlüsselt gespeichert und nur zur Kommunikation mit der Google Calendar API verwendet.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">5. KI-Verarbeitung</h2>
            <p>Gespräche mit dem KI-Assistenten werden an die Anthropic API (Claude) übermittelt zur Verarbeitung. Anthropic verarbeitet diese Daten gemäss ihrer eigenen <a href="https://www.anthropic.com/privacy" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Datenschutzerklärung</a>. Gesprächsverläufe werden in unserer Datenbank gespeichert damit der Kontext erhalten bleibt.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Ihre Rechte</h2>
            <p>Sie haben jederzeit das Recht auf:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Auskunft über Ihre gespeicherten Daten</li>
              <li>Berichtigung unrichtiger Daten</li>
              <li>Löschung Ihres Kontos und aller zugehörigen Daten</li>
              <li>Widerruf der Google Kalender-Berechtigung</li>
            </ul>
            <p className="mt-3">Für Löschanfragen wenden Sie sich an: <a href="mailto:info@defipal.io" className="text-blue-500 hover:underline">info@defipal.io</a></p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Cookies</h2>
            <p>AI Done verwendet ausschliesslich einen technisch notwendigen Session-Cookie zur Authentifizierung. Dieser Cookie enthält keine persönlichen Daten und wird beim Abmelden gelöscht.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Änderungen</h2>
            <p>Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf zu aktualisieren. Wesentliche Änderungen werden Ihnen per E-Mail mitgeteilt.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-100">
          <a href="/" className="text-sm text-blue-500 hover:underline">← Zurück zu AI Done</a>
        </div>
      </div>
    </div>
  );
}
