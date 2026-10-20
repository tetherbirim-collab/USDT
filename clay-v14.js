(function () {
  if (window.__CLAY_V14) return;
  window.__CLAY_V14 = true;

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

  var liveOpening = false;
  var liveEnabled = null;
  function visitorShell() {
    var root = document.querySelector(".clay-live");
    if (root) return root;
    root = document.createElement("section");
    root.className = "clay-live";
    root.innerHTML = '<div class="clay-live-panel" hidden><header class="clay-live-head"><span class="clay-live-avatar" aria-hidden="true"></span><span class="clay-live-id"><strong class="clay-live-name">Canlı destek</strong><span class="clay-live-sub">Çevrimiçi</span></span><button type="button" data-act="live-close" aria-label="Kapat"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z"/></svg></button></header><div class="clay-live-log" role="log" aria-live="polite"></div><form class="clay-live-form"><input name="metin" maxlength="400" placeholder="Mesaj yazın" autocomplete="off" enterkeyhint="send"><button class="clay-live-send" type="submit" aria-label="Gönder"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3.2 11.2 20 4.2c.7-.3 1.4.4 1.1 1.1l-7 16.8c-.3.8-1.5.7-1.7-.1l-1.8-6.6-6.6-1.8c-.8-.2-.9-1.4-.1-1.7z"/></svg></button></form></div><button type="button" class="clay-live-btn" data-act="live-open" aria-label="Canlı destek"><svg class="clay-live-icon-chat" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9.2L5 19.4c-.6.5-1.5.1-1.5-.7V5.5z"/></svg><svg class="clay-live-icon-x" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z"/></svg></button>';
    document.body.appendChild(root);
    return root;
  }
  function paintVisitor(thread) {
    if (admin() || liveEnabled === false) {
      var gone = document.querySelector(".clay-live");
      if (gone) gone.remove();
      return;
    }
    if (liveEnabled !== true || !(publicSite() || member())) return;
    var root = visitorShell();
    var panel = root.querySelector(".clay-live-panel");
    var open = root.dataset.open === "1";
    root.classList.toggle("is-open", open);
    panel.hidden = !open;
    if (!thread && liveThread) return;
    var nameNode = root.querySelector(".clay-live-name");
    if (nameNode) nameNode.textContent = thread && thread.username ? thread.username : "Canlı destek";
    var log = root.querySelector(".clay-live-log");
    var messages = thread && thread.messages ? thread.messages : [];
    var sig = (thread && thread.username ? thread.username : "") + "|" + messages.map(function (row) { return row.at + row.from + row.text; }).join("~");
    if (log.dataset.sig === sig) return;
    log.dataset.sig = sig;
    var html = "";
    if (!messages.length) {
      html = '<p class="clay-live-admin clay-live-hello"><span>Destek</span>Merhaba. Mesajınızı yazın, yanıt burada görünür.</p>';
    }
    html += messages.map(function (row) {
      var mine = row.from !== "admin";
      var who = mine ? (thread.username || "Siz") : "Destek";
      return '<p class="clay-live-' + (mine ? "mine" : "admin") + '"><span>' + esc(who) + "</span>" + esc(row.text) + "</p>";
    }).join("");
    log.innerHTML = html;
    log.scrollTop = log.scrollHeight;
  }
  function ensureThread() {
    if (liveEnabled !== true || liveThread || liveOpening) return;
    liveOpening = true;
    postLive({ op: "open" }).then(function (res) {
      liveOpening = false;
      if (!res || !res.ok || !res.thread) return;
      liveThread = res.thread.id;
      paintVisitor(res.thread);
    });
  }
  function refreshVisitor() {
    if (admin()) return;
    postLive({ op: "status" }).then(function (res) {
      var on = !res || res.enabled !== false;
      if (on !== liveEnabled) {
        liveEnabled = on;
        if (!on) {
          var root = document.querySelector(".clay-live");
          if (root) root.remove();
          return;
        }
      } else {
        liveEnabled = on;
      }
      if (!on) return;
      if (!liveThread) {
        paintVisitor(null);
        return;
      }
      postLive({ op: "read", thread: liveThread }).then(function (read) {
        if (read && read.thread) paintVisitor(read.thread);
        else paintVisitor(null);
      });
    });
  }
  function sendVisitor(form) {
    var text = String(form.metin.value || "").trim();
    if (!text || !liveThread) return;
    postLive({ op: "send", text: text, thread: liveThread }).then(function (res) {
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
    var sig = (liveEnabled === false ? "0" : "1") + "|" + threads.map(function (row) {
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
      return '<p class="' + (row.from === "admin" ? "is-admin" : "is-visitor") + '"><strong>' + esc(who) + "</strong> " + esc(row.text) + "</p>";
    }).join("") : "<p>Bir konuşma seç.</p>";
    var draft = "";
    var input = box.querySelector("input[name=metin]");
    if (input && document.activeElement === input) draft = input.value;
    var open = liveEnabled !== false;
    box.innerHTML = '<div class="clay-desk-live-head"><h2>Canlı destek</h2><button type="button" class="btn btn-ghost" data-act="live-switch" data-on="' + (open ? "1" : "0") + '">' + (open ? "Kapat" : "Aç") + "</button></div><p class=\"clay-desk-live-state\">" + (open ? "Ziyaretçiye açık" : "Ziyaretçiye kapalı") + '</p><div class="clay-desk-live-list">' + list + '</div><div class="clay-desk-live-log">' + log + '</div><form class="clay-desk-live-form"><input name="metin" maxlength="400" placeholder="Yanıt yaz" autocomplete="off"' + (active && open ? "" : " disabled") + '><button class="btn btn-gold" type="submit"' + (active && open ? "" : " disabled") + ">Gönder</button></form>";
    var next = box.querySelector("input[name=metin]");
    if (next && draft) next.value = draft;
  }
  function refreshDesk() {
    if (!admin()) return;
    postLive({ op: "list" }).then(function (res) {
      if (res && res.ok) {
        liveEnabled = res.enabled !== false;
        paintDesk(res.threads || []);
      }
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
      event.stopImmediatePropagation();
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
  }, true);

  document.addEventListener("click", function (event) {
    var renew = event.target.closest && event.target.closest("[data-act=renew-yes]");
    if (renew) passOnce("kart-uzat");
    var act = event.target.closest && event.target.closest("[data-act]");
    if (act) {
      var name = act.getAttribute("data-act");
      if (name === "live-switch") {
        event.preventDefault();
        event.stopImmediatePropagation();
        postLive({ op: "switch", acik: act.getAttribute("data-on") === "1" ? "0" : "1" }).then(function () {
          refreshDesk();
        });
        return;
      }
      if (name === "live-open") {
        event.preventDefault();
        event.stopImmediatePropagation();
        var root = document.querySelector(".clay-live");
        if (!root) { paintVisitor(null); root = document.querySelector(".clay-live"); }
        if (!root) return;
        var open = root.dataset.open !== "1";
        root.dataset.open = open ? "1" : "";
        paintVisitor(null);
        if (open) ensureThread();
        else refreshVisitor();
        return;
      }
      if (name === "live-close") {
        event.preventDefault();
        var live = document.querySelector(".clay-live");
        if (live) {
          live.dataset.open = "";
          paintVisitor(null);
        }
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
  });
  document.addEventListener("input", function (event) {
    var target = event.target;
    if (!target) return;
    if (target.name === "tutar") paintIssue();
  });

  function tick() {
    document.body.classList.toggle("clay-desk", admin());
    orderDesk();
    document.body.classList.toggle("clay-issue", /\/panel\/kartlar\/yeni\/?$/.test(path()));
    tidyCards();
    stripLegacyReset();
    paintVisitor(null);
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
    refreshVisitor();
    setInterval(function () {
      refreshVisitor();
      refreshDesk();
    }, 1500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
