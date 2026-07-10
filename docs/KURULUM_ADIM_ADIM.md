# Kurulum adım adım

## 1. Yeni GitHub repo

Eski `sampa-vadi-ai-web-pro` reposunu kullanma. Yeni repo aç:

```text
dijital-tesis-platformu
```

ZIP içindeki **Dijital_Tesis_Platformu_v1** klasörünün içindeki dosya ve klasörleri GitHub'a yükle.

## 2. Supabase

Yeni Supabase projesi aç.

SQL Editor'a gir, şu dosyanın içeriğini çalıştır:

```text
database/001_SUPABASE_SETUP.sql
```

## 3. Vercel Environment Variables

Vercel > Project > Settings > Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=anon veya publishable key
SUPABASE_SERVICE_ROLE_KEY=service_role veya secret key
ADMIN_EMAILS=cingozarslanmurat@gmail.com
OPENAI_MODEL=gpt-4.1-mini
OPENAI_API_KEY=sk-...
```

OPENAI_API_KEY yoksa sistem açılır; AI tarafı yerel sınırlı planlayıcıyla çalışır. Gerçek AI için API key gerekir.

## 4. Deploy

Vercel'de Deploy'a bas. İlk kayıt olduğunda ADMIN_EMAILS içinde yazan e-posta otomatik admin olur.

## 5. Kullanım

- Giriş yap.
- Projeler > Yeni Proje.
- Boş Tesis Projesi seç.
- PC Modu veya Mobil Mod ile aç.
- Sol panelden bina/envanter ekle.
- Sağ panelden AI komut planı oluştur.
- Planı onayla, proje verisine kaydedilsin.
