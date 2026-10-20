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
  var liveStatus = "acik";
  var liveAutos = [];
  var audioCtx = null;
  var audioHeard = {};
  var deskSeen = null;
  window.__clayAudio = { state: "idle", played: [] };
  function unlockAudio() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();
      window.__clayAudio.ctx = audioCtx;
      window.__clayAudio.state = audioCtx.state;
      return audioCtx.state === "running";
    } catch (e) {
      window.__clayAudio.state = "blocked";
      return false;
    }
  }
  function playTone(freq, delay, dur) {
    if (!audioCtx || audioCtx.state !== "running") return false;
    var start = audioCtx.currentTime + delay;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.06, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + dur + 0.02);
    return true;
  }
  function playChime(kind) {
    var ok = false;
    if (kind === "welcome") ok = playTone(523, 0, 0.16) && playTone(784, 0.12, 0.2);
    else if (kind === "customer") ok = playTone(440, 0, 0.12) && playTone(660, 0.09, 0.16);
    else ok = playTone(392, 0, 0.1) && playTone(523, 0.08, 0.14);
    window.__clayAudio.state = audioCtx ? audioCtx.state : "blocked";
    if (ok) window.__clayAudio.played.push(kind);
    return ok;
  }
  function hearWelcome(messages) {
    (messages || []).forEach(function (row) {
      if (row.from !== "welcome") return;
      var key = "w" + row.at;
      if (audioHeard[key]) return;
      if (Date.now() - Number(row.at) > 12000) {
        audioHeard[key] = true;
        return;
      }
      if (playChime("welcome")) audioHeard[key] = true;
    });
  }
  function hearDesk(threads) {
    if (!admin()) return;
    var keys = [];
    (threads || []).forEach(function (row) {
      keys.push("chat:" + row.id);
      (row.messages || []).forEach(function (msg) {
        if (msg.from === "visitor") keys.push("msg:" + row.id + ":" + msg.at);
      });
    });
    var db = window.__clay && window.__clay.get ? window.__clay.get() : null;
    if (db) {
      (db.users || []).forEach(function (user) { if (user && user.role === "uye") keys.push("user:" + user.id); });
      (db.orders || []).forEach(function (order) { if (order && order.status === "hazirlaniyor") keys.push("order:" + order.id); });
      (db.payouts || []).forEach(function (payout) { if (payout && payout.status === "bekliyor") keys.push("pay:" + payout.id); });
      (db.tickets || []).forEach(function (ticket) { if (ticket && ticket.status === "acik") keys.push("tkt:" + ticket.id); });
      (db.transactions || []).forEach(function (tx) {
        if (tx && (tx.kind === "yukleme" || tx.kind === "cek" || tx.kind === "transfer")) keys.push("tx:" + tx.id);
      });
      (db.cards || []).forEach(function (card) { if (card && card.status === "donduruldu") keys.push("card:" + card.id); });
    }
    if (!deskSeen) {
      deskSeen = {};
      keys.forEach(function (key) { deskSeen[key] = true; });
      return;
    }
    var customer = false;
    var other = false;
    keys.forEach(function (key) {
      if (deskSeen[key]) return;
      deskSeen[key] = true;
      if (key.indexOf("msg:") === 0) customer = true;
      else other = true;
    });
    if (customer) playChime("customer");
    else if (other) playChime("desk");
  }
  function girisTrust() {
    if (!/^\/giris\/?$/.test(path())) return;
    if (document.querySelector(".auth-stage .trust-line")) return;
    var stage = document.querySelector(".auth-stage");
    if (!stage) return;
    var line = document.createElement("p");
    line.className = "trust-line";
    line.innerHTML = "<span>KYC YOK</span><span aria-hidden=\"true\"> · </span><span class=\"trust-hot\">LOG YOK</span><span aria-hidden=\"true\"> · </span><span>TAMAMEN GÜVENLİ VE ANONİM</span>";
    stage.insertBefore(line, stage.firstChild);
  }
  function refineMarks() {
    document.querySelectorAll("svg.h-8, svg.h-9").forEach(function (svg) {
      if (svg.dataset.clayCard === "1" || svg.getAttribute("viewBox") !== "0 0 32 32") return;
      if (svg.innerHTML.indexOf("#f0c98a") === -1) return;
      svg.dataset.clayCard = "1";
      svg.setAttribute("viewBox", "0 0 68 44");
      svg.setAttribute("class", (svg.getAttribute("class") || "") + " clay-brand-card");
      svg.setAttribute("aria-hidden", "true");
      svg.innerHTML = '<rect width="68" height="44" rx="7" fill="#e2b15a"/><rect x="7" y="9" width="14" height="10" rx="2" fill="#fff6e4"/><text x="7" y="34" fill="#3a2410" font-size="12" font-family="Clay Display, Times New Roman, serif" letter-spacing="1.4">CLAY</text>';
    });
  }
  var livePanelHtml = '<div class="clay-live-panel" hidden><header class="clay-live-head"><span class="clay-live-card" aria-hidden="true"><span class="clay-live-card-chip"></span><span class="clay-live-card-mark">CLAY</span></span><span class="clay-live-id"><span class="clay-live-brand">Clay Virtual Card</span><span class="clay-live-role">Müşteri temsilcisi</span><strong class="clay-live-name">Canlı destek</strong><span class="clay-live-sub"><i class="clay-live-dot is-on"></i><span class="clay-live-subtext">Çevrimiçi</span></span></span><button type="button" data-act="live-close" aria-label="Kapat"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z"/></svg></button></header><div class="clay-live-log" role="log" aria-live="polite"></div><div class="clay-live-foot"><div class="clay-live-autos"></div><form class="clay-live-form"><label class="clay-live-photo"><input type="file" accept="image/*" hidden><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M4 6.5A2.5 2.5 0 0 1 6.5 4h2.2l1.2-1.6A2 2 0 0 1 11.4 1.5h1.2a2 2 0 0 1 1.5.9L15.3 4H17.5A2.5 2.5 0 0 1 20 6.5v11A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5v-11zM12 16.2a3.7 3.7 0 1 0 0-7.4 3.7 3.7 0 0 0 0 7.4z"/></svg></label><input name="metin" maxlength="400" placeholder="Mesaj yazın" autocomplete="off" enterkeyhint="send"><button class="clay-live-send" type="submit" aria-label="Gönder"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3.2 11.2 20 4.2c.7-.3 1.4.4 1.1 1.1l-7 16.8c-.3.8-1.5.7-1.7-.1l-1.8-6.6-6.6-1.8c-.8-.2-.9-1.4-.1-1.7z"/></svg></button></form></div></div>';
  var liveButtonHtml = '<button type="button" class="clay-live-btn" data-act="live-open" aria-label="Canlı destek"><i class="clay-live-beacon" aria-hidden="true"></i><svg class="clay-live-icon-chat" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H9.2L5 19.4c-.6.5-1.5.1-1.5-.7V5.5z"/></svg><svg class="clay-live-icon-x" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z"/></svg></button>';
  function visitorShell() {
    if (!document.body) return null;
    var root = document.querySelector(".clay-live");
    if (!root) {
      root = document.createElement("section");
      root.className = "clay-live";
      root.innerHTML = livePanelHtml + liveButtonHtml;
      document.body.appendChild(root);
      return root;
    }
    if (!root.querySelector(".clay-live-panel")) root.insertAdjacentHTML("afterbegin", livePanelHtml);
    if (!root.querySelector(".clay-live-btn")) root.insertAdjacentHTML("beforeend", liveButtonHtml);
    if (!root.querySelector(".clay-live-autos")) {
      var form = root.querySelector(".clay-live-form");
      if (form && form.parentNode) {
        var foot = document.createElement("div");
        foot.className = "clay-live-foot";
        var chips = document.createElement("div");
        chips.className = "clay-live-autos";
        form.parentNode.insertBefore(foot, form);
        foot.appendChild(chips);
        foot.appendChild(form);
      }
    }
    return root;
  }
  function paintVisitor(thread) {
    var root = visitorShell();
    if (!root) return;
    var closed = liveEnabled === false;
    root.classList.toggle("is-live", !closed);
    root.classList.toggle("is-closed", closed);
    if (closed) {
      root.dataset.open = "";
      root.classList.remove("is-open");
      var shut = root.querySelector(".clay-live-panel");
      if (shut) shut.hidden = true;
      return;
    }
    var panel = root.querySelector(".clay-live-panel");
    if (!panel) return;
    var open = root.dataset.open === "1";
    root.classList.toggle("is-open", open);
    panel.hidden = !open;
    paintAutoChips(root);
    if (!thread && liveThread) return;
    var nameNode = root.querySelector(".clay-live-name");
    if (nameNode) nameNode.textContent = thread && thread.username ? thread.username : "Canlı destek";
    var log = root.querySelector(".clay-live-log");
    var messages = thread && thread.messages ? thread.messages : [];
    var state = thread && thread.status ? thread.status : "acik";
    if (thread) liveStatus = state;
    var sub = root.querySelector(".clay-live-subtext");
    var dot = root.querySelector(".clay-live-dot");
    var subLabel = "Çevrimiçi";
    var tone = "is-on";
    if (state === "beklemede") { subLabel = "Beklemede"; tone = "is-hold"; }
    if (state === "bitti") { subLabel = "Görüşme sonlandı"; tone = "is-off"; }
    if (sub) sub.textContent = subLabel;
    if (dot) dot.className = "clay-live-dot " + tone;
    var field = root.querySelector(".clay-live-form input[name=metin]");
    var sendBtn = root.querySelector(".clay-live-send");
    var photo = root.querySelector(".clay-live-photo input");
    var ended = state === "bitti";
    if (field) {
      field.disabled = ended;
      field.placeholder = ended ? "Görüşme sonlandı" : "Mesaj yazın";
    }
    if (sendBtn) sendBtn.disabled = ended;
    if (photo) photo.disabled = ended;
    var sig = (thread && thread.username ? thread.username : "") + "|" + state + "|" + messages.map(function (row) { return row.at + row.from + row.text + (row.image || ""); }).join("~");
    hearWelcome(messages);
    if (log.dataset.sig === sig) return;
    log.dataset.sig = sig;
    var html = "";
    if (!messages.length && state !== "bitti") {
      html = '<p class="clay-live-admin clay-live-hello"><span>Clay Virtual Card</span>Merhaba. Mesajınızı veya fotoğrafınızı gönderin, yanıt burada görünür.</p>';
    }
    html += messages.map(function (row) {
      var mine = row.from === "visitor";
      var who = mine ? (thread.username || "Siz") : (row.from === "auto" ? "Otomasyon" : "Destek");
      var photo = row.image ? '<img src="/api/clay-live-file.php?id=' + esc(row.image) + '" alt="Fotoğraf">' : "";
      return '<p class="clay-live-' + (mine ? "mine" : "admin") + '"><span>' + esc(who) + "</span>" + photo + (row.text ? esc(row.text) : "") + "</p>";
    }).join("");
    if (state === "beklemede") html += '<p class="clay-live-admin"><span>Destek</span>Görüşme beklemede.</p>';
    if (state === "bitti") html += '<p class="clay-live-admin"><span>Destek</span>Görüşme sonlandı.</p>';
    log.innerHTML = html;
    log.scrollTop = log.scrollHeight;
  }
  var liveOpenWait = null;
  function whenThread() {
    if (liveThread) return Promise.resolve(liveThread);
    if (liveOpenWait) return liveOpenWait;
    liveOpening = true;
    liveOpenWait = postLive({ op: "open" }).then(function (res) {
      liveOpening = false;
      liveOpenWait = null;
      if (res && res.enabled === false) {
        liveEnabled = false;
        paintVisitor(null);
        return "";
      }
      if (!res || !res.ok || !res.thread) return "";
      liveThread = res.thread.id;
      paintVisitor(res.thread);
      return liveThread;
    });
    return liveOpenWait;
  }
  function ensureThread() {
    if (liveEnabled === false || liveThread || liveOpening) return;
    whenThread();
  }
  function dropThread() {
    liveThread = "";
    liveStatus = "acik";
    var root = document.querySelector(".clay-live");
    if (root) {
      var log = root.querySelector(".clay-live-log");
      if (log) log.dataset.sig = "";
    }
    paintVisitor(null);
    if (root && root.dataset.open === "1") ensureThread();
  }
  function refreshVisitor() {
    postLive({ op: "status" }).then(function (res) {
      if (res && Array.isArray(res.autos)) liveAutos = res.autos;
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
        else if (read && read.error === "yok") dropThread();
      });
    });
  }
  function sendVisitor(form) {
    var text = String(form.metin.value || "").trim();
    if (!text || !liveThread || liveStatus === "bitti") return;
    postLive({ op: "send", text: text, thread: liveThread }).then(function (res) {
      if (res && res.thread && res.error === "bitti") {
        paintVisitor(res.thread);
        return;
      }
      if (!res || !res.ok || !res.thread) return;
      liveThread = res.thread.id;
      form.metin.value = "";
      paintVisitor(res.thread);
    });
  }
  function shrinkImage(file) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type || "")) {
        reject();
        return;
      }
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var max = 960;
        var scale = Math.min(1, max / Math.max(img.width || 1, img.height || 1));
        var canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round((img.width || 1) * scale));
        canvas.height = Math.max(1, Math.round((img.height || 1) * scale));
        var ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          reject();
          return;
        }
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        var quality = 0.82;
        var data = "";
        for (var i = 0; i < 5; i++) {
          data = canvas.toDataURL("image/jpeg", quality);
          if (Math.floor((data.length - 24) * 0.75) <= 1100000) break;
          quality -= 0.12;
        }
        if (!data || data.indexOf("data:image/jpeg;base64,") !== 0) reject();
        else resolve(data);
      };
      img.onerror = function () {
        URL.revokeObjectURL(url);
        reject();
      };
      img.src = url;
    });
  }
  function uploadVisitor(file, text) {
    if (liveEnabled === false || liveStatus === "bitti") return;
    whenThread().then(function (id) {
      if (!id || liveStatus === "bitti") return null;
      return shrinkImage(file).then(function (dataUrl) {
        return postLive({ op: "upload", thread: id, image: dataUrl, text: text || "" });
      });
    }).then(function (res) {
      if (!res || !res.thread) return;
      liveThread = res.thread.id;
      if (res.ok) {
        var form = document.querySelector(".clay-live-form");
        if (form && form.metin && text) form.metin.value = "";
      }
      paintVisitor(res.thread);
    }).catch(function () {});
  }

  function paintAutoChips(root) {
    var host = root && root.querySelector(".clay-live-autos");
    if (!host) return;
    if (liveStatus === "bitti") {
      if (host.dataset.sig !== "off") {
        host.dataset.sig = "off";
        host.innerHTML = "";
      }
      return;
    }
    var sig = liveAutos.map(function (row) { return row.id + "\n" + row.q; }).join("|");
    if (host.dataset.sig === sig) return;
    host.dataset.sig = sig;
    host.innerHTML = liveAutos.map(function (row) {
      return '<button type="button" data-act="auto-tap" data-id="' + esc(row.id) + '">' + esc(row.q) + "</button>";
    }).join("");
  }
  function takeDesk(res) {
    if (!res || !res.ok) return;
    liveEnabled = res.enabled !== false;
    if (Array.isArray(res.autos)) liveAutos = res.autos;
    var box = document.querySelector(".clay-desk-live");
    if (box) box.dataset.sig = "";
    paintDesk(res.threads || []);
  }
  function liveTone(status) {
    if (status === "beklemede") return "is-hold";
    if (status === "bitti") return "is-off";
    return "is-on";
  }
  function liveLabel(status) {
    if (status === "beklemede") return "Beklemede";
    if (status === "bitti") return "Sonlandı";
    return "Çevrimiçi";
  }
  function cardMark() {
    return '<span class="clay-live-card" aria-hidden="true"><span class="clay-live-card-chip"></span><span class="clay-live-card-mark">CLAY</span></span>';
  }
  function runThread(mod) {
    if (!deskThread) return;
    postLive({ op: "thread", thread: deskThread, mod: mod }).then(function (res) {
      if (!res || !res.ok) return;
      takeDesk(res);
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
      var bits = (row.messages || []).map(function (item) {
        return String(item.at || "") + (item.from || "") + (item.image || "") + String(item.text || "").length;
      }).join(",");
      return row.id + ":" + (row.username || "") + ":" + (row.status || "acik") + ":" + bits;
    }).join("|") + ">" + deskThread + "#" + liveAutos.map(function (row) { return row.id + row.q + row.a; }).join("~");
    if (box.dataset.sig === sig) return;
    box.dataset.sig = sig;
    var list = threads.map(function (row) {
      var status = row.status || "acik";
      return '<button type="button" class="clay-desk-person' + (row.id === deskThread ? " is-on" : "") + '" data-thread="' + esc(row.id) + '">' + cardMark() + '<span class="clay-desk-person-copy"><span class="clay-desk-person-brand">Clay Virtual Card</span><strong>' + esc(row.username) + '</strong><span class="clay-desk-person-role"><i class="clay-live-dot ' + liveTone(status) + '"></i> Müşteri temsilcisi · ' + esc(liveLabel(status)) + "</span></span></button>";
    }).join("") || '<p class="clay-desk-live-empty">Henüz konuşma yok.</p>';
    var status = active ? (active.status || "acik") : "";
    var log = active ? (active.messages || []).map(function (row) {
      var who = row.from === "auto" ? "Otomasyon" : (row.from === "visitor" ? active.username : "Destek");
      var role = row.from === "auto" ? "<small>Otomatik yanıt</small>" : (row.from === "visitor" ? "<small>Clay Virtual Card müşteri temsilcisi</small>" : "");
      var photo = row.image ? '<img src="/api/clay-live-file.php?id=' + esc(row.image) + '" alt="Fotoğraf">' : "";
      var text = row.text ? '<span class="clay-desk-live-text">' + esc(row.text) + "</span>" : "";
      return '<p class="' + (row.from === "visitor" ? "is-visitor" : (row.from === "auto" ? "is-auto" : "is-admin")) + '"><strong>' + esc(who) + "</strong>" + role + text + photo + "</p>";
    }).join("") || "<p>Henüz mesaj yok.</p>" : "<p>Bir konuşma seç.</p>";
    var tools = active
      ? '<p class="clay-desk-live-meta"><i class="clay-live-dot ' + liveTone(status) + '"></i> Clay Virtual Card müşteri temsilcisi · ' + esc(active.username) + " · " + esc(liveLabel(status)) + '</p><div class="clay-desk-live-tools"><button type="button" class="btn btn-ghost" data-act="live-hold"' + (status === "acik" ? "" : " disabled") + '>Beklemeye al</button><button type="button" class="btn btn-ghost" data-act="live-resume"' + (status === "beklemede" ? "" : " disabled") + '>Beklemeden çıkar</button><button type="button" class="btn btn-ghost" data-act="live-end"' + (status === "bitti" ? " disabled" : "") + '>Görüşmeyi sonlandır</button><button type="button" class="btn btn-ghost" data-act="live-reopen"' + (status === "bitti" ? "" : " disabled") + '>Yeniden aç</button><button type="button" class="btn btn-ghost" data-act="live-delete">Sil</button></div>'
      : "";
    var autos = '<section class="clay-desk-auto"><h3>Otomasyon mesajları</h3><ul>' + (liveAutos.map(function (row) {
      return "<li><p><strong>" + esc(row.q) + "</strong></p><p>" + esc(row.a) + '</p><button type="button" class="btn btn-ghost" data-act="auto-del" data-id="' + esc(row.id) + '">Kaldır</button></li>';
    }).join("") || "<li>Kayıtlı soru yok.</li>") + '</ul><form class="clay-desk-auto-form"><input name="soru" maxlength="400" placeholder="Soru" autocomplete="off"><input name="yanit" maxlength="400" placeholder="Yanıt" autocomplete="off"><button class="btn btn-gold" type="submit">Ekle</button></form></section>';
    var draft = "";
    var soruDraft = "";
    var yanitDraft = "";
    var input = box.querySelector("input[name=metin]");
    var soruInput = box.querySelector("input[name=soru]");
    var yanitInput = box.querySelector("input[name=yanit]");
    if (input && document.activeElement === input) draft = input.value;
    if (soruInput && document.activeElement === soruInput) soruDraft = soruInput.value;
    if (yanitInput && document.activeElement === yanitInput) yanitDraft = yanitInput.value;
    var open = liveEnabled !== false;
    var canReply = !!(active && open && status !== "bitti");
    box.innerHTML = '<div class="clay-desk-live-head"><h2><i class="clay-live-lamp ' + (open ? "is-on" : "is-off") + '"></i>Canlı destek</h2><button type="button" class="btn btn-ghost" data-act="live-switch" data-on="' + (open ? "1" : "0") + '">' + (open ? "Kapat" : "Aç") + "</button></div><p class=\"clay-desk-live-state " + (open ? "is-on" : "is-off") + "\">" + (open ? "Ziyaretçiye açık" : "Ziyaretçiye kapalı") + "</p>" + autos + '<div class="clay-desk-live-list">' + list + "</div>" + tools + '<div class="clay-desk-live-log">' + log + '</div><form class="clay-desk-live-form"><input name="metin" maxlength="400" placeholder="' + (status === "bitti" ? "Görüşme sonlandı" : "Yanıt yaz") + '" autocomplete="off"' + (canReply ? "" : " disabled") + '><button class="btn btn-gold" type="submit"' + (canReply ? "" : " disabled") + ">Gönder</button></form>";
    var next = box.querySelector("input[name=metin]");
    var nextSoru = box.querySelector("input[name=soru]");
    var nextYanit = box.querySelector("input[name=yanit]");
    if (next && draft) next.value = draft;
    if (nextSoru && soruDraft) nextSoru.value = soruDraft;
    if (nextYanit && yanitDraft) nextYanit.value = yanitDraft;
  }
  function refreshDesk() {
    if (!admin()) return;
    postLive({ op: "list" }).then(function (res) {
      if (res && res.ok) {
        takeDesk(res);
        hearDesk(res.threads || []);
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
    if (form.matches("form.clay-desk-auto-form")) {
      event.preventDefault();
      event.stopPropagation();
      var question = String(form.soru.value || "").trim();
      var answer = String(form.yanit.value || "").trim();
      if (!question || !answer) return;
      postLive({ op: "auto-add", q: question, a: answer }).then(function (res) {
        if (res && res.ok) {
          form.soru.value = "";
          form.yanit.value = "";
        }
        takeDesk(res);
      });
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

  document.addEventListener("pointerdown", function () { unlockAudio(); }, true);
  document.addEventListener("click", function (event) {
    var renew = event.target.closest && event.target.closest("[data-act=renew-yes]");
    if (renew) passOnce("kart-uzat");
    var act = event.target.closest && event.target.closest("[data-act]");
    if (act) {
      var name = act.getAttribute("data-act");
      if (name === "auto-tap") {
        event.preventDefault();
        event.stopImmediatePropagation();
        var autoId = act.getAttribute("data-id");
        whenThread().then(function (id) {
          if (!id) return null;
          return postLive({ op: "auto", thread: id, id: autoId });
        }).then(function (res) {
          if (res && Array.isArray(res.autos)) liveAutos = res.autos;
          if (res && res.thread) paintVisitor(res.thread);
          else paintVisitor(null);
        });
        return;
      }
      if (name === "auto-del") {
        event.preventDefault();
        event.stopImmediatePropagation();
        postLive({ op: "auto-del", id: act.getAttribute("data-id") }).then(takeDesk);
        return;
      }
      if (name === "live-switch") {
        event.preventDefault();
        event.stopImmediatePropagation();
        postLive({ op: "switch", acik: act.getAttribute("data-on") === "1" ? "0" : "1" }).then(function () {
          refreshDesk();
        });
        return;
      }
      if (name === "live-hold" || name === "live-resume" || name === "live-reopen") {
        event.preventDefault();
        event.stopImmediatePropagation();
        runThread(name === "live-hold" ? "beklemede" : "acik");
        return;
      }
      if (name === "live-end") {
        event.preventDefault();
        event.stopImmediatePropagation();
        askConfirm("Bu görüşmeyi sonlandırıyorsun. Onaylıyor musun?").then(function (ok) {
          if (ok) runThread("bitti");
        });
        return;
      }
      if (name === "live-delete") {
        event.preventDefault();
        event.stopImmediatePropagation();
        askConfirm("Bu görüşmeyi siliyorsun. Onaylıyor musun?").then(function (ok) {
          if (ok) runThread("sil");
        });
        return;
      }
      if (name === "live-open") {
        event.preventDefault();
        event.stopImmediatePropagation();
        unlockAudio();
        if (liveEnabled === false) return;
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
    if (target.matches && target.matches(".clay-live-photo input")) {
      var file = target.files && target.files[0];
      var form = target.closest("form");
      var text = form && form.metin ? String(form.metin.value || "").trim() : "";
      target.value = "";
      if (file) uploadVisitor(file, text);
      return;
    }
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
    refineMarks();
    girisTrust();
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
      new MutationObserver(function () {
        if (!document.querySelector(".clay-live-btn")) visitorShell();
        schedule();
      }).observe(document.documentElement, { childList: true, subtree: true });
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
