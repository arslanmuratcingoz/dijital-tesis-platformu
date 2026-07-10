import Link from 'next/link';
import Image from 'next/image';

export function PublicHeader() {
  return (
    <header className="topbar">
      <Link href="/" className="brand" aria-label="Dijital Tesis ana sayfa">
        <Image src="/brand/lion-logo.png" alt="Dijital Tesis marka logosu" width={48} height={48} />
        <span>
          <span className="brand-title">Dijital Tesis</span>
          <span className="brand-sub">AI Destekli Tesis Yönetimi</span>
        </span>
      </Link>
      <nav className="nav" aria-label="Ana menü">
        <Link href="/#cozumler">Çözümler</Link>
        <Link href="/#platform">Platform</Link>
        <Link href="/auth">Giriş</Link>
        <Link href="/auth" className="primary">Projelerime Git</Link>
      </nav>
    </header>
  );
}
