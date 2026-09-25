(function () {
  "use strict";

  var MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];
  var MONTHS_CAP = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
  var WEEKDAYS = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];

  var params = new URLSearchParams(location.search);
  var isPreview = params.get("preview") === "1";
  var DRAFT_KEY = "invite-draft";

  var countdownTimer = null;
  var petalTimer = null;

  function loadConfig() {
    if (isPreview) {
      try {
        var draft = localStorage.getItem(DRAFT_KEY);
        if (draft) return JSON.parse(draft);
      } catch (e) { /* localStorage yo'q bo'lsa asl sozlamalar ishlatiladi */ }
    }
    return window.INVITE || {};
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function eventDate(c) {
    var d = (c.date || "").split("-").map(Number);
    var t = (c.time || "00:00").split(":").map(Number);
    if (d.length < 3 || !d[0]) return null;
    return new Date(d[0], d[1] - 1, d[2], t[0] || 0, t[1] || 0);
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }

  var ORNAMENT =
    '<svg class="ornament" viewBox="0 0 180 24" fill="none" stroke="currentColor" stroke-width="1">' +
    '<path d="M0 12h62M118 12h62"/>' +
    '<path d="M90 3c-6 0-10 4-10 9s4 9 10 9 10-4 10-9-4-9-10-9z" opacity=".5"/>' +
    '<path d="M90 6l2.5 6L90 18l-2.5-6z" fill="currentColor"/>' +
    '<path d="M62 12c6-6 12-6 18 0M118 12c-6-6-12-6-18 0M62 12c6 6 12 6 18 0M118 12c-6 6-12 6-18 0"/>' +
    '</svg>';

  var ICONS = {
    cal: '<svg viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 16H5V10h14v10z"/></svg>',
    pin: '<svg viewBox="0 0 24 24"><path d="M12 2a7 7 0 0 0-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>',
    tg: '<svg viewBox="0 0 24 24"><path d="M9.8 15.3l-.4 5.4c.6 0 .8-.3 1.1-.6l2.6-2.5 5.4 4c1 .5 1.7.3 2-.9l3.6-17c.3-1.5-.5-2.1-1.5-1.7L1.4 9.9c-1.4.6-1.4 1.4-.2 1.8l5.4 1.7L19 5.6c.6-.4 1.1-.2.7.2z"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.6-.1 1.2z"/></svg>',
    phone: '<svg viewBox="0 0 24 24"><path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1z"/></svg>'
  };

  /* ---------------- Bo'limlar ---------------- */

  function heroHtml(c, d) {
    var dateStr = d ? pad(d.getDate()) + " . " + pad(d.getMonth() + 1) + " . " + d.getFullYear() : "";
    return '<header class="hero" id="hero">' +
      '<div class="hero-bg" style="background-image:url(\'' + esc(c.heroPhoto) + '\')"></div>' +
      '<div class="hero-content">' +
        '<p class="hero-sub">' + esc(c.heroSubtitle) + '</p>' +
        '<h1 class="hero-names script">' + esc(c.groom) + '<span class="amp">&amp;</span>' + esc(c.bride) + '</h1>' +
        '<p class="hero-date">' + dateStr + '</p>' +
      '</div>' +
      '<a href="#invite" class="scroll-down" aria-label="Pastga"></a>' +
    '</header>';
  }

  function inviteHtml(c) {
    var guest = params.get("to");
    var greeting = guest ? "Hurmatli " + guest + "!" : c.greeting;
    return '<section class="section alt" id="invite"><div class="container reveal">' +
      '<p class="kicker">Taklifnoma</p>' +
      '<h2 class="title script">' + esc(greeting) + '</h2>' + ORNAMENT +
      '<p class="lead">' + esc(c.invitationText) + '</p>' +
      (c.hosts ? '<p class="hosts">' + esc(c.hosts) + '</p>' : '') +
    '</div></section>';
  }

  function calendarHtml(d) {
    var first = new Date(d.getFullYear(), d.getMonth(), 1);
    var days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    var offset = (first.getDay() + 6) % 7; // dushanbadan boshlanadi
    var html = '<div class="calendar reveal"><div class="cal-title">' + MONTHS_CAP[d.getMonth()] + ' ' + d.getFullYear() + '</div><div class="cal-grid">';
    ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].forEach(function (w) { html += '<span class="wd">' + w + '</span>'; });
    for (var i = 0; i < offset; i++) html += '<span></span>';
    for (var day = 1; day <= days; day++) {
      html += '<span' + (day === d.getDate() ? ' class="hit"' : '') + '>' + day + '</span>';
    }
    return html + '</div></div>';
  }

  function dateHtml(c, d) {
    if (!d) return "";
    return '<section class="section" id="date"><div class="container">' +
      '<div class="reveal"><p class="kicker">Qachon</p>' +
      '<h2 class="title script">To\'y kuni</h2>' + ORNAMENT +
      '<div class="date-card">' +
        '<div class="side">' + WEEKDAYS[d.getDay()] + '</div>' +
        '<div class="day">' + pad(d.getDate()) + '</div>' +
        '<div class="side">' + MONTHS[d.getMonth()] + '</div>' +
      '</div>' +
      '<p class="date-year">' + d.getFullYear() + ' · SOAT ' + esc(c.time) + '</p></div>' +
      calendarHtml(d) +
      '<div class="reveal"><div class="countdown" id="countdown"></div>' +
      '<div class="btns"><button class="btn ghost" id="icsBtn">' + ICONS.cal + 'Kalendarga qo\'shish</button></div></div>' +
    '</div></section>';
  }

  function scheduleHtml(c) {
    var items = (c.schedule || []).filter(function (s) { return s && (s.time || s.title); });
    if (!items.length) return "";
    return '<section class="section alt" id="schedule"><div class="container reveal">' +
      '<p class="kicker">Dastur</p><h2 class="title script">Kun tartibi</h2>' + ORNAMENT +
      '<ul class="timeline">' + items.map(function (s) {
        return '<li><span class="tl-time">' + esc(s.time) + '</span><span class="tl-title">' + esc(s.title) + '</span></li>';
      }).join("") + '</ul>' +
    '</div></section>';
  }

  function venueHtml(c) {
    if (!c.venueName && !c.venueAddress && !c.mapQuery) return "";
    var q = c.mapQuery || c.venueAddress || c.venueName;
    var qe = encodeURIComponent(q);
    return '<section class="section" id="venue"><div class="container reveal">' +
      '<p class="kicker">Qayerda</p><h2 class="title script">Manzil</h2>' + ORNAMENT +
      '<p class="venue-name">' + esc(c.venueName) + '</p>' +
      '<p class="venue-addr">' + esc(c.venueAddress) + '</p>' +
      '<div class="map"><iframe loading="lazy" title="Xarita" src="https://maps.google.com/maps?q=' + qe + '&z=15&output=embed"></iframe></div>' +
      '<div class="btns">' +
        '<a class="btn" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + qe + '">' + ICONS.pin + 'Google Maps</a>' +
        '<a class="btn ghost" target="_blank" rel="noopener" href="https://yandex.uz/maps/?text=' + qe + '">' + ICONS.pin + 'Yandex Maps</a>' +
      '</div>' +
    '</div></section>';
  }

  function youtubeId(url) {
    var m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
    return m ? m[1] : null;
  }

  function videoHtml(c) {
    if (!c.video) return "";
    var yt = youtubeId(c.video);
    var player = yt
      ? '<iframe loading="lazy" title="Video" src="https://www.youtube.com/embed/' + yt + '?rel=0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>'
      : '<video src="' + esc(c.video) + '" controls playsinline preload="metadata"' + (c.heroPhoto ? ' poster="' + esc(c.heroPhoto) + '"' : '') + '></video>';
    return '<section class="section alt" id="video"><div class="container reveal">' +
      '<p class="kicker">Video</p><h2 class="title script">' + esc(c.videoTitle || "Video") + '</h2>' + ORNAMENT +
      '<div class="video-wrap">' + player + '</div>' +
    '</div></section>';
  }

  function galleryHtml(c) {
    var imgs = (c.gallery || []).filter(Boolean);
    if (!imgs.length) return "";
    return '<section class="section" id="gallery"><div class="container reveal">' +
      '<p class="kicker">Lahzalar</p><h2 class="title script">Galereya</h2>' + ORNAMENT +
    '</div><div class="gallery reveal">' + imgs.map(function (src) {
      return '<button type="button" data-src="' + esc(src) + '"><img loading="lazy" src="' + esc(src) + '" alt=""></button>';
    }).join("") + '</div></section>';
  }

  function dressHtml(c) {
    if (!c.dressCode) return "";
    return '<section class="section alt" id="dress"><div class="container reveal">' +
      '<p class="kicker">Dress-kod</p><h2 class="title script">Kiyinish uslubi</h2>' + ORNAMENT +
      '<p class="dress">' + esc(c.dressCode) + '</p>' +
    '</div></section>';
  }

  function rsvpHtml(c) {
    if (!c.rsvpPhone && !c.rsvpTelegram) return "";
    var btns = "";
    if (c.rsvpTelegram) btns += '<button type="button" class="btn" data-send="tg">' + ICONS.tg + 'Telegram</button>';
    if (c.rsvpPhone) btns += '<button type="button" class="btn" data-send="wa">' + ICONS.wa + 'WhatsApp</button>';
    if (c.rsvpPhone) btns += '<a class="btn ghost" href="tel:' + esc(c.rsvpPhone.replace(/[^\d+]/g, "")) + '">' + ICONS.phone + 'Qo\'ng\'iroq</a>';
    return '<section class="section" id="rsvp"><div class="container reveal">' +
      '<p class="kicker">Javobingiz</p><h2 class="title script">Kelasizmi?</h2>' + ORNAMENT +
      '<form class="rsvp-form" id="rsvpForm" onsubmit="return false">' +
        '<label>Ismingiz<input name="name" required placeholder="Ism va familiya" value="' + esc(params.get("to") || "") + '"></label>' +
        '<label>Javob<div class="choice">' +
          '<label><input type="radio" name="answer" value="yes" checked><span>Albatta boraman</span></label>' +
          '<label><input type="radio" name="answer" value="no"><span>Afsuski, bora olmayman</span></label>' +
        '</div></label>' +
        '<label>Necha kishi bo\'lasiz?<select name="count">' +
          [1, 2, 3, 4, 5].map(function (n) { return '<option>' + n + '</option>'; }).join("") +
        '</select></label>' +
        '<div class="btns" style="margin-top:6px">' + btns + '</div>' +
        '<p class="rsvp-note" id="rsvpNote"></p>' +
      '</form>' +
    '</div></section>';
  }

  function finalHtml(c) {
    return '<footer class="final">' +
      '<div class="final-bg" style="background-image:url(\'' + esc(c.heroPhoto) + '\')"></div>' +
      '<div class="container reveal">' +
        '<h2 class="title script">' + esc(c.closingText) + '</h2>' +
        '<p class="final-names script">' + esc(c.groom) + ' &amp; ' + esc(c.bride) + '</p>' +
      '</div>' +
    '</footer>';
  }

  /* ---------------- Interaktivlik ---------------- */

  function startCountdown(d) {
    clearInterval(countdownTimer);
    var el = document.getElementById("countdown");
    if (!el || !d) return;
    function tick() {
      var diff = d - new Date();
      if (diff <= 0) {
        el.outerHTML = '<p class="cd-done" id="countdown">Bugun bizning to\'yimiz! 💍</p>';
        clearInterval(countdownTimer);
        return;
      }
      var parts = [
        [Math.floor(diff / 864e5), "kun"],
        [Math.floor(diff / 36e5) % 24, "soat"],
        [Math.floor(diff / 6e4) % 60, "daqiqa"],
        [Math.floor(diff / 1e3) % 60, "soniya"]
      ];
      el.innerHTML = parts.map(function (p) {
        return '<div class="cd-item"><div class="cd-num">' + pad(p[0]) + '</div><div class="cd-label">' + p[1] + '</div></div>';
      }).join("");
    }
    tick();
    countdownTimer = setInterval(tick, 1000);
  }

  function icsDate(d) {
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + "T" + pad(d.getHours()) + pad(d.getMinutes()) + "00";
  }

  function downloadIcs(c, d) {
    var end = new Date(d.getTime() + 5 * 36e5);
    var ics = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//taklifnoma//UZ", "BEGIN:VEVENT",
      "UID:" + Date.now() + "@taklifnoma",
      "DTSTAMP:" + icsDate(new Date()),
      "DTSTART:" + icsDate(d), "DTEND:" + icsDate(end),
      "SUMMARY:" + c.groom + " va " + c.bride + " to'yi",
      "LOCATION:" + [c.venueName, c.venueAddress].filter(Boolean).join(", ").replace(/,/g, "\\,"),
      "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Ertaga to'y!", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"
    ].join("\r\n");
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    a.download = "toy-taklifnoma.ics";
    a.click();
  }

  function rsvpMessage(form, c) {
    var name = form.name.value.trim();
    if (!name) { form.name.focus(); return null; }
    var yes = form.answer.value === "yes";
    return "Assalomu alaykum! Men, " + name + ", " + c.groom + " va " + c.bride + " to'yiga " +
      (yes ? "albatta boraman (" + form.count.value + " kishi). Tabriklayman! 🎉" : "afsuski bora olmayman. Baxtli bo'linglar! 💐");
  }

  function bindRsvp(c) {
    var form = document.getElementById("rsvpForm");
    if (!form) return;
    var note = document.getElementById("rsvpNote");
    form.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-send]");
      if (!btn) return;
      var msg = rsvpMessage(form, c);
      if (!msg) return;
      if (btn.dataset.send === "wa") {
        window.open("https://wa.me/" + c.rsvpPhone.replace(/\D/g, "") + "?text=" + encodeURIComponent(msg), "_blank");
      } else {
        // Telegram shaxsiy chatga matn qo'yib bo'lmaydi — matn nusxalanadi
        if (navigator.clipboard) navigator.clipboard.writeText(msg).catch(function () {});
        note.textContent = "Xabar nusxalandi — Telegram chatiga joylashtirib yuboring.";
        window.open("https://t.me/" + c.rsvpTelegram.replace(/^@/, ""), "_blank");
      }
    });
  }

  function bindGallery() {
    var lb = document.getElementById("lightbox");
    var img = lb.querySelector("img");
    document.querySelectorAll(".gallery button").forEach(function (b) {
      b.addEventListener("click", function () { img.src = b.dataset.src; lb.hidden = false; });
    });
    lb.onclick = function (e) { if (e.target !== img) lb.hidden = true; };
  }

  function observeReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(function (el) { io.observe(el); });
  }

  function startPetals() {
    if (petalTimer || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var box = document.getElementById("petals");
    function spawn() {
      if (document.hidden) return;
      var p = document.createElement("span");
      p.className = "petal";
      var size = 8 + Math.random() * 12;
      p.style.left = Math.random() * 100 + "vw";
      p.style.width = size + "px";
      p.style.height = size * 1.3 + "px";
      p.style.setProperty("--drift", (Math.random() * 200 - 100) + "px");
      p.style.animationDuration = 7 + Math.random() * 6 + "s";
      p.style.opacity = 0.4 + Math.random() * 0.5;
      box.appendChild(p);
      setTimeout(function () { p.remove(); }, 14000);
    }
    for (var i = 0; i < 6; i++) setTimeout(spawn, i * 300);
    petalTimer = setInterval(spawn, 900);
  }

  function setupMusic(c) {
    var btn = document.getElementById("musicBtn");
    var audio = document.getElementById("bgMusic");
    if (!c.music) { btn.hidden = true; audio.pause(); audio.removeAttribute("src"); return; }
    if (audio.getAttribute("src") !== c.music) audio.src = c.music;
    btn.hidden = false;
    btn.onclick = function () { audio.paused ? audio.play() : audio.pause(); };
    audio.onplay = function () { btn.classList.add("playing"); };
    audio.onpause = function () { btn.classList.remove("playing"); };
  }

  /* ---------------- Asosiy render ---------------- */

  function render(c) {
    document.documentElement.setAttribute("data-theme", c.theme || "gold");
    document.title = c.groom + " & " + c.bride + " — to'yga taklifnoma";
    var d = eventDate(c);

    document.getElementById("app").innerHTML =
      heroHtml(c, d) + inviteHtml(c) + dateHtml(c, d) + scheduleHtml(c) +
      venueHtml(c) + videoHtml(c) + galleryHtml(c) + dressHtml(c) + rsvpHtml(c) + finalHtml(c);

    // Konvert matnlari
    var initials = (c.groom || " ").charAt(0) + (c.bride || " ").charAt(0);
    document.getElementById("sealText").textContent = initials;
    document.getElementById("letterNames").textContent = c.groom + " & " + c.bride;
    document.getElementById("letterDate").textContent = d ? pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear() : "";
    var guest = params.get("to");
    document.getElementById("introTo").textContent = guest ? "Hurmatli " + guest : "Sizga taklifnoma";

    startCountdown(d);
    var ics = document.getElementById("icsBtn");
    if (ics) ics.onclick = function () { downloadIcs(c, d); };
    bindRsvp(c);
    bindGallery();
    setupMusic(c);
    observeReveal();
    if (document.getElementById("intro").classList.contains("gone")) {
      requestAnimationFrame(function () { document.getElementById("app").classList.add("revealed"); });
    }
  }

  var opened = false;
  function openInvite(playMusic) {
    if (opened) return;
    opened = true;
    var intro = document.getElementById("intro");
    document.getElementById("envelope").classList.add("open");
    var audio = document.getElementById("bgMusic");
    if (playMusic && audio.getAttribute("src")) audio.play().catch(function () {});
    setTimeout(function () {
      intro.classList.add("gone");
      document.body.classList.remove("locked");
      document.getElementById("app").classList.add("revealed");
      startPetals();
    }, playMusic ? 1500 : 0);
  }

  var config = loadConfig();
  render(config);

  if (isPreview) {
    openInvite(false);
    // Editor o'zgarishlarni shu yerga yuboradi
    window.addEventListener("message", function (e) {
      if (e.origin !== location.origin || !e.data || e.data.type !== "invite-update") return;
      var y = window.scrollY;
      render(e.data.config);
      window.scrollTo(0, y);
    });
  } else {
    document.body.classList.add("locked");
    document.getElementById("envelope").addEventListener("click", function () { openInvite(true); });
  }
})();
