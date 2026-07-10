import Link from 'next/link';
import { PublicHeader } from '@/components/PublicHeader';

const modules = [
  ['01', 'Proje Yönetimi', 'Her kullanıcı kendi dijital tesis projelerini oluşturur, düzenler, kopyalar ve güvenli şekilde arşivler.'],
  ['02', 'AI Komut Motoru', 'Doğal dilde verilen komutlar güvenli işlem planına çevrilir ve kullanıcı onayıyla proje verisine uygulanır.'],
  ['03', 'Envanter Kütüphanesi', 'Makine, raf, levha, yangın ekipmanı ve özel varlıklar proje bazlı saklanır.'],
  ['04', 'Admin ve Yetki', 'Admin tüm kullanıcıları, projeleri, silinen kayıtları ve değişiklik geçmişini denetler.'],
  ['05', 'PC / Mobil Görünüm', 'Projeler geniş ekran düzenleme veya mobil saha görüntüleme modunda açılır.'],
  ['06', 'Geri Alma ve Yedek', 'Her kritik değişiklik kayda alınır; gerektiğinde önceki proje durumuna dönülür.']
];

export default function HomePage() {
  return (
    <main className="page-shell">
      <PublicHeader />
      <section className="container hero">
        <div>
          <span className="eyebrow">Endüstriyel SaaS Platformu</span>
          <h1>Endüstriyel tesis projelerini tek merkezden yöneten AI destekli sistem.</h1>
          <p className="lead">
            Dijital Tesis; fabrika, depo, saha, ekipman, İSG levhası ve envanter yerleşimlerini
            kullanıcı bazlı projelerle yönetmek için tasarlanmış kurumsal bir çalışma platformudur.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/auth">Sisteme Giriş</Link>
            <Link className="btn" href="#cozumler">Platformu İncele</Link>
          </div>
        </div>
        <div className="panel hero-card" aria-label="Platform önizlemesi">
          <div className="browser-bar"><span className="dot" /><span className="dot" /><span className="dot" /> Dijital Tesis / Proje Editörü</div>
          <div className="preview-grid">
            <div className="preview-main"><div className="building-preview" /></div>
            <div className="preview-side">
              <div className="metric"><strong>Veri tabanlı</strong><span>Dosya versiyonu üretmeden çalışma</span></div>
              <div className="metric"><strong>AI planlı</strong><span>Onaylı değişiklik motoru</span></div>
              <div className="metric"><strong>Kurumsal</strong><span>Admin, profil ve yetki yönetimi</span></div>
            </div>
          </div>
          <p>Boş projeden başlayın, bina/aks/envanter ekleyin, AI ile kontrollü değişiklik uygulayın.</p>
        </div>
      </section>

      <section id="cozumler" className="container section">
        <h2>Platform modülleri</h2>
        <p className="lead">Gösteriş için değil, gerçek proje yönetimi için tasarlanmış sade ve denetlenebilir modüller.</p>
        <div className="grid-3" style={{ marginTop: 22 }}>
          {modules.map(([n, title, text]) => (
            <article className="panel feature" key={n}>
              <div className="num">{n}</div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="platform" className="container section">
        <div className="panel feature">
          <h2>Temel prensip: sabit uygulama, değişken proje verisi.</h2>
          <p>
            Proje düzenlemeleri artık HTML dosyasını değiştirmez. Bina, makine, raf, levha, katman ve notlar
            proje verisi olarak saklanır. AI da bu veriyi güvenli komutlarla günceller.
          </p>
          <div className="actions"><Link className="btn accent" href="/auth">Yeni Proje Oluştur</Link></div>
        </div>
      </section>
    </main>
  );
}
