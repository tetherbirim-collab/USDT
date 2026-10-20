(function () {
  if (window.__CLAY_V14) return;
  window.__CLAY_V14 = true;

  var WORDS = ["ada", "akasya", "armut", "ayna", "badem", "bahar", "bakir", "balon", "bambu", "belge", "bere", "bez", "boru", "bulut", "cam", "cami", "ceviz", "cicek", "damla", "defter", "deniz", "elma", "fener", "gece", "gol", "gumus", "harita", "kalem", "kapi", "kaya", "kitap", "limon", "masa", "nehir", "orman", "ruzgar", "sabah", "saat", "sepet", "simit", "toprak", "yildiz", "yol", "zeytin", "zincir"];
  var MONEY = {
    issue: "Kart basımı",
    fund: "Karta yükleme",
    plan: "Plan alma",
    "plan-iptal": "Plan iptali",
    cek: "Çekim",
    transfer: "Aktarım",
    close: "Kart kapatma",
    cancel: "Sipariş iptali",
    spend: "Harcama",
    harca: "Harcama",
    refund: "İade",
    renew: "Yenileme",
    activate: "Kartı açma",
    "ana-hesap": "Ana hesaba aktarma",
    purge: "Kartı silme",
    "kupon-uygula": "Kupon",
    "kart-uzat": "Süre uzatma",
    "admin-balance": "Bakiye düzeltme",
    "admin-set-balance": "Bakiye yazma",
    "admin-topup": "Bakiye yükleme",
    "admin-issue": "Kart basımı",
    "admin-transfer": "Aktarım",
    "admin-cek": "Çekim",
    "admin-close": "Kart kapatma"
  };
  var signup = { sig: "", phrase: "", approved: false, created: false, note: "" };
  var liveThread = "";
  var deskThread = "";
  var deskPicked = false;
  var lastLedger = "";
  var askChain = Promise.resolve();
  var origFetch = window.fetch ? window.fetch.bind(window) : null;

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
  function passOnce(action) {
    window.__clayOnayOnce = action;
    setTimeout(function () {
      if (window.__clayOnayOnce === action) window.__clayOnayOnce = "";
    }, 8000);
  }
  function viewer() {
    if (!(window.__clay && window.__clay.get)) return null;
    var db = window.__clay.get();
    if (!db || !Array.isArray(db.users)) return null;
    var id = "";
    try {
      id = sessionStorage.getItem("clay-session") || "";
      if (!id && localStorage.getItem("clay-remember") === "1") id = localStorage.getItem("clay-session") || "";
    } catch (e) {}
    if (id) {
      for (var i = 0; i < db.users.length; i++) if (db.users[i] && db.users[i].id === id) return db.users[i];
    }
    return db.users.length === 1 ? db.users[0] : null;
  }
  function planLive(user) {
    if (!user) return false;
    var plan = user.plan;
    if (plan !== "kivilcim" && plan !== "atolye" && plan !== "galeri") return false;
    return user.planStatus !== "iptal";
  }
  function planLabel(id) {
    var db = window.__clay && window.__clay.get ? window.__clay.get() : null;
    var row = db && db.settings && db.settings.plans ? db.settings.plans[id] : null;
    if (row && row.name) return String(row.name);
    return { kivilcim: "Clay Bronze", atolye: "Clay Silver", galeri: "Clay Gold" }[id] || "Plan";
  }
  function moneyText(action, data) {
    var label = MONEY[action] || "Bu işlem";
    var amount = data && (data.tutar || data.amount || data.plan || "");
    if (action === "plan" && data && data.plan) amount = planLabel(data.plan);
    if (amount) return label + " · " + amount + ". Onaylıyor musun?";
    return label + ". Onaylıyor musun?";
  }

  function openAsk(text) {
    return new Promise(function (resolve) {
      var back = document.createElement("div");
      back.className = "clay-ask-back";
      back.innerHTML = '<div class="clay-ask" role="dialog" aria-modal="true" data-clay-ask="1"><p class="clay-confirm-q"></p><label class="clay-confirm-check"><input type="checkbox"> <span>Onay kutusunu işaretleyin</span></label><div class="clay-confirm-actions"><button type="button" class="btn btn-gold" data-ask="yes" disabled>Onaylıyorum</button><button type="button" class="btn btn-ghost" data-ask="no">Reddet</button></div></div>';
      back.querySelector(".clay-confirm-q").textContent = text;
      document.body.appendChild(back);
      var box = back.querySelector("input");
      var yes = back.querySelector("[data-ask=yes]");
      var no = back.querySelector("[data-ask=no]");
      box.addEventListener("change", function () { yes.disabled = !box.checked; });
      function finish(ok) {
        if (back.parentNode) back.remove();
        resolve(!!ok);
      }
      yes.addEventListener("click", function () { if (box.checked) finish(true); });
      no.addEventListener("click", function () { finish(false); });
      back.addEventListener("click", function (event) { if (event.target === back) finish(false); });
      box.focus();
    });
  }
  function askConfirm(text) {
    var next = askChain.then(function () { return openAsk(text); });
    askChain = next.then(function () { return null; }, function () { return null; });
    return next;
  }

  function readUrl(input) {
    if (typeof input === "string") return input;
    if (input && typeof input.url === "string") return input.url;
    return "";
  }
  function readJson(init) {
    if (!init || typeof init.body !== "string") return null;
    try { return JSON.parse(init.body); } catch (e) { return null; }
  }
  function classify(input, init) {
    var method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();
    if (method !== "POST") return null;
    var url = readUrl(input);
    var data = readJson(init);
    if (!data || !data.action) return null;
    if (url.indexOf("/api/ledger.php") !== -1 && MONEY[data.action]) return { kind: "ledger", action: data.action, text: moneyText(data.action, data) };
    if (url.indexOf("/api/heleket.php") !== -1 && data.action === "create") return { kind: "heleket", action: "create", text: "Bakiye yükleme" + (data.amount ? " · " + data.amount + " USD" : "") + ". Onaylıyor musun?" };
    return null;
  }
  function rememberLedger(response) {
    if (!response || !response.clone) return;
    response.clone().text().then(function (text) {
      if (text && text.indexOf('"mode"') !== -1 && text.indexOf('"db"') !== -1) lastLedger = text;
    }).catch(function () {});
  }
  function rejected(kind) {
    if (kind === "heleket") {
      return new Response(JSON.stringify({ error: "İşlem onaylanmadı." }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    var payload = null;
    try { payload = JSON.parse(lastLedger); } catch (e) { payload = null; }
    if (!payload || !payload.db || !payload.db.settings) {
      var db = window.__clay && window.__clay.get ? window.__clay.get() : null;
      payload = { mode: "php", code: "e-onay", message: "İşlem onaylanmadı.", save: false, db: db || { settings: { plans: {} }, bins: [], users: [], cards: [], transactions: [] }, me: null };
    } else {
      payload.code = "e-onay";
      payload.message = "İşlem onaylanmadı.";
      payload.save = false;
    }
    return new Response(JSON.stringify(payload), { status: 200, headers: { "Content-Type": "application/json" } });
  }
  if (origFetch) {
    window.fetch = function (input, init) {
      var info = classify(input, init);
      var call = function () {
        return Promise.resolve(origFetch(input, init)).then(function (response) {
          if (readUrl(input).indexOf("/api/ledger.php") !== -1) rememberLedger(response);
          return response;
        });
      };
      if (!info) return call();
      if (window.__clayOnayOnce && window.__clayOnayOnce === info.action) {
        window.__clayOnayOnce = "";
        return call();
      }
      if (info.action === "issue") {
        var box = document.querySelector(".clay-confirm [data-clay-approve]");
        if (box && box.checked) return call();
      }
      return askConfirm(info.text).then(function (ok) {
        if (!ok) return rejected(info.kind);
        return call();
      });
    };
  }

  function postLive(body) {
    return fetch("/api/clay-live.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body)
    }).then(function (res) { return res.json(); }).catch(function () { return { ok: false }; });
  }

  function paintVisitor(thread) {
    if (admin()) {
      var gone = document.querySelector(".clay-live");
      if (gone) gone.remove();
      return;
    }
    if (!(publicSite() || member())) return;
    var root = document.querySelector(".clay-live");
    if (!root) {
      root = document.createElement("section");
      root.className = "clay-live";
      root.innerHTML = '<button type="button" class="clay-live-btn" data-act="live-open">Canlı destek</button><div class="clay-live-panel" hidden><header><strong>Canlı destek</strong><button type="button" data-act="live-close" aria-label="Kapat">×</button></header><div class="clay-live-log" role="log"></div><form class="clay-live-form"><input name="kullanici" maxlength="32" placeholder="Kullanıcı adı" autocomplete="off" required><input name="metin" maxlength="400" placeholder="Mesaj" autocomplete="off" required><button class="btn btn-gold" type="submit">Gönder</button></form></div>';
      document.body.appendChild(root);
    }
    var panel = root.querySelector(".clay-live-panel");
    if (root.dataset.open !== "1") panel.hidden = true;
    var log = root.querySelector(".clay-live-log");
    if (!thread) {
      if (!liveThread) log.innerHTML = '<p class="clay-live-empty">Kullanıcı adını ve mesajını yaz.</p>';
      return;
    }
    log.innerHTML = (thread.messages || []).map(function (row) {
      var who = row.from === "admin" ? "Masa" : thread.username;
      return '<p class="clay-live-' + (row.from === "admin" ? "admin" : "mine") + '"><span>' + esc(who) + "</span>" + esc(row.text) + "</p>";
    }).join("") || '<p class="clay-live-empty">Kullanıcı adını ve mesajını yaz.</p>';
    log.scrollTop = log.scrollHeight;
  }
  function refreshVisitor() {
    if (!liveThread || admin()) return;
    postLive({ op: "read", thread: liveThread }).then(function (res) {
      if (res && res.thread) paintVisitor(res.thread);
    });
  }
  function sendVisitor(form) {
    var name = String(form.kullanici.value || "").trim().replace(/\s+/g, " ");
    var text = String(form.metin.value || "").trim();
    if (name.length < 2 || !text) return;
    postLive({ op: "send", username: name, text: text, thread: liveThread }).then(function (res) {
      if (!res || !res.ok || !res.thread) return;
      liveThread = res.thread.id;
      form.metin.value = "";
      paintVisitor(res.thread);
    });
  }

  function paintDesk(threads) {
    if (!admin()) {
      var gone = document.querySelector(".clay-desk-live");
      if (gone) gone.remove();
      return;
    }
    var box = document.querySelector(".clay-desk-live");
    if (!box) {
      box = document.createElement("section");
      box.className = "clay-desk-live glass";
      var host = document.querySelector(".mx-auto.min-h-screen") || document.body;
      var nav = host.querySelector(":scope > nav");
      var header = host.querySelector(":scope > header");
      var anchor = nav || header;
      if (anchor && anchor.parentNode === host) host.insertBefore(box, anchor.nextSibling);
      else host.appendChild(box);
    }
    threads = Array.isArray(threads) ? threads.slice() : [];
    threads.sort(function (a, b) {
      var am = a.messages && a.messages.length ? a.messages[a.messages.length - 1].at : a.at;
      var bm = b.messages && b.messages.length ? b.messages[b.messages.length - 1].at : b.at;
      return bm - am;
    });
    if (!deskPicked) deskThread = threads[0] ? threads[0].id : "";
    if (deskThread && !threads.some(function (row) { return row.id === deskThread; })) deskThread = threads[0] ? threads[0].id : "";
    var active = null;
    threads.forEach(function (row) { if (row.id === deskThread) active = row; });
    var sig = threads.map(function (row) {
      var last = row.messages && row.messages.length ? row.messages[row.messages.length - 1].at : 0;
      return row.id + ":" + row.username + ":" + (row.messages ? row.messages.length : 0) + ":" + last;
    }).join("|") + ">" + deskThread;
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;
    var list = threads.map(function (row) {
      return '<button type="button" data-thread="' + esc(row.id) + '"' + (row.id === deskThread ? ' class="is-on"' : "") + ">" + esc(row.username) + "</button>";
    }).join("") || "<p>Henüz konuşma yok.</p>";
    var log = active ? (active.messages || []).map(function (row) {
      var who = row.from === "admin" ? "Masa" : active.username;
      return "<p><strong>" + esc(who) + "</strong> " + esc(row.text) + "</p>";
    }).join("") : "<p>Bir konuşma seç.</p>";
    var draft = "";
    var input = box.querySelector("input[name=metin]");
    if (input && document.activeElement === input) draft = input.value;
    box.innerHTML = '<h2>Canlı destek</h2><div class="clay-desk-live-list">' + list + '</div><div class="clay-desk-live-log">' + log + '</div><form class="clay-desk-live-form"><input name="metin" maxlength="400" placeholder="Yanıt yaz" autocomplete="off"' + (active ? "" : " disabled") + '><button class="btn btn-gold" type="submit"' + (active ? "" : " disabled") + ">Gönder</button></form>";
    var next = box.querySelector("input[name=metin]");
    if (next && draft) next.value = draft;
  }
  function refreshDesk() {
    if (!admin()) return;
    postLive({ op: "list" }).then(function (res) {
      if (res && res.ok) paintDesk(res.threads || []);
      else if (res && res.error === "giris") paintDesk([]);
    });
  }
  function sendDesk(form) {
    var text = String(form.metin.value || "").trim();
    if (!text || !deskThread) return;
    postLive({ op: "reply", thread: deskThread, text: text }).then(function () {
      form.metin.value = "";
      refreshDesk();
    });
  }

  function seedPhrase() {
    var bag = WORDS.slice();
    var out = [];
    var roll = new Uint32Array(1);
    while (out.length < 12 && bag.length) {
      crypto.getRandomValues(roll);
      out.push(bag.splice(roll[0] % bag.length, 1)[0]);
    }
    return out.join(" ");
  }
  function signupForm() {
    if (!/\/kayit\/?$/.test(path())) return null;
    var field = document.querySelector('form input[name="parola2"]');
    return field ? field.closest("form") : null;
  }
  function signupValues(form) {
    return {
      user: String((form.kullanici && form.kullanici.value) || "").trim(),
      pass: String((form.parola && form.parola.value) || ""),
      again: String((form.parola2 && form.parola2.value) || "")
    };
  }
  function signupReady(values) {
    return /^[A-Za-z0-9_]{2,24}$/.test(values.user) && /^[A-Za-z0-9]{6,72}$/.test(values.pass) && values.pass === values.again;
  }
  function downloadSeed(phrase) {
    var blob = new Blob(["CLAY tohum\n\n" + phrase + "\n\nBu tohum hesap açılırken gösterilir. Şifreni unutursan kullanıcı adın ve bu tohumla girersin.\n"], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "clay-tohum.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }
  function paintSignup() {
    document.body.classList.toggle("clay-kayit", /\/kayit\/?$/.test(path()));
    var form = signupForm();
    if (!form) return;
    var nativeSeed = form.querySelector(".seed-block");
    if (nativeSeed) nativeSeed.hidden = true;
    var nativeCheck = form.querySelector(".auth-check");
    if (nativeCheck) nativeCheck.hidden = true;
    var nativeBox = form.querySelector("#signup-confirm");
    if (nativeBox) {
      nativeBox.required = false;
      nativeBox.disabled = true;
    }
    var values = signupValues(form);
    if (!signup.created) {
      if (signupReady(values)) {
        var sig = values.user + "\n" + values.pass;
        if (sig !== signup.sig) {
          signup.sig = sig;
          signup.phrase = seedPhrase();
          signup.approved = false;
          signup.note = "";
        }
      } else if (!signup.created) {
        signup.sig = "";
        signup.phrase = "";
        signup.approved = false;
      }
    }
    var panel = form.querySelector(".clay-signup-seed");
    if (!panel) {
      panel = document.createElement("section");
      panel.className = "clay-signup-seed";
      panel.innerHTML = '<p class="auth-label">Tohum</p><ol class="seed-words"></ol><div class="clay-signup-ask"><p class="clay-confirm-q">Bu tohumla hesabı açıyorsun. Onaylıyor musun?</p><label class="clay-confirm-check"><input type="checkbox" data-seed-approve> <span>Onay kutusunu işaretleyin</span></label><div class="clay-confirm-actions"><button type="button" class="btn btn-gold" data-act="seed-yes" disabled>Onaylıyorum</button><button type="button" class="btn btn-ghost" data-act="seed-no">Reddet</button></div></div><div class="clay-signup-files" hidden><button type="button" class="btn btn-gold" data-act="seed-save">Kaydet</button><button type="button" class="btn btn-ghost" data-act="seed-download">İndir</button></div><p class="clay-signup-note" role="status"></p>';
    }
    var submit = form.querySelector('button[type="submit"]');
    if (submit && panel.nextElementSibling !== submit) form.insertBefore(panel, submit);
    else if (!panel.parentNode) form.appendChild(panel);
    panel.hidden = !signup.phrase;
    var list = panel.querySelector(".seed-words");
    var shown = signup.phrase ? signup.phrase.split(" ") : [];
    if (list.dataset.phrase !== signup.phrase) {
      list.dataset.phrase = signup.phrase;
      list.dataset.fresh = "1";
      list.innerHTML = shown.map(function (word, index) {
        return '<li class="seed-word"><span>' + (index + 1) + "</span>" + esc(word) + "</li>";
      }).join("");
    }
    var ask = panel.querySelector(".clay-signup-ask");
    var files = panel.querySelector(".clay-signup-files");
    if (ask) ask.hidden = !signup.phrase || signup.created;
    if (files) files.hidden = !signup.created;
    var box = panel.querySelector("[data-seed-approve]");
    var yes = panel.querySelector("[data-act=seed-yes]");
    if (box && list.dataset.fresh === "1") {
      box.checked = false;
      list.dataset.fresh = "";
    }
    if (yes) yes.disabled = !(box && box.checked);
    var note = panel.querySelector(".clay-signup-note");
    if (note) note.textContent = signup.note;
    if (submit) submit.disabled = signup.created;
  }
  function registerSignup(form) {
    var values = signupValues(form);
    if (!signup.phrase || !signup.approved || !signupReady(values)) {
      signup.note = "Önce kullanıcı adı, iki şifre ve tohum onayı.";
      paintSignup();
      return;
    }
    fetch("/api/ledger.php", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", Accept: "application/json", "X-Clay": "1" },
      body: JSON.stringify({ action: "register", kullanici: values.user, parola: values.pass, parola2: values.again, tohum: signup.phrase, sessiz: "1" })
    }).then(function (res) { return res.json(); }).then(function (res) {
      if (!res || res.code !== "ok") {
        signup.note = res && res.code === "e-var" ? "Bu kullanıcı adı zaten var." : "Hesap açılamadı.";
        paintSignup();
        return;
      }
      signup.created = true;
      signup.note = "Hesap açıldı. Tohumu kaydet veya indir.";
      paintSignup();
    }).catch(function () {
      signup.note = "Hesap açılamadı.";
      paintSignup();
    });
  }

  function paintPlan() {
    var stages = document.querySelectorAll(".plan-stage");
    if (!stages.length) return;
    var user = viewer();
    var live = planLive(user);
    var sig = live ? user.id + ":" + user.plan + ":" + (user.planStatus || "aktif") : "off";
    stages.forEach(function (stage) {
      var gate = stage.previousElementSibling && stage.previousElementSibling.classList.contains("clay-plan-gate") ? stage.previousElementSibling : null;
      if (!live) {
        if (gate) gate.remove();
        stage.querySelectorAll(".plan-offer-cta button").forEach(function (btn) {
          if ((btn.textContent || "").trim() === "Bu paket sende") btn.textContent = "Bu plana geç";
        });
        return;
      }
      if (!gate) {
        gate = document.createElement("section");
        gate.className = "clay-plan-gate";
        stage.parentNode.insertBefore(gate, stage);
      }
      if (gate.dataset.sig === sig) return;
      gate.dataset.sig = sig;
      var name = planLabel(user.plan);
      gate.innerHTML = "<p>Mevcut plan: <strong>" + esc(name) + "</strong>. Yeni plan, bu plan iptal edilmeden açılmaz.</p><button type=\"button\" class=\"btn btn-ghost\" data-act=\"plan-cancel\">Planı iptal et</button>";
    });
  }
  function cancelPlan() {
    if (!(window.__clay && window.__clay.call)) return Promise.resolve(null);
    passOnce("plan-iptal");
    return window.__clay.call("plan-iptal", { onay: "on" });
  }

  function amountText(raw) {
    var value = String(raw || "").trim();
    if (!value) return "—";
    return value.replace(".", ",") + " USD";
  }
  function paintIssue() {
    if (!/\/panel\/kartlar\/yeni\/?$/.test(path())) return;
    var gate = document.querySelector(".clay-confirm");
    if (!gate) return;
    var host = document.querySelector(".mx-auto.min-h-screen") || document.body;
    if (host.lastElementChild !== gate) host.appendChild(gate);
    var picked = document.querySelector('input[name="tur"]:checked');
    var label = picked && picked.closest("label");
    var name = "—";
    var kind = "—";
    if (label) {
      var nameNode = label.querySelector(".entrance-type, .font-semibold");
      if (nameNode) {
        var first = nameNode.childNodes[0];
        name = String((first && first.nodeType === 3 ? first.textContent : nameNode.textContent) || "").trim();
      }
      var kindNode = label.querySelector(".bin-global");
      if (kindNode) kind = String(kindNode.textContent || "").trim();
    }
    var field = document.querySelector('input[name="tutar"]');
    var raw = field ? field.value : "";
    var shown = amountText(raw);
    var brand = gate.querySelector(".clay-sample-brand");
    if (brand) brand.textContent = name || "—";
    var lines = gate.querySelectorAll(".clay-sample-line strong");
    if (lines[0]) lines[0].textContent = shown;
    if (lines[1]) lines[1].textContent = shown;
    var global = gate.querySelector(".clay-sample .bin-global");
    if (global) global.textContent = kind || "—";
    var question = gate.querySelector(".clay-confirm-q");
    if (question) {
      question.textContent = raw
        ? "Bu kadar " + shown + " bakiye yüklüyorsun, onaylıyor musun?"
        : "Tutarı ve kart türünü seç. Onaylıyor musun?";
    }
  }
  window.__clayPaintIssue = paintIssue;

  function orderDesk() {
    if (!admin()) return;
    var host = document.querySelector(".mx-auto.min-h-screen");
    if (!host) return;
    var header = host.querySelector(":scope > header");
    var nav = host.querySelector(":scope > nav");
    var anchor = nav || header;
    if (!anchor || anchor.parentNode !== host) return;
    var live = host.querySelector(":scope > .clay-desk-live");
    var coupon = host.querySelector(":scope > .clay-coupon-admin");
    if (live && live.previousElementSibling !== anchor) host.insertBefore(live, anchor.nextSibling);
    var after = host.querySelector(":scope > .clay-desk-live") || anchor;
    if (coupon && coupon.previousElementSibling !== after) host.insertBefore(coupon, after.nextSibling);
    host.querySelectorAll(".clay-coupon-admin > button[data-act=disable-coupon]:not([data-code])").forEach(function (btn) { btn.remove(); });
  }
  function tidyCards() {
    document.querySelectorAll("article[id^='crd_']").forEach(function (article) {
      article.querySelectorAll("[data-act=pin],[data-act=card-pdf],[data-act=card-close]").forEach(function (btn) {
        if (btn.closest(".card-menu")) return;
        btn.remove();
      });
    });
  }
  function stripLegacyReset() {
    if (!/\/sifre\/?$/.test(path())) return;
    document.querySelectorAll("button").forEach(function (btn) {
      var text = (btn.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (text === "tohumu olmayan eski hesap" || text === "eski yöntem ile devam et") btn.remove();
    });
    document.querySelectorAll('select[name="soru"], input[name="cevap"]').forEach(function (node) {
      var label = node.closest("label");
      if (label) label.remove();
      else node.remove();
    });
    document.querySelectorAll("p").forEach(function (node) {
      if ((node.textContent || "").indexOf("Soruyu, yanıtı") !== -1 && node.closest("form")) node.remove();
    });
  }
  function halfMarkup(faces) {
    var bits = ['<span class="clay-slide-word">clay kart</span>', '<code class="clay-slide-code">clay.kart({ kimlik: false, eposta: false })</code>', '<span class="clay-slide-word">kimlik</span>'];
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
    });
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
        el.__anim = window.lottie.loadAnimation({ container: el, renderer: "svg", loop: true, autoplay: true, path: el.getAttribute("data-file"), assetsPath: el.getAttribute("data-assets") || undefined });
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
  function mountFoot() {
    if (!publicSite()) return;
    if (document.querySelector(".clay-site-foot")) return;
    var foot = document.createElement("footer");
    foot.className = "clay-site-foot";
    foot.innerHTML = '<nav><button type="button" data-clay-page="misyon">Misyon</button><button type="button" data-clay-page="vizyon">Vizyon</button></nav><p>tüm hakları saklıdır</p>';
    var main = document.querySelector("main");
    if (main) main.appendChild(foot);
    else document.body.appendChild(foot);
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

  document.addEventListener("submit", function (event) {
    var form = event.target;
    if (!form || !form.matches) return;
    if (form.matches("form.clay-live-form")) {
      event.preventDefault();
      event.stopPropagation();
      sendVisitor(form);
      return;
    }
    if (form.matches("form.clay-desk-live-form")) {
      event.preventDefault();
      event.stopPropagation();
      sendDesk(form);
      return;
    }
    if (form.classList.contains("plan-offer-cta") && form.querySelector("[name=plan]")) {
      if (form.dataset.clayGo === "1") {
        form.dataset.clayGo = "";
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      var user = viewer();
      if (planLive(user)) {
        askConfirm("Yeni plan açılmaz. Mevcut planı iptal ediyor musun? Onaylıyor musun?").then(function (ok) {
          if (ok) cancelPlan();
        });
        return;
      }
      askConfirm("Bu planı almak üzeresin. Onaylıyor musun?").then(function (ok) {
        if (!ok) return;
        passOnce("plan");
        form.dataset.clayGo = "1";
        if (typeof form.requestSubmit === "function") form.requestSubmit();
        else form.submit();
      });
      return;
    }
    if (signupForm() === form) {
      event.preventDefault();
      event.stopPropagation();
      if (signup.created) return;
      if (!signup.approved) {
        signup.note = "Tohumu onaylaman gerekir.";
        paintSignup();
        return;
      }
      registerSignup(form);
    }
  }, true);

  document.addEventListener("click", function (event) {
    var renew = event.target.closest && event.target.closest("[data-act=renew-yes]");
    if (renew) passOnce("kart-uzat");
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
        var root = document.querySelector(".clay-live");
        if (!root) { paintVisitor(null); root = document.querySelector(".clay-live"); }
        if (!root) return;
        var open = root.dataset.open !== "1";
        root.dataset.open = open ? "1" : "";
        var panel = root.querySelector(".clay-live-panel");
        if (panel) panel.hidden = !open;
        if (!open) liveThread = "";
        return;
      }
      if (name === "live-close") {
        event.preventDefault();
        liveThread = "";
        var live = document.querySelector(".clay-live");
        if (live) {
          live.dataset.open = "";
          var pane = live.querySelector(".clay-live-panel");
          if (pane) pane.hidden = true;
        }
        return;
      }
      if (name === "seed-yes" || name === "seed-no" || name === "seed-save" || name === "seed-download") {
        event.preventDefault();
        if (name === "seed-no") {
          signup.approved = false;
          signup.note = "Tohum onayı kalktı.";
          var seedBox = act.closest(".clay-signup-seed");
          var input = seedBox && seedBox.querySelector("[data-seed-approve]");
          if (input) input.checked = false;
          var yesBtn = seedBox && seedBox.querySelector("[data-act=seed-yes]");
          if (yesBtn) yesBtn.disabled = true;
          paintSignup();
          return;
        }
        if (name === "seed-yes") {
          var box = act.closest(".clay-signup-seed").querySelector("[data-seed-approve]");
          if (!box || !box.checked) return;
          signup.approved = true;
          signup.note = "Tohum onaylandı. Kayıt ol ile hesabı aç.";
          paintSignup();
          return;
        }
        if (!signup.created || !signup.phrase) return;
        downloadSeed(signup.phrase);
        signup.note = name === "seed-save" ? "Tohum dosyası kaydedildi." : "Tohum dosyası indirildi.";
        paintSignup();
        return;
      }
      if (name === "plan-cancel") {
        event.preventDefault();
        askConfirm("Mevcut planı iptal ediyor musun? Onaylıyor musun?").then(function (ok) {
          if (ok) cancelPlan();
        });
      }
    }
    var threadBtn = event.target.closest && event.target.closest(".clay-desk-live [data-thread]");
    if (threadBtn) {
      event.preventDefault();
      deskPicked = true;
      deskThread = threadBtn.getAttribute("data-thread");
      refreshDesk();
    }
  }, true);

  document.addEventListener("change", function (event) {
    var target = event.target;
    if (!target) return;
    if (target.name === "tur" || target.name === "tutar") paintIssue();
    if (target.matches && target.matches("[data-seed-approve]")) {
      if (!target.checked) {
        signup.approved = false;
        signup.note = "";
      }
      var yes = target.closest(".clay-signup-seed");
      yes = yes && yes.querySelector("[data-act=seed-yes]");
      if (yes) yes.disabled = !target.checked;
    }
  });
  document.addEventListener("input", function (event) {
    var target = event.target;
    if (!target) return;
    if (target.name === "tutar") paintIssue();
    if (target.name === "kullanici" || target.name === "parola" || target.name === "parola2") paintSignup();
  });

  function tick() {
    document.body.classList.toggle("clay-desk", admin());
    orderDesk();
    document.body.classList.toggle("clay-issue", /\/panel\/kartlar\/yeni\/?$/.test(path()));
    tidyCards();
    stripLegacyReset();
    mountSlide();
    onePortrait();
    mountCrypto();
    mountFoot();
    paintVisitor(null);
    paintSignup();
    paintPlan();
    paintIssue();
    document.querySelectorAll(".clay-live-btn ~ .clay-live-btn, .clay-site-foot [data-act=live-open]").forEach(function (node) { node.remove(); });
  }
  var queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () {
      queued = false;
      tick();
    });
  }
  function boot() {
    if (document.documentElement) {
      new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
    }
    tick();
    refreshDesk();
    setInterval(function () {
      refreshVisitor();
      refreshDesk();
    }, 1500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
