import Image from 'next/image';

export default function Loading() {
  return (
    <main className="splash-screen" aria-label="Chargement">
      <Image src="/splash.svg" alt="" width={180} height={354} priority />
    </main>
  );
}
