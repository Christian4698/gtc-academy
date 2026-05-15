export const metadata = {
  title: 'Mode hors ligne',
};

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <section className="offline-panel">
        <div className="offline-mark" aria-hidden="true">GTC</div>
        <p className="eyebrow">Mode hors ligne</p>
        <h1>Vos contenus recents restent accessibles.</h1>
        <p>
          La PWA garde l'interface et les ressources essentielles en cache. Revenez a l'accueil
          lorsque la connexion revient pour synchroniser les donnees.
        </p>
        <a className="primary-link" href="/">Revenir a l'accueil</a>
      </section>
    </main>
  );
}
