# 🖥 guber.uz — noutbukda server (Docker + Cloudflare Tunnel)

```
Mehmon ──► Cloudflare (guber.uz, HTTPS) ──► Tunnel ──► Noutbuk: Docker ──► nginx ──► sayt fayllari
```

- **Oq IP kerak emas**, routerda port ochish shart emas (Cloudflare Tunnel).
- Sayt fayllari: repozitoriy ildizidagi `index.html`, `style.css`, `app.js`, `assets/`...
  Ularni yangilasangiz sayt darhol yangilanadi, serverni qayta ishga tushirish shart emas.
- `server/` papkasi, `.git` va `.env` tashqaridan ko'rinmaydi (nginx yopib qo'ygan).

Jami 4 qadam bor. **👤 belgili joylarni siz qilasiz**, qolganini skript o'zi bajaradi.

---

## 1-qadam 👤 Kodni noutbukka ko'chirish

**Git bilan (tavsiya):**
```bash
git clone https://github.com/qoshniniogli-cell/guber.git
cd guber
```
**Yoki ZIP:** GitHub → repozitoriy → yashil **Code** tugmasi → **Download ZIP**, keyin arxivdan chiqaring.

> guber.uz saytingizning boshqa kodlari bo'lsa, ularni shu papkaning **ildiziga** qo'ying
> (`index.html` ildizda turishi kerak). `server/` papkasiga tegmang.

## 2-qadam 👤 Domenni Cloudflare'ga qo'shish (bir marta)

1. https://dash.cloudflare.com da ro'yxatdan o'ting → **Add a domain** → `guber.uz` → **Free** tarifini tanlang.
2. Cloudflare hozirgi DNS yozuvlaringizni ko'rsatadi. **MX** (pochta) yozuvlari bo'lsa, ular ro'yxatda
   borligini tekshiring va **Continue** bosing.
3. Cloudflare sizga 2 ta nameserver beradi (masalan `xxx.ns.cloudflare.com`).
   Domenni qayerdan sotib olgan bo'lsangiz (.uz registratori panelida), **NS serverlarni shu ikkitasiga
   almashtiring**.
4. Kuting: odatda 1–2 soat, eng ko'pi bilan 24 soat. Cloudflare'da domen yonida **Active** yozuvi chiqadi.

> NS hali o'tmagan bo'lsa ham 3–4-qadamlarni qilaversangiz bo'ladi. Sayt NS o'tgandan keyin ochiladi.

## 3-qadam 👤 Cloudflare API token yaratish (bir marta)

**My Profile → API Tokens → Create Token → Create Custom Token** bo'limiga kiring.

| Tur | Ruxsat | Daraja |
|---|---|---|
| Account | Cloudflare Tunnel | Edit |
| Zone | Zone | Read |
| Zone | DNS | Edit |
| Zone | Zone Settings | Edit |
| Zone | Zone WAF | Edit |
| Zone | Bot Management | Edit |

- **Zone Resources:** Include → Specific zone → `guber.uz`
- **Account Resources:** Include → hisobingiz

**Create Token** tugmasini bosing va tokenni nusxalab oling. U faqat bir marta ko'rsatiladi.

> Token faqat sozlash paytida kerak, hech qayerga saqlanmaydi. Server sozlanib bo'lgach, uni
> Cloudflare'da o'chirib tashlasangiz ham bo'ladi (sayt ishlashda davom etadi).

## 4-qadam 👤 O'rnatish skriptini ishga tushirish (qolganini skript qiladi)

### Windows
1. **Docker Desktop** o'rnating: https://www.docker.com/products/docker-desktop/ (WSL2 so'rasa rozi bo'ling),
   kompyuterni qayta yoqing va Docker Desktop'ni oching.
2. `guber\server` papkasida PowerShell oching (papkada Shift + o'ng tugma → *Open PowerShell window here*):
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\install-windows.ps1
   ```
3. Docker Desktop → **Settings → General → "Start Docker Desktop when you sign in"** ni yoqing.

### Linux (Ubuntu)
```bash
cd guber/server
bash install-linux.sh
```

### Skript nima qiladi
- ✅ Docker ishlayotganini tekshiradi (Linux'da kerak bo'lsa o'zi o'rnatadi)
- ✅ Noutbuk zaryadda uxlab qolmaydigan va qopqoq yopilsa ham ishlaydigan qilib sozlaydi
- ✅ API tokenni so'raydi va Cloudflare'ni to'liq sozlaydi:
  - tunnel yaratadi, `guber.uz` va `www.guber.uz` ni noutbukka yo'naltiradi
  - **"Verify you are human" chiqmasligi uchun:** Security Level = *Essentially Off*,
    Browser Integrity Check = *Off*, Bot Fight Mode = *Off*, O'zbekiston IP'lari uchun WAF *Skip* qoidasi
  - Always Use HTTPS'ni yoqadi
- ✅ Serverni ishga tushiradi va `http://localhost:8080` ni ochadi

> ⚠️ guber.uz hozir boshqa hostingda ishlayotgan bo'lsa, skript eski yozuvlarni ko'rsatadi va
> **o'chirishdan oldin sizdan so'raydi** (`ha` / `yo'q`). Pochta (MX) yozuvlariga tegmaydi.

---

## 5-qadam (faqat skript ⚠️ ko'rsatsa) 👤 Qo'lda sozlash

| Cloudflare panelida | Qiymat |
|---|---|
| Security → Settings → Security Level | Essentially Off |
| Security → Settings → Browser Integrity Check | Off |
| Security → Bots → Bot Fight Mode | Off |
| Security → WAF → Custom rules → Create rule | Nomi: `UZ skip`; *Field* `Country` *equals* `Uzbekistan`; *Action* **Skip** → hamma katakchalarni belgilang → Deploy |
| **Hech qachon yoqmang:** "I'm Under Attack" rejimi | — |

---

## Kundalik ishlar

Buyruqlarni `server` papkasida yozasiz:

| Nima kerak | Buyruq |
|---|---|
| Holatni ko'rish | `docker compose ps` |
| Jurnal (xatolar) | `docker compose logs -f --tail 50` |
| To'xtatish | `docker compose down` |
| Qayta ishga tushirish | `docker compose up -d` |
| Saytni GitHub'dan yangilash | `git pull` (repozitoriy papkasida), qayta ishga tushirish shart emas |
| Cloudflare'ni qayta sozlash | `docker compose run --rm cf-setup` |

## Muammo bo'lsa

| Belgi | Yechim |
|---|---|
| `localhost:8080` ochiladi, lekin guber.uz ochilmaydi | `docker compose logs tunnel` buyrug'ini ishga tushiring. `Registered tunnel connection` chiqishi kerak. Cloudflare'da domen **Active** ekanini tekshiring |
| Tunnel tez-tez uziladi | `.env` faylida `CF_PROTOCOL=http2` qiling, keyin `docker compose up -d` |
| Baribir "Verify you are human" chiqyapti | 5-qadamni tekshiring. Security → Events bo'limi qaysi qoida ishlaganini ko'rsatadi |
| Svet o'chib qaytgandan keyin sayt ishlamayapti | Windows'da tizimga kiring (Docker Desktop foydalanuvchi kirganda yonadi). BIOS'da *Restore on AC power loss = On* bo'lsa, noutbuk o'zi yonadi |
