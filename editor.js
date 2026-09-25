(function () {
  "use strict";

  var DRAFT_KEY = "invite-draft";
  var DEFAULTS = JSON.parse(JSON.stringify(window.INVITE || {}));

  var THEMES = [
    { id: "gold", name: "Oltin", css: "linear-gradient(135deg,#faf6ef 50%,#b8925a 50%)" },
    { id: "rose", name: "Pushti", css: "linear-gradient(135deg,#fbf3f2 50%,#c2798a 50%)" },
    { id: "emerald", name: "Zumrad", css: "linear-gradient(135deg,#f2f5f0 50%,#3f7a5e 50%)" },
    { id: "night", name: "Tun", css: "linear-gradient(135deg,#0f1219 50%,#d4b06a 50%)" }
  ];

  // Forma tuzilishi: har bir guruh — ochiladigan blok
  var GROUPS = [
    { title: "🎨 Dizayn", open: true, fields: [{ key: "theme", type: "theme" }] },
    { title: "💍 Kelin va kuyov", open: true, fields: [
      { key: "groom", label: "Kuyov ismi", half: true },
      { key: "bride", label: "Kelin ismi", half: true },
      { key: "heroSubtitle", label: "Bosh sahifadagi yozuv" },
      { key: "heroPhoto", label: "Asosiy rasm (fon)", type: "image" }
    ]},
    { title: "✉️ Taklif matni", fields: [
      { key: "greeting", label: "Murojaat" },
      { key: "invitationText", label: "Taklif matni", type: "textarea" },
      { key: "hosts", label: "Taklif etuvchilar (imzo)" }
    ]},
    { title: "📅 Sana va vaqt", open: true, fields: [
      { key: "date", label: "To'y kuni", type: "date", half: true },
      { key: "time", label: "Boshlanish vaqti", type: "time", half: true }
    ]},
    { title: "📍 Manzil (lokatsiya)", open: true, fields: [
      { key: "venueName", label: "To'yxona nomi" },
      { key: "venueAddress", label: "To'liq manzil" },
      { key: "mapQuery", label: "Xaritada qidirish uchun", hint: "Manzil yoki koordinata, masalan: 41.3383,69.3346 (Google Maps'da joyni bosib, koordinatani nusxalang)" }
    ]},
    { title: "🕰 Kun tartibi", fields: [{ key: "schedule", type: "schedule" }] },
    { title: "🎬 Video", fields: [
      { key: "videoTitle", label: "Video sarlavhasi" },
      { key: "video", label: "Video havolasi", hint: "YouTube havolasi yoki assets/video.mp4. Bo'sh qoldirilsa — bo'lim ko'rinmaydi." }
    ]},
    { title: "🖼 Galereya", fields: [{ key: "gallery", type: "gallery" }] },
    { title: "🎵 Musiqa", fields: [
      { key: "music", label: "Fon musiqasi", hint: "assets/music.mp3 yoki mp3 havolasi. Konvert ochilganda chalinadi." }
    ]},
    { title: "👗 Dress-kod", fields: [
      { key: "dressCode", label: "Kiyinish uslubi", type: "textarea", hint: "Bo'sh qoldirilsa — bo'lim ko'rinmaydi." }
    ]},
    { title: "📨 Javob (RSVP)", fields: [
      { key: "rsvpPhone", label: "Telefon (WhatsApp / qo'ng'iroq)", half: true },
      { key: "rsvpTelegram", label: "Telegram username", half: true, hint: "@ belgisisiz, masalan: jasur_m" }
    ]},
    { title: "✨ Yakuniy so'z", fields: [{ key: "closingText", label: "Yakuniy matn" }] }
  ];

  var state = loadDraft();
  var form = document.getElementById("form");
  var frame = document.getElementById("preview");

  function loadDraft() {
    try {
      var d = localStorage.getItem(DRAFT_KEY);
      if (d) return Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), JSON.parse(d));
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULTS));
  }

  var saveTimer;
  function update() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(state));
    } catch (e) {
      toast("Xotira to'ldi! Rasmlarni fayl sifatida assets/ papkasiga qo'yib, yo'lini yozing.");
    }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      frame.contentWindow && frame.contentWindow.postMessage({ type: "invite-update", config: state }, location.origin);
    }, 150);
  }

  function toast(msg) {
    var t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._h);
    t._h = setTimeout(function () { t.classList.remove("show"); }, 3200);
  }

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }

  // Rasmni kichraytirib, dataURL ga aylantiradi (brauzer xotirasiga sig'ishi uchun)
  function readImage(file, maxSize, cb) {
    var reader = new FileReader();
    reader.onload = function () {
      var img = new Image();
      img.onload = function () {
        var scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        var cv = document.createElement("canvas");
        cv.width = Math.round(img.width * scale);
        cv.height = Math.round(img.height * scale);
        cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
        cb(cv.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  /* ---------- Maydon turlari ---------- */

  function textField(f) {
    var input = f.type === "textarea" ? el("textarea") : el("input", { type: f.type || "text" });
    input.value = state[f.key] || "";
    input.addEventListener("input", function () { state[f.key] = input.value; update(); });
    return input;
  }

  function imageField(f) {
    var wrap = el("div");
    var input = el("input", { type: "text", placeholder: "Havola yoki assets/rasm.jpg" });
    var thumb = el("img", { class: "thumb", alt: "" });
    function sync() {
      input.value = state[f.key] && state[f.key].indexOf("data:") === 0 ? "(yuklangan rasm)" : (state[f.key] || "");
      thumb.src = state[f.key] || "";
      thumb.style.display = state[f.key] ? "" : "none";
    }
    input.addEventListener("change", function () { state[f.key] = input.value.trim(); sync(); update(); });
    var file = el("input", { type: "file", accept: "image/*" });
    file.addEventListener("change", function () {
      if (!file.files[0]) return;
      readImage(file.files[0], 1800, function (url) { state[f.key] = url; sync(); update(); toast("Rasm yuklandi ✓"); });
    });
    wrap.appendChild(el("div", { class: "media" }, [input, el("span", { class: "btn small upload", text: "Yuklash" }, [file])]));
    wrap.appendChild(thumb);
    sync();
    return wrap;
  }

  function themeField() {
    var box = el("div", { class: "themes" });
    THEMES.forEach(function (t) {
      var r = el("input", { type: "radio", name: "theme", value: t.id });
      r.checked = (state.theme || "gold") === t.id;
      r.addEventListener("change", function () { state.theme = t.id; update(); });
      var sw = el("span", { class: "swatch" });
      sw.style.background = t.css;
      box.appendChild(el("label", {}, [r, sw, document.createTextNode(t.name)]));
    });
    return box;
  }

  function scheduleField() {
    var box = el("div", { class: "list" });
    function draw() {
      box.innerHTML = "";
      (state.schedule || []).forEach(function (item, i) {
        var t = el("input", { type: "time" }); t.value = item.time || "";
        var n = el("input", { type: "text", placeholder: "Nima bo'ladi" }); n.value = item.title || "";
        t.addEventListener("input", function () { item.time = t.value; update(); });
        n.addEventListener("input", function () { item.title = n.value; update(); });
        var x = el("button", { type: "button", class: "x", text: "×", title: "O'chirish", onclick: function () {
          state.schedule.splice(i, 1); draw(); update();
        }});
        box.appendChild(el("div", { class: "list-item" }, [t, n, x]));
      });
      box.appendChild(el("button", { type: "button", class: "btn small", text: "+ Qo'shish", onclick: function () {
        state.schedule = state.schedule || [];
        state.schedule.push({ time: "", title: "" }); draw(); update();
      }}));
    }
    draw();
    return box;
  }

  function galleryField() {
    var wrap = el("div", { class: "list" });
    var grid = el("div", { class: "gallery-edit" });
    function draw() {
      grid.innerHTML = "";
      (state.gallery || []).forEach(function (src, i) {
        var x = el("button", { type: "button", class: "x", text: "×", title: "O'chirish", onclick: function () {
          state.gallery.splice(i, 1); draw(); update();
        }});
        grid.appendChild(el("div", { class: "g" }, [el("img", { src: src, alt: "" }), x]));
      });
    }
    var url = el("input", { type: "text", placeholder: "Rasm havolasi yoki assets/1.jpg" });
    var add = el("button", { type: "button", class: "btn small", text: "Qo'shish", onclick: function () {
      if (!url.value.trim()) return;
      state.gallery = state.gallery || [];
      state.gallery.push(url.value.trim()); url.value = ""; draw(); update();
    }});
    var file = el("input", { type: "file", accept: "image/*", multiple: "" });
    file.addEventListener("change", function () {
      state.gallery = state.gallery || [];
      Array.prototype.forEach.call(file.files, function (f) {
        readImage(f, 1200, function (d) { state.gallery.push(d); draw(); update(); });
      });
      file.value = "";
    });
    wrap.appendChild(grid);
    wrap.appendChild(el("div", { class: "media" }, [url, add, el("span", { class: "btn small upload", text: "Yuklash" }, [file])]));
    draw();
    return wrap;
  }

  function buildForm() {
    form.innerHTML = "";
    GROUPS.forEach(function (g) {
      var body = el("div", { class: "group-body" });
      var pair = null;
      g.fields.forEach(function (f) {
        var control =
          f.type === "theme" ? themeField() :
          f.type === "schedule" ? scheduleField() :
          f.type === "gallery" ? galleryField() :
          f.type === "image" ? imageField(f) : textField(f);
        var field = el("div", { class: "field" }, [
          f.label ? el("label", { text: f.label }) : null,
          control,
          f.hint ? el("p", { class: "hint", text: f.hint }) : null
        ]);
        if (f.half) {
          if (!pair) { pair = el("div", { class: "two" }); body.appendChild(pair); }
          pair.appendChild(field);
          if (pair.children.length === 2) pair = null;
        } else {
          pair = null;
          body.appendChild(field);
        }
      });
      var d = el("details", { class: "group" }, [el("summary", { text: g.title }), body]);
      if (g.open) d.open = true;
      form.appendChild(d);
    });
  }

  /* ---------- Tugmalar ---------- */

  document.getElementById("exportBtn").onclick = function () {
    var text = "/*\n * TAKLIFNOMA SOZLAMALARI — editor.html orqali yaratildi.\n" +
      " * Bu faylni saytdagi eski config.js o'rniga qo'ying.\n */\n" +
      "window.INVITE = " + JSON.stringify(state, null, 2) + ";\n";
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
    a.download = "config.js";
    a.click();
    toast("config.js yuklab olindi. Uni saytdagi eski fayl o'rniga qo'ying.");
  };

  document.getElementById("openBtn").onclick = function () { window.open("index.html?preview=1", "_blank"); };

  document.getElementById("resetBtn").onclick = function () {
    if (!confirm("Barcha o'zgarishlar o'chib, asl holiga qaytsinmi?")) return;
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
    state = JSON.parse(JSON.stringify(DEFAULTS));
    buildForm(); update();
    toast("Asl holiga qaytarildi");
  };

  var importFile = document.getElementById("importFile");
  document.getElementById("importBtn").onclick = function () { importFile.click(); };
  importFile.onchange = function () {
    var f = importFile.files[0];
    if (!f) return;
    f.text().then(function (txt) {
      var json = txt.slice(txt.indexOf("{"), txt.lastIndexOf("}") + 1);
      try {
        state = Object.assign(JSON.parse(JSON.stringify(DEFAULTS)), JSON.parse(json));
        buildForm(); update();
        toast("Sozlamalar yuklandi ✓");
      } catch (e) {
        toast("Faylni o'qib bo'lmadi. editor.html orqali yaratilgan config.js ni tanlang.");
      }
      importFile.value = "";
    });
  };

  // Mehmon uchun shaxsiy havola
  var guestName = document.getElementById("guestName");
  var guestLink = document.getElementById("guestLink");
  function guestUrl() {
    var base = location.href.replace(/editor\.html.*$/, "");
    return base + (guestName.value.trim() ? "?to=" + encodeURIComponent(guestName.value.trim()) : "");
  }
  guestName.addEventListener("input", function () { guestLink.textContent = guestUrl(); });
  guestLink.textContent = guestUrl();
  document.getElementById("copyLink").onclick = function () {
    var url = guestUrl();
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject())
      .then(function () { toast("Havola nusxalandi ✓"); })
      .catch(function () { prompt("Havolani nusxalang:", url); });
  };

  // Telefon rejimi: tahrirlash / ko'rish
  document.querySelectorAll(".tabs button").forEach(function (b) {
    b.onclick = function () {
      document.querySelectorAll(".tabs button").forEach(function (x) { x.classList.toggle("active", x === b); });
      document.body.classList.toggle("show-preview", b.dataset.view === "preview");
    };
  });

  frame.addEventListener("load", update);
  buildForm();
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); } catch (e) {}
})();
