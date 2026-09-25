# guber.uz — loyiha holati (keyingi sessiya uchun)

> Bu fayl Claude Code uchun loyiha konteksti. Local sessiya uni avtomatik o'qiydi.
> Foydalanuvchi bilan **o'zbek tilida** gaplashing.

## Maqsad
Foydalanuvchi o'z **noutbukida** (Docker orqali) server ko'tarmoqchi va unga quyidagilarni ulamoqchi:
1. **guber.uz** saytini joylash.
2. **Cloudflare** orqali internetga chiqarish. Talab: mehmonlarga "Verify you are human" va boshqa
   challenge oynalari **chiqmasligi** kerak.
3. Keyingi bosqichda **Telegram bot(lar)** va **Python backend** ulash.

Hozirgi sharoit (O'zbekiston):
- Provayderlar ko'pincha CGNAT beradi, ya'ni oq IP yo'q. Shu sababli **Cloudflare Tunnel** tanlangan.
- Svet o'chib turadi.
- Noutbuk doim yoniq turishi kerak.

## Foydalanuvchi bilan ishlash tartibi
- "Qayerda men kerak bo'lsam o'zim qilaman, qolganini sen qil" degan. Ya'ni hamma narsani
  skript/avtomatika qilib bering, qo'lda qilinadigan joylarni 👤 bilan aniq ko'rsating.
- Foydalanuvchi o'zi qilishi kerak bo'lgan ishlar:
  - domenni Cloudflare'ga qo'shish va NS'ni o'zgartirish;
  - API token yaratish;
  - Docker Desktop o'rnatish (Windows bo'lsa).
- Noutbukning OS'i (Windows yoki Linux) **hali aniqlanmagan**. Ikkalasi uchun ham skript bor.
- Foydalanuvchi guber.uz saytining **asl kodlarini hali bermagan** ("olib beraman" degan).
  Repodagi hozirgi kontent: onlayn to'y taklifnomasi (statik HTML/JS).

## Tuzilma
```
/                      ← SAYT (nginx shu papkani tarqatadi). index.html ildizda bo'lishi shart
  index.html app.js style.css config.js   ← to'y taklifnomasi (window.INVITE sozlamalari config.js da)
  editor.html editor.js editor.css        ← vizual muharrir, config.js ni yuklab beradi
  assets/                                 ← rasm/video/musiqa
  .nojekyll                               ← GitHub Pages uchun
server/                ← SERVER (tashqaridan ko'rinmaydi, nginx 404 qaytaradi)
  docker-compose.yml   ← web (nginx:1.27-alpine), tunnel (cloudflared, profile "tunnel"),
                         cf-setup (python:3.12-alpine, profile "setup")
  nginx/default.conf   ← /server/ va nuqtali fayllar (.git, .env) → 404; CF-Connecting-IP real_ip; gzip; kesh 7 kun
  cloudflare/setup.py  ← Cloudflare API orqali avtomatik sozlash (faqat stdlib, idempotent)
  install-windows.ps1  ← Docker tekshiradi, powercfg (uyqu/qopqoq), .env, cf-setup, compose up
  install-linux.sh     ← Docker o'rnatadi (get.docker.com), logind lid ignore, sleep mask, cf-setup, compose up
  .env.example         ← DOMAIN, CF_TUNNEL_TOKEN, COMPOSE_PROFILES, CF_PROTOCOL
  QOLLANMA.md          ← foydalanuvchi uchun o'zbekcha qadamma-qadam yo'riqnoma
```
- `server/.env` gitignore'da. U yerda tunnel tokeni turadi, **commit qilmang**.
- Web konteyner `127.0.0.1:8080` portida ochiq (lokal tekshiruv uchun).
- Repo ildizi konteynerga `:ro` rejimida ulangan, shuning uchun fayl o'zgarsa sayt darhol yangilanadi.

## cloudflare/setup.py nima qiladi
- **Token olish:** API tokenni `getpass` bilan so'raydi yoki `CF_API_TOKEN` env'dan oladi. Token saqlanmaydi.
- **Zona:** `GET /zones?name=DOMAIN` so'rovidan zona topiladi, `account_id` ham shu javobdan olinadi.
- **Tunnel:**
  - `guber-noutbuk` nomli tunnel yaratiladi (`config_src: cloudflare`) yoki mavjudi qayta ishlatiladi.
  - Ingress: `DOMAIN` va `www.DOMAIN` → `http://web:80`.
  - Tunnel tokeni `.../cfd_tunnel/{id}/token` orqali olinadi.
- **DNS:**
  - `CNAME → {tunnel_id}.cfargotunnel.com`, `proxied`.
  - Eski A/AAAA/CNAME yozuvlar bo'lsa, o'chirishdan oldin **"ha/yo'q" deb so'raydi**.
  - MX va boshqa yozuvlarga tegmaydi.
- **Challenge'larni o'chirish:**
  - `security_level=essentially_off`
  - `browser_check=off`
  - `always_use_https=on`
  - `bot_management fight_mode=false`
  - WAF custom rule: `(ip.src.country eq "UZ")`, action `skip`. Avval phases bilan urinadi, bo'lmasa faqat
    `ruleset: current` va `products` bilan urinadi.
- **Xatolar:** biror sozlama bo'lmasa ⚠️ chiqaradi va QOLLANMA.md 5-qadamiga (qo'lda sozlash) yo'naltiradi.
- **Natija:** `.env` ga `CF_TUNNEL_TOKEN` va `COMPOSE_PROFILES=tunnel` yoziladi. Mavjud fayl qayta yoziladi,
  shuning uchun Linux'da fayl egasi o'zgarmaydi.

Token ruxsatlari:
- Account: Cloudflare Tunnel Edit
- Zone: Zone Read, DNS Edit, Zone Settings Edit, Zone WAF Edit, Bot Management Edit

## Nima tekshirilgan / tekshirilmagan
- ✅ nginx konfiguratsiyasi `nginx -t` dan o'tadi. Sahifalar 200 qaytaradi; `/server/*`, `/.git/*`, `/.env`,
  `/.gitignore` 404 qaytaradi.
- ✅ `setup.py` soxta (mock) Cloudflare API bilan to'liq oqimda sinalgan: DNS almashtirish so'rovi,
  WAF zaxira varianti, Bot Fight Mode xatosi, `.env` ga yozish.
- ❌ **Haqiqiy Docker'da ishga tushirilmagan.** Bulut sessiyasida docker daemon yo'q edi.
- ❌ **Haqiqiy Cloudflare API bilan sinalmagan.** Quyidagilar haqiqiy hisobda tasdiqlanishi kerak:
  - Free tarifda `bot_management` endpointi ishlaydimi;
  - WAF skip `phases` qabul qilinadimi;
  - root domen CNAME'i yaratiladimi.
- ❌ `install-windows.ps1` Windows'da sinalmagan. Skriptda faqat ASCII belgilar bor (PS 5.1 kodirovka muammosi uchun).

## Keyingi qadamlar
1. Foydalanuvchidan noutbuk OS'ini so'rash va guber.uz asl kodlarini olish. Kodlarni repo **ildiziga**
   joylash; `server/` ga tegmaslik.
2. Noutbukda: `cd server` → install skripti. Birinchi ishga tushirishda quyidagilarni tekshirish:
   - `docker compose ps`
   - `docker compose logs tunnel` (`Registered tunnel connection` chiqishi kerak)
   - `curl localhost:8080`
   - `https://guber.uz` ochilishi va challenge chiqmasligi
3. Cloudflare → Security → Events bo'limida challenge bo'lmayotganini tekshirish.
4. **Keyingi bosqich:** docker-compose'ga quyidagilarni qo'shish:
   - `api` — Python **FastAPI** (tavsiya etilgan stek);
   - `bot` — **aiogram 3**, **long polling** bilan (webhook shart emas, Cloudflare aralashmaydi);
   - `db` — PostgreSQL 16.
   - API subdomeni kerak bo'lsa: `setup.py` dagi `hosts` / `ingress` ga `api.DOMAIN → http://api:8000` qo'shish.
   - Webhook ishlatilsa: `/webhook` yo'li uchun WAF skip qoidasi qo'shish.
   - G'oya: taklifnomaga javob (RSVP) kelganda egasiga Telegram'da xabar yuborish.
5. Ixtiyoriy: `README.md` va `QOLLANMA.md` dagi `git clone -b claude/tender-curie-vmiba4` ni `main` ga
   merge qilingandan keyin yangilash.

## Git
- Ish branchi: `claude/tender-curie-vmiba4` (hali `main` ga merge qilinmagan, PR ochilmagan).
- Repo: `qoshniniogli-cell/guber`.
