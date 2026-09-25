# 💍 Onlayn to'y taklifnomasi

Zamonaviy, animatsiyali onlayn taklifnoma. Matn, rasm, video, manzil (lokatsiya), sana va vaqtni o'zgartirsa bo'ladi.

## Imkoniyatlar
- ✉️ Muhrli konvert: bosilganda ochiladi, keyin taklifnoma ko'rinadi
- 🌸 Gul barglari yog'adigan animatsiya, fon musiqasi
- 📅 Sana, kalendar (to'y kuni yurakcha bilan belgilangan), teskari sanoq, "Kalendarga qo'shish"
- 🕰 Kun tartibi (dastur)
- 📍 Xarita va "Google Maps / Yandex Maps" orqali yo'l topish tugmalari
- 🎬 Video (YouTube havolasi yoki mp4 fayl)
- 🖼 Rasmlar galereyasi (bosilsa kattalashadi)
- 📨 Javob berish: WhatsApp, Telegram, qo'ng'iroq
- 👤 Mehmonga shaxsiy havola: `index.html?to=Aziz aka` → "Hurmatli Aziz aka!"
- 🎨 4 ta rang mavzusi: Oltin, Pushti, Zumrad, Tun

## Qanday tahrirlanadi
1. `editor.html` ni oching: chapda maydonlar, o'ngda taklifnoma ko'rinadi.
2. Hammasini o'zingizga moslang (rasmni "Yuklash" tugmasi bilan qo'shsa ham bo'ladi).
3. **"config.js ni yuklab olish"** tugmasini bosing.
4. Yuklab olingan `config.js` ni loyihadagi eski `config.js` o'rniga qo'ying.

Yoki `config.js` faylini to'g'ridan-to'g'ri matn muharririda o'zgartiring.

**Video va musiqa** fayllarini `assets/` papkasiga qo'ying (masalan `assets/video.mp4`, `assets/music.mp3`)
va muharrirda shu yo'lni yozing. Video uchun YouTube havolasi ham ishlaydi.

## Internetga joylash (bepul)
**GitHub Pages:** repozitoriy → Settings → Pages → Branch tanlang → Save.
Bir necha daqiqadan so'ng havola tayyor bo'ladi: `https://<username>.github.io/<repo>/`.

Boshqa variantlar: Netlify yoki Vercel (papkani sudrab tashlash kifoya) yoki o'z hostingingiz.

> Muharrir (`editor.html`) ham saytda turadi, lekin undagi o'zgarishlar faqat sizning brauzeringizda saqlanadi.
> Mehmonlar faqat `config.js` dagi ma'lumotni ko'radi.

## Fayllar
| Fayl | Vazifasi |
|---|---|
| `index.html`, `style.css`, `app.js` | Taklifnoma sahifasi |
| `config.js` | **Barcha matn, rasm, sana, manzil shu yerda** |
| `editor.html`, `editor.css`, `editor.js` | Vizual muharrir |
| `assets/` | O'z rasm, video, musiqa fayllaringiz |
