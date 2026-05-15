import Image from 'next/image';
import { ConnectivityChip } from './connectivity-chip';
import { InstallButton } from './install-button';

const tracks = [
  { label: 'Excel Pro', progress: '72%', tone: 'cyan' },
  { label: 'Data Analysis', progress: '48%', tone: 'green' },
  { label: 'BI Dashboards', progress: '31%', tone: 'purple' },
];

const stats = [
  { label: 'Cours', value: '18' },
  { label: 'Certificats', value: '04' },
  { label: 'Score', value: '89%' },
];

export default function Home() {
  return (
    <main className="app-shell">
      <section className="topbar" aria-label="GTC Academy">
        <div className="brand-lockup">
          <Image src="/icons/icon-96.png" alt="" width={44} height={44} priority />
          <div>
            <p className="eyebrow">GTC Academy</p>
            <h1>Learning cockpit</h1>
          </div>
        </div>
        <ConnectivityChip />
      </section>

      <section className="hero-panel" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">Premium mobile</p>
          <h2 id="hero-title">Excel, data et BI dans une experience installable.</h2>
          <p>
            Reprenez vos parcours, gardez les ressources essentielles hors ligne et preparez
            la publication Android avec une base PWA propre.
          </p>
        </div>
        <InstallButton />
      </section>

      <section className="stats-grid" aria-label="Progression">
        {stats.map((item) => (
          <article className="stat-tile" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </article>
        ))}
      </section>

      <section className="section-block" id="courses" aria-labelledby="courses-title">
        <div className="section-heading">
          <p className="eyebrow">Continue</p>
          <h2 id="courses-title">Parcours actifs</h2>
        </div>
        <div className="track-list">
          {tracks.map((track) => (
            <article className={`track-card track-${track.tone}`} key={track.label}>
              <div>
                <h3>{track.label}</h3>
                <p>Progression synchronisee avec le cache local.</p>
              </div>
              <strong>{track.progress}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="premium-band" id="premium" aria-labelledby="premium-title">
        <div>
          <p className="eyebrow">Premium</p>
          <h2 id="premium-title">APK/AAB ready</h2>
          <p>Export statique Next, service worker, manifest Android et pont Capacitor separes.</p>
        </div>
        <a className="primary-link" href="#courses">Ouvrir</a>
      </section>

      <nav className="bottom-nav" aria-label="Navigation principale">
        <a href="/" aria-current="page">Home</a>
        <a href="#courses">Cours</a>
        <a href="#premium">Premium</a>
      </nav>
    </main>
  );
}
