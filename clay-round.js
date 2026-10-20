(function () {
  var LIVE_KEY = "clay-live-v1";
  var AGENTS = [
    "Clay Mehmet IŞIK",
    "Clay Ayşe YILMAZ",
    "Clay Emre KAYA",
    "Clay Zeynep DEMİR",
    "Clay Burak ÇELİK",
    "Clay Elif ARSLAN",
    "Clay Kerem ŞAHİN",
    "Clay Deniz AKSOY",
    "Clay Merve KOÇ",
    "Clay Hakan YILDIZ"
  ];
  var WORDS = ["ada", "akasya", "armut", "ayna", "badem", "bahar", "bakir", "balon", "bambu", "belge", "bere", "bez", "boru", "bulut", "cam", "cami", "ceviz", "cicek", "damla", "defter", "deniz", "elma", "fener", "gece", "gol", "gumus", "harita", "kalem", "kapi", "kaya", "kitap", "limon", "masa", "nehir", "orman", "ruzgar", "sabah", "saat", "sepet", "simit", "toprak", "yildiz", "yol", "zeytin", "zincir"];

  function path() {
    return location.pathname.replace(/\/index\.html$/, "/");
  }

  function home() {
    var p = path();
    return p === "/" || p === "";
  }

  function publicSite() {
    var p = path();
    return home() || /^\/(giris|kayit|sifre)\/?$/.test(p);
  }

  function member() {
    return /^\/panel(\/|$)/.test(path());
  }

  function admin() {
    return /^\/clayadm!nxx(\/|$)/.test(path());
  }

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
    });
  }

  function readLive() {
    try {
      var raw = JSON.parse(localStorage.getItem(LIVE_KEY) || "{}");
      if (!raw || typeof raw !== "object" || !Array.isArray(raw.threads)) raw = { threads: [] };
      return raw;
    } catch (e) {
      return { threads: [] };
    }
  }

  function writeLive(data) {
    localStorage.setItem(LIVE_KEY, JSON.stringify(data));
  }

  function tidyAdmin() {
    document.body.classList.toggle("clay-desk", admin());
    document.querySelectorAll(".clay-bin-demo").forEach(function (node) { node.remove(); });
    if (!admin()) return;
    var host = document.querySelector(".mx-auto.min-h-screen");
    if (!host) return;
    var header = host.querySelector(":scope > header");
    var nav = host.querySelector(":scope > nav");
    var anchor = nav || header;
    var coupon = host.querySelector(":scope > .clay-coupon-admin");
    if (coupon && anchor && coupon.nextElementSibling === header) host.insertBefore(coupon, anchor.nextSibling);
  }

  function cardName() {
    var picked = document.querySelector('input[name="tur"]:checked');
    if (!picked) return "";
    var map = { facebook_ads: "Facebook Ads", tiktok: "TikTok Ads", google_ads: "Google Ads", ultima: "Ultima" };
    var label = picked.closest("label");
    var node = label && label.querySelector(".font-semibold");
    var text = node && node.childNodes[0] ? String(node.childNodes[0].textContent || "").trim() : "";
    return text || map[picked.value] || "";
  }

  function syncSample() {
    if (!/\/panel\/kartlar\/yeni\/?$/.test(path())) return;
    var brand = document.querySelector(".clay-sample-brand");
    var name = cardName();
    if (brand && name) brand.textContent = name;
    var form = document.querySelector('form input[name="etiket"]');
    form = form && form.closest("form");
    var gate = document.querySelector(".clay-confirm");
    if (form && gate && form.nextElementSibling !== gate) form.parentNode.insertBefore(gate, form.nextSibling);
  }

  function tidyCards() {
    document.querySelectorAll("article[id^='crd_']").forEach(function (article) {
      article.querySelectorAll("[data-act=pin],[data-act=card-pdf],[data-act=card-close]").forEach(function (btn) {
        if (btn.closest(".card-menu")) return;
        btn.remove();
      });
      var term = article.querySelector(".clay-term");
      if (term) article.appendChild(term);
    });
  }

  function halfMarkup(faces) {
    var bits = [
      '<span class="clay-slide-word">clay kart</span>',
      '<code class="clay-slide-code">clay.kart({ kimlik: false, eposta: false })</code>',
      '<span class="clay-slide-word">kimlik</span>'
    ];
    faces.forEach(function (html, index) {
      bits.push('<div class="clay-slide-face">' + html + "</div>");
      if (index === 1) bits.push('<span class="clay-slide-word">e-posta gerekmez</span>');
    });
    return bits.join("");
  }

  function faceFromBeat(beat) {
    var card = beat.querySelector(".vcard");
    if (!card) return "";
    var clone = card.cloneNode(true);
    clone.removeAttribute("id");
    var badge = beat.querySelector(".launch-badge");
    var extra = badge ? badge.outerHTML : '<span class="launch-badge"><span class="bin-badge"><span class="bin-dot"></span>Aktif</span><span class="bin-global">Global kart</span></span>';
    return clone.outerHTML + extra;
  }

  function mountSlide() {
    if (!home()) return;
    document.body.classList.add("clay-slide-on");
    var pad = document.querySelector(".launchpad");
    if (!pad) return;
    var beats = pad.querySelectorAll(".launch-beat");
    if (beats.length < 4) return;
    var existing = pad.querySelector(".clay-slide");
    if (existing && existing.dataset.ready === "1") return;
    var faces = [];
    beats.forEach(function (beat) {
      var html = faceFromBeat(beat);
      if (html) faces.push(html);
    });
    if (faces.length < 4) return;
    faces = faces.slice(0, 4);
    var block = document.createElement("div");
    block.className = "clay-slide";
    block.dataset.ready = "1";
    var row = halfMarkup(faces);
    block.innerHTML = '<div class="clay-slide-mask"><div class="clay-slide-core" aria-hidden="true"><span>CLAY</span></div><div class="clay-slide-track">' + row + row + "</div></div>";
    pad.insertBefore(block, pad.firstChild);
  }

  function onePortrait() {
    if (!home()) return;
    document.querySelectorAll(".hero-still").forEach(function (img) { img.hidden = true; img.style.display = "none"; });
    var motions = document.querySelectorAll(".hero-motion");
    motions.forEach(function (img, index) {
      if (index > 0) img.remove();
      else if (img.style.display === "none") img.style.display = "";
    });
    var mark = document.querySelector(".hero-mark");
    if (mark && !mark.querySelector(".clay-hero-ring")) {
      var ring = document.createElement("span");
      ring.className = "clay-hero-ring";
      ring.setAttribute("aria-hidden", "true");
      mark.appendChild(ring);
    }
  }

  function mountCrypto() {
    if (!home()) return;
    var yard = document.querySelector(".coin-yard");
    if (!yard || yard.querySelector(".clay-crypto-pair")) return;
    var pair = document.createElement("div");
    pair.className = "clay-crypto-pair";
    pair.innerHTML = '<figure><div class="clay-crypto-visual" data-file="/lottie/crypto/crypto.json" data-assets="/lottie/crypto/images/"></div><figcaption>Kripto</figcaption></figure><figure><div class="clay-crypto-visual" data-file="/lottie/launch/kripto.json" data-assets="/lottie/launch/kripto/"></div><figcaption>Coin</figcaption></figure>';
    yard.appendChild(pair);
    var start = function () {
      if (!window.lottie) return;
      pair.querySelectorAll(".clay-crypto-visual").forEach(function (el) {
        if (el.__anim) return;
        el.__anim = window.lottie.loadAnimation({
          container: el,
          renderer: "svg",
          loop: true,
          autoplay: true,
          path: el.getAttribute("data-file"),
          assetsPath: el.getAttribute("data-assets") || undefined
        });
      });
    };
    if (window.lottie) { start(); return; }
    if (document.querySelector("script[data-clay-round-lottie]")) return;
    var script = document.createElement("script");
    script.src = "/lottie/lottie.min.js";
    script.setAttribute("data-clay-round-lottie", "1");
    script.onload = start;
    document.body.appendChild(script);
  }

  function openPage(kind) {
    var old = document.querySelector(".clay-page-pop");
    if (old) old.remove();
    var copy = kind === "misyon"
      ? "<h2>Misyon</h2><p>CLAY reklam bütçesi için sanal kart basar. Bakiye dolar cinsindendir. Kimlik belgesi istenmez.</p>"
      : "<h2>Vizyon</h2><p>Dört kart türü tek cüzdanda durur. Ücret satırı açıktır.</p>";
    var pop = document.createElement("div");
    pop.className = "clay-page-pop";
    pop.innerHTML = '<div class="clay-page-card" role="dialog" aria-modal="true">' + copy + '<button type="button" class="btn btn-ghost" data-clay-page-close>Kapat</button></div>';
    document.body.appendChild(pop);
  }

  function mountFoot() {
    if (!publicSite()) return;
    if (document.querySelector(".clay-site-foot")) return;
    var foot = document.createElement("footer");
    foot.className = "clay-site-foot";
    foot.innerHTML = '<nav><button type="button" data-clay-page="misyon">Misyon</button><button type="button" data-clay-page="vizyon">Vizyon</button><button type="button" data-act="live-open">Canlı destek</button></nav><p>tüm hakları saklıdır</p>';
    var main = document.querySelector("main");
    if (main) main.appendChild(foot);
    else document.body.appendChild(foot);
  }

  function pickAgent(previous) {
    var pool = AGENTS.filter(function (name) { return name !== previous; });
    var bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return pool[bytes[0] % pool.length];
  }

  function openLive() {
    var store = readLive();
    var last = "";
    try { last = sessionStorage.getItem("clay-live-agent") || ""; } catch (e) {}
    var agent = pickAgent(last);
    try { sessionStorage.setItem("clay-live-agent", agent); } catch (e) {}
    var id = "lv_" + Math.random().toString(36).slice(2, 10);
    store.threads.push({ id: id, agent: agent, at: Date.now(), messages: [] });
    writeLive(store);
    try { sessionStorage.setItem("clay-live-thread", id); } catch (e) {}
    paintLive();
  }

  function currentThread() {
    var id = "";
    try { id = sessionStorage.getItem("clay-live-thread") || ""; } catch (e) {}
    if (!id) return null;
    return readLive().threads.filter(function (row) { return row.id === id; })[0] || null;
  }

  function paintLive() {
    if (admin()) return;
    var root = document.querySelector(".clay-live");
    if (!root) {
      root = document.createElement("section");
      root.className = "clay-live";
      root.innerHTML = '<button type="button" class="clay-live-btn" data-act="live-open">Canlı destek</button><div class="clay-live-panel" hidden><header><strong class="clay-live-agent"></strong><button type="button" data-act="live-close" aria-label="Kapat">×</button></header><div class="clay-live-log" role="log"></div><form class="clay-live-form"><input name="metin" maxlength="400" placeholder="Mesaj yaz" autocomplete="off" required><button class="btn btn-gold" type="submit">Gönder</button></form></div>';
      document.body.appendChild(root);
    }
    if (!(publicSite() || member())) {
      root.hidden = true;
      return;
    }
    root.hidden = false;
    var thread = currentThread();
    var panel = root.querySelector(".clay-live-panel");
    if (!thread) {
      panel.hidden = true;
      return;
    }
    panel.hidden = false;
    root.querySelector(".clay-live-agent").textContent = thread.agent;
    var log = root.querySelector(".clay-live-log");
    var sig = thread.messages.map(function (row) { return row.at + row.from + row.text; }).join("|");
    if (log.dataset.sig !== sig) {
      log.dataset.sig = sig;
      log.innerHTML = thread.messages.map(function (row) {
        return '<p class="clay-live-' + (row.from === "admin" ? "admin" : "mine") + '"><span>' + esc(row.from === "admin" ? thread.agent : "Sen") + "</span>" + esc(row.text) + "</p>";
      }).join("") || "<p class=\"clay-live-empty\">Mesaj yaz. Karşı taraf aynı oturumda görür.</p>";
      log.scrollTop = log.scrollHeight;
    }
  }

  function sendLive(text, from) {
    var clean = String(text || "").trim();
    if (!clean) return;
    var store = readLive();
    var id = "";
    try { id = sessionStorage.getItem("clay-live-thread") || ""; } catch (e) {}
    var thread = store.threads.filter(function (row) { return row.id === id; })[0];
    if (!thread && from === "admin") return;
    if (!thread) return;
    thread.messages.push({ from: from, text: clean.slice(0, 400), at: Date.now() });
    writeLive(store);
  }

  function paintAdminLive() {
    if (!admin()) {
      var gone = document.querySelector(".clay-desk-live");
      if (gone) gone.remove();
      return;
    }
    var store = readLive();
    var box = document.querySelector(".clay-desk-live");
    if (!box) {
      box = document.createElement("section");
      box.className = "clay-desk-live";
      var host = document.querySelector(".mx-auto.min-h-screen") || document.body;
      host.appendChild(box);
    }
    var latest = store.threads.slice().sort(function (a, b) {
      var am = a.messages.length ? a.messages[a.messages.length - 1].at : a.at;
      var bm = b.messages.length ? b.messages[b.messages.length - 1].at : b.at;
      return bm - am;
    })[0];
    var active = box.dataset.picked === "1" ? box.dataset.thread : (latest ? latest.id : "");
    if (active && !store.threads.some(function (row) { return row.id === active; })) active = latest ? latest.id : "";
    box.dataset.thread = active;
    var thread = store.threads.filter(function (row) { return row.id === active; })[0];
    var sig = store.threads.map(function (row) {
      return row.id + ":" + row.messages.length + ":" + (row.messages.length ? row.messages[row.messages.length - 1].at : 0);
    }).join(",") + "|" + active;
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;
    var list = store.threads.slice().reverse().map(function (row) {
      return '<button type="button" data-thread="' + esc(row.id) + '"' + (row.id === active ? ' class="is-on"' : "") + ">" + esc(row.agent) + "</button>";
    }).join("") || "<p>Henüz konuşma yok.</p>";
    var log = thread ? thread.messages.map(function (row) {
      var who = row.from === "admin" ? "Masa" : "Üye";
      return "<p><strong>" + esc(who) + "</strong> " + esc(row.text) + "</p>";
    }).join("") : "";
    box.innerHTML = '<h2>Canlı destek</h2><div class="clay-desk-live-list">' + list + '</div><div class="clay-desk-live-log">' + (log || "<p>Bir konuşma seç.</p>") + '</div><form class="clay-desk-live-form"><input name="metin" maxlength="400" placeholder="Yanıt yaz" autocomplete="off"' + (thread ? "" : " disabled") + '><button class="btn btn-gold" type="submit"' + (thread ? "" : " disabled") + ">Gönder</button></form>";
    box.dataset.thread = active;
    box.dataset.sig = sig;
  }

  function seedPhrase() {
    var bag = WORDS.slice();
    var out = [];
    while (out.length < 12 && bag.length) {
      var roll = new Uint32Array(1);
      crypto.getRandomValues(roll);
      out.push(bag.splice(roll[0] % bag.length, 1)[0]);
    }
    return out.join(" ");
  }

  function showSeed(form, phrase) {
    form.dataset.clayAccount = "1";
    form.dataset.claySeed = phrase;
    var box = form.querySelector("#signup-confirm");
    if (box) box.disabled = false;
    var reveal = form.parentNode.querySelector(".clay-seed-reveal");
    if (!reveal) {
      reveal = document.createElement("section");
      reveal.className = "clay-seed-reveal";
      form.insertAdjacentElement("afterend", reveal);
    }
    var hidden = reveal.classList.contains("is-hidden");
    var words = phrase.split(" ");
    reveal.innerHTML = '<p class="auth-label">Tohum</p><ol class="seed-words">' + words.map(function (word, index) {
      return "<li class=\"seed-word\"><span>" + (index + 1) + "</span>" + esc(word) + "</li>";
    }).join("") + '</ol><div class="seed-actions"><button type="button" class="auth-outline" data-act="seed-hide">Tohumu gizle</button><button type="button" class="auth-outline" data-act="seed-copy">Panoya Kopyala</button><button type="button" class="auth-outline" data-act="seed-file">Metin Belgesi (.txt) Olarak İndir</button></div><p class="clay-seed-note" role="status">Hesap açıldı. Tohumu kaydet, kutuyu işaretle, sonra panele geç.</p>';
    if (hidden) reveal.classList.add("is-hidden");
  }

  async function registerAccount(form) {
    var user = String(form.kullanici.value || "").trim();
    var pass = String(form.parola.value || "");
    var again = String(form.parola2 ? form.parola2.value : "");
    var note = form.querySelector(".clay-reg-note");
    if (!note) {
      note = document.createElement("p");
      note.className = "clay-reg-note banner-bad";
      note.setAttribute("role", "status");
      form.appendChild(note);
    }
    if (!/^[A-Za-z0-9_]{2,24}$/.test(user)) {
      note.textContent = "Kullanıcı adı 2–24 karakter olmalı. Yalnızca harf, rakam ve alt çizgi yaz.";
      return;
    }
    if (!/^[A-Za-z0-9]{6,72}$/.test(pass) || pass !== again) {
      note.textContent = "Parola en az 6 karakter olmalı. Harf ve rakam yazılır. İki kutu aynı olmalı.";
      return;
    }
    var phrase = seedPhrase();
    var payload = { action: "register", kullanici: user, parola: pass, parola2: again, tohum: phrase, sessiz: "1" };
    var res = null;
    try {
      var response = await fetch("/api/ledger.php", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json", Accept: "application/json", "X-Clay": "1" },
        body: JSON.stringify(payload)
      });
      res = await response.json();
    } catch (e) {
      res = null;
    }
    if (!res || res.code !== "ok") {
      note.textContent = res && res.code === "e-var" ? "Bu kullanıcı adı zaten var." : "Hesap açılamadı.";
      return;
    }
    note.textContent = "";
    note.className = "clay-reg-note";
    showSeed(form, phrase);
  }

  function mountPlanAsk(form) {
    var ask = form.parentNode && form.parentNode.querySelector(".clay-plan-ask[data-for='" + (form.querySelector("[name=plan]") || {}).value + "']");
    if (ask) return ask;
    ask = document.createElement("div");
    ask.className = "clay-plan-ask";
    var plan = form.querySelector("[name=plan]");
    ask.dataset.for = plan ? plan.value : "";
    ask.hidden = true;
    ask.innerHTML = "<p>Bu plan, önceki planın yerine geçsin mi?</p><button type=\"button\" class=\"btn btn-gold\" data-act=\"plan-yes\">Onaylıyorum</button><button type=\"button\" class=\"btn btn-ghost\" data-act=\"plan-no\">Reddet</button>";
    form.insertAdjacentElement("afterend", ask);
    return ask;
  }

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || !form.matches) return;
    if (form.matches("form.clay-live-form")) {
      event.preventDefault();
      sendLive(form.metin.value, "visitor");
      form.metin.value = "";
      paintLive();
      return;
    }
    if (form.matches("form.clay-desk-live-form")) {
      event.preventDefault();
      var box = form.closest(".clay-desk-live");
      var id = box ? box.dataset.thread : "";
      try { sessionStorage.setItem("clay-live-thread", id || ""); } catch (e) {}
      sendLive(form.metin.value, "admin");
      form.metin.value = "";
      var desk = document.querySelector(".clay-desk-live");
      if (desk) desk.dataset.sig = "";
      paintAdminLive();
      return;
    }
    if (/\/kayit\/?$/.test(path()) && form.querySelector("[name=kullanici]") && form.querySelector("[name=parola2]")) {
      if (form.dataset.clayAccount === "1") {
        event.preventDefault();
        event.stopPropagation();
        var box = form.querySelector("#signup-confirm");
        if (!box || !box.checked) return;
        var user = form.kullanici.value;
        var pass = form.parola.value;
        var go = function () { location.assign("/panel/"); };
        if (window.__clay && window.__clay.call) {
          window.__clay.call("login", { kullanici: user, parola: pass }).then(go);
          return;
        }
        go();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      registerAccount(form);
      return;
    }
    if (form.classList.contains("plan-offer-cta") && form.querySelector("[name=plan]")) {
      if (form.dataset.clayGo === "1") return;
      event.preventDefault();
      event.stopPropagation();
      var ask = mountPlanAsk(form);
      ask.hidden = false;
      ask.dataset.form = "1";
      form.dataset.clayAsk = "1";
    }
  }, true);

  document.addEventListener("click", function (event) {
    var page = event.target.closest && event.target.closest("[data-clay-page]");
    if (page) {
      event.preventDefault();
      openPage(page.getAttribute("data-clay-page"));
      return;
    }
    if (event.target.closest && event.target.closest("[data-clay-page-close]")) {
      var pop = document.querySelector(".clay-page-pop");
      if (pop) pop.remove();
      return;
    }
    var act = event.target.closest && event.target.closest("[data-act]");
    if (act) {
      var name = act.getAttribute("data-act");
      if (name === "live-open") {
        event.preventDefault();
        openLive();
        return;
      }
      if (name === "live-close") {
        event.preventDefault();
        try { sessionStorage.removeItem("clay-live-thread"); } catch (e) {}
        var panel = document.querySelector(".clay-live-panel");
        if (panel) panel.hidden = true;
        return;
      }
      if (name === "seed-hide") {
        event.preventDefault();
        var reveal = act.closest(".clay-seed-reveal");
        if (!reveal) return;
        var hidden = reveal.classList.toggle("is-hidden");
        act.textContent = hidden ? "Tohumu göster" : "Tohumu gizle";
        return;
      }
      if (name === "seed-copy" || name === "seed-file") {
        event.preventDefault();
        var block = act.closest(".clay-seed-reveal");
        var form = block && block.previousElementSibling;
        var phrase = form && form.dataset.claySeed;
        if (!phrase) return;
        if (name === "seed-copy") {
          navigator.clipboard.writeText(phrase).catch(function () {});
          var status = block.querySelector(".clay-seed-note");
          if (status) status.textContent = "Tohum panoya kopyalandı.";
          return;
        }
        var blob = new Blob(["CLAY seed anahtarı\n\n" + phrase + "\n"], { type: "text/plain" });
        var url = URL.createObjectURL(blob);
        var link = document.createElement("a");
        link.href = url;
        link.download = "clay-seed.txt";
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        return;
      }
      if (name === "plan-no") {
        event.preventDefault();
        var ask = act.closest(".clay-plan-ask");
        if (ask) ask.hidden = true;
        return;
      }
      if (name === "plan-yes") {
        event.preventDefault();
        var yes = act.closest(".clay-plan-ask");
        var planForm = yes && yes.previousElementSibling;
        if (!planForm || !planForm.classList.contains("plan-offer-cta")) return;
        planForm.dataset.clayGo = "1";
        if (yes) yes.hidden = true;
        if (typeof planForm.requestSubmit === "function") planForm.requestSubmit();
        else planForm.submit();
      }
    }
    var threadBtn = event.target.closest && event.target.closest(".clay-desk-live [data-thread]");
    if (threadBtn) {
      event.preventDefault();
      var host = threadBtn.closest(".clay-desk-live");
      if (host) {
        host.dataset.picked = "1";
        host.dataset.thread = threadBtn.getAttribute("data-thread");
        host.dataset.sig = "";
        paintAdminLive();
      }
    }
  }, true);

  document.addEventListener("change", function (event) {
    if (event.target && event.target.name === "tur") syncSample();
  });

  window.addEventListener("storage", function (event) {
    if (event.key !== LIVE_KEY) return;
    var panel = document.querySelector(".clay-live-log");
    if (panel) panel.dataset.sig = "";
    var desk = document.querySelector(".clay-desk-live");
    if (desk) desk.dataset.sig = "";
    paintLive();
    paintAdminLive();
  });

  function tick() {
    tidyAdmin();
    syncSample();
    tidyCards();
    mountSlide();
    onePortrait();
    mountCrypto();
    mountFoot();
    paintLive();
    paintAdminLive();
    if (/\/kayit\/?$/.test(path())) {
      document.body.classList.add("clay-kayit");
      var form = document.querySelector("form input[name=parola2]");
      form = form && form.closest("form");
      if (form && form.dataset.clayAccount === "1") {
        var box = form.querySelector("#signup-confirm");
        if (box) box.disabled = false;
        if (form.dataset.claySeed && !document.querySelector(".clay-seed-reveal")) showSeed(form, form.dataset.claySeed);
      }
    }
  }

  var queued = false;
  var observer = new MutationObserver(function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      tick();
    });
  });
  function boot() {
    if (document.documentElement) observer.observe(document.documentElement, { childList: true, subtree: true });
    tick();
    setInterval(function () {
      paintLive();
      paintAdminLive();
    }, 700);
  }
  if (document.readyState === "complete") setTimeout(boot, 0);
  else window.addEventListener("load", function () { setTimeout(boot, 0); });
})();
