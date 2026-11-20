/* Demo playback: every story, email, ticket and reply below comes from data.js,
   which holds real output saved from MindSprout and Home Help Desk runs. */
(() => {
  const D = window.DEMO;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  const $ = (s, root = document) => root.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* Start a demo the first time its section scrolls into view. */
  function onFirstView(el, fn) {
    if (!("IntersectionObserver" in window)) return fn();
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { io.disconnect(); fn(); }
    }, { threshold: 0.3 });
    io.observe(el);
  }

  /* ==================== 1. MINDSPROUT ==================== */
  const CRITERIA = [
    ["concept_fidelity", "Teaches the lesson"],
    ["age_appropriateness", "Right for the age"],
    ["story_quality", "A good story"],
    ["show_dont_lecture", "Shows, doesn't lecture"],
    ["coherence", "Makes sense"],
    ["emotional_safety", "Emotionally safe"],
  ];
  const stories = D.mindsprout.stories;
  let msRun = 0, page = 0, autoTimer = null, current = null;

  const lessonList = $("#lessonList");
  stories.forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "lesson"; b.type = "button"; b.setAttribute("aria-pressed", "false");
    b.innerHTML = `<span class="age">Age ${s.age}</span><span>${esc(s.label)}</span>`;
    b.addEventListener("click", () => showStory(i));
    lessonList.appendChild(b);
  });

  async function showStory(i) {
    const run = ++msRun;
    stopAuto();
    current = stories[i];
    [...lessonList.children].forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    $("#lessonFull").innerHTML = `What the parent typed: <q>${esc(current.lesson)}</q>`;
    $("#bookNav").innerHTML = "";
    $("#judge").innerHTML = "";

    const steps = [
      current.guide ? `Found a parenting guide: <b>${esc(current.guide)}</b>` : "No matching guide, so none used",
      "Writing 6 pages with Claude",
      "Checking structure and quality",
    ];
    $("#book").innerHTML = `<ol class="pipeline">${steps.map((t) => `<li>${t}</li>`).join("")}</ol>`;
    const items = [...$("#book").querySelectorAll("li")];
    for (let k = 0; k < items.length; k++) {
      items[k].className = "active";
      await sleep(k === 1 ? 1100 : 650);
      if (run !== msRun) return;
      items[k].className = "done";
    }
    await sleep(250);
    if (run !== msRun) return;
    page = 0;
    renderPage();
    renderJudge();
    startAuto();
  }

  function pageCount() { return current.pages.length + 2; } // cover + pages + lesson

  function renderPage() {
    const book = $("#book"), total = pageCount();
    if (page === 0) {
      book.innerHTML = `<div class="cover"><small>A MindSprout story · age ${current.age}</small><h3>${esc(current.title)}</h3><p>${current.pages.length} pages</p></div>`;
    } else if (page <= current.pages.length) {
      book.innerHTML = `<p class="page">${esc(current.pages[page - 1])}</p><span class="page-no">Page ${page} of ${current.pages.length}</span>`;
    } else {
      book.innerHTML = `<p class="moral"><small>The lesson</small>${esc(current.core_lesson)}</p>`;
    }
    const dots = Array.from({ length: total }, (_, k) => `<i class="${k === page ? "on" : ""}"></i>`).join("");
    $("#bookNav").innerHTML = `<button type="button" id="prevPage" ${page === 0 ? "disabled" : ""}>← Back</button><span class="dots" aria-hidden="true">${dots}</span><button type="button" id="nextPage" ${page === total - 1 ? "disabled" : ""}>Next →</button>`;
    $("#prevPage").onclick = () => { stopAuto(); page = Math.max(0, page - 1); renderPage(); };
    $("#nextPage").onclick = () => { stopAuto(); page = Math.min(total - 1, page + 1); renderPage(); };
  }

  function startAuto() {
    if (reduce) return;
    autoTimer = setInterval(() => {
      if (page >= pageCount() - 1) return stopAuto();
      page += 1; renderPage();
    }, 4200);
  }
  function stopAuto() { clearInterval(autoTimer); autoTimer = null; }
  $("#book").addEventListener("mouseenter", stopAuto);

  function renderJudge() {
    const total = CRITERIA.reduce((n, [k]) => n + current.scores[k], 0);
    $("#judge").innerHTML = `
      <div class="judge-head"><b>How the AI judge scored it: ${total} / 30</b><span class="pass">PASS</span></div>
      ${CRITERIA.map(([k, label]) => `<div class="crit"><span>${label}</span><span class="meter"><i data-w="${current.scores[k] * 20}%"></i></span><b>${current.scores[k]}</b></div>`).join("")}
      <p class="judge-note">Graded by a second Claude model (Opus 5) acting as judge. To pass, a story needs 4+ on lesson, age and sense, 3+ on story and showing, and 5 on safety.</p>`;
    requestAnimationFrame(() => requestAnimationFrame(() =>
      $("#judge").querySelectorAll(".meter i").forEach((m) => (m.style.width = m.dataset.w))));
  }

  /* ==================== 2. TESTING ==================== */
  const tricks = D.mindsprout.tricks;
  const trickList = $("#trickList");
  tricks.forEach((t, i) => {
    const b = document.createElement("button");
    b.className = "trick"; b.type = "button"; b.setAttribute("aria-pressed", "false");
    b.innerHTML = `<span class="age">Age ${t.age}</span><span>${esc(t.label)}</span>`;
    b.addEventListener("click", () => showTrick(i));
    trickList.appendChild(b);
  });

  let trickRun = 0;
  async function showTrick(i) {
    const run = ++trickRun, t = tricks[i], card = $("#trickCard");
    [...trickList.children].forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    card.innerHTML = `<div class="typed"><span class="tag">The parent typed · age ${t.age}</span><p>${esc(t.input)}</p></div>`;
    await sleep(500); if (run !== trickRun) return;
    card.insertAdjacentHTML("beforeend", `<div class="arrow" aria-hidden="true">↓</div><div class="response"><span class="tag">MindSprout wrote instead</span><h4>${esc(t.title)}</h4>${t.pages.map((p) => `<p>${esc(p)}</p>`).join("")}<p>…</p></div>`);
    await sleep(700); if (run !== trickRun) return;
    card.insertAdjacentHTML("beforeend", `<div class="verdict"><span class="tag">Safety judge: PASS</span><p>${esc(t.verdict)}</p></div>`);
  }

  /* ==================== 3. MORNING DIGEST ==================== */
  const dg = D.digest;
  const BUCKET = {
    needs_you_today: ["today", "Needs you"],
    can_wait: ["wait", "Can wait"],
    noise: ["noise", "Noise"],
  };
  const mailList = $("#mailList");
  function renderInbox() {
    mailList.innerHTML = dg.emails.map((e) => `
      <li class="mail" data-id="${e.id}"><span class="dot"></span>
        <span><span class="who">${esc(e.from)}</span><span class="subj">${esc(e.subject)}</span></span>
        <span class="pill"></span></li>`).join("");
    $("#digestCard").innerHTML = `<p class="placeholder">Press "Run this morning's digest". The sorted summary appears here.</p>`;
    $("#sortStatus").textContent = "";
  }
  renderInbox();

  let digestRun = 0;
  async function runDigest() {
    const run = ++digestRun, btn = $("#runDigest");
    btn.disabled = true;
    renderInbox();
    $("#sortStatus").textContent = "Claude is sorting the inbox…";
    for (const e of dg.emails) {
      const li = mailList.querySelector(`[data-id="${e.id}"]`), pill = li.querySelector(".pill");
      const [cls, label] = e.suspicious ? ["scam", "Scam?"] : BUCKET[e.bucket];
      pill.className = `pill ${cls}`; pill.textContent = label;
      li.classList.add("sorted");
      if (e.bucket === "noise" && !e.suspicious) li.classList.add("noise");
      await sleep(140); if (run !== digestRun) return;
    }
    $("#sortStatus").textContent = `Sorted ${dg.emails.length} emails · ${dg.cost.replace("This run: ", "")}`;
    await buildDigest(run);
    btn.disabled = false; btn.textContent = "↻ Run it again";
  }
  $("#runDigest").addEventListener("click", runDigest);

  async function buildDigest(run) {
    const card = $("#digestCard"), add = (html) => card.insertAdjacentHTML("beforeend", html);
    const today = dg.emails.filter((e) => e.bucket === "needs_you_today" && !e.suspicious);
    const scams = dg.emails.filter((e) => e.suspicious);
    const count = (b) => dg.emails.filter((e) => e.bucket === b && !e.suspicious).length;
    card.innerHTML = "";
    add(`<div class="dg-block"><h3>Good morning, ${today.length} things need you today</h3><ul>${today.map((e) =>
      `<li>${esc(e.summary)}${e.due ? `<span class="due">due ${esc(e.due)}</span>` : ""}</li>`).join("")}</ul></div>`);
    await sleep(600); if (run !== digestRun) return;
    if (scams.length) {
      add(`<div class="dg-block"><div class="scam-box"><b>Looks like a scam. Don't click anything.</b>${scams.map((e) => `${esc(e.subject)} (from ${esc(e.address)})`).join("<br>")}</div></div>`);
      await sleep(600); if (run !== digestRun) return;
    }
    add(`<div class="dg-block"><h4>Still waiting on</h4>${dg.waiting.map((w, i) =>
      `<div class="waiting"><b>${esc(w.waiting_on)}</b> · ${w.days} days · ${esc(w.subject)}<p class="draft" id="draft${i}"></p></div>`).join("")}</div>`);
    for (let i = 0; i < dg.waiting.length; i++) {
      await typeInto($(`#draft${i}`), "Drafted follow-up: " + dg.waiting[i].draft, run, () => digestRun);
      if (run !== digestRun) return;
    }
    add(`<div class="dg-block"><h4>Can wait: ${count("can_wait")} · Noise: ${count("noise")}</h4></div>`);
    await sleep(400); if (run !== digestRun) return;
    const total = dg.noise.reduce((n, row) => n + row.count, 0);
    add(`<div class="dg-block"><h4>Noise report</h4>${dg.noise.map((n, i) =>
      `<div class="noise-row" id="nr${i}"><span class="count" id="nc${i}">0</span><span class="nr-text">emails from <b>${esc(n.sender)}</b> this month. You opened ${n.opened === 0 ? "none" : n.opened}.</span><button type="button" class="unsub" data-i="${i}">Unsubscribe</button></div>`).join("")}
      <p class="unsub-total" id="unsubTotal">Unsubscribe from all ${dg.noise.length} and you'd get <b>${total} fewer emails a month</b>.</p>
      <p class="unsub-note">Try a button. In the real digest, each one opens that sender's own unsubscribe page (from the email's unsubscribe header). Nothing is unsubscribed automatically.</p></div>`);
    saved = 0;
    await Promise.all(dg.noise.map((n, i) => countUp($(`#nc${i}`), n.count)));
  }

  /* Unsubscribe buttons: show what acting on the noise report saves. */
  let saved = 0;
  $("#digestCard").addEventListener("click", (event) => {
    const btn = event.target.closest(".unsub");
    if (!btn || btn.disabled) return;
    const i = Number(btn.dataset.i), row = dg.noise[i];
    $(`#nr${i}`).classList.add("done");
    btn.textContent = "Unsubscribed ✓";
    btn.disabled = true;
    saved += row.count;
    const total = dg.noise.reduce((n, r) => n + r.count, 0);
    $("#unsubTotal").innerHTML = saved === total
      ? `Done: <b>${total} fewer emails a month</b>.`
      : `So far: <b>${saved} fewer emails a month</b> (${total} if you unsubscribe from all ${dg.noise.length}).`;
  });

  async function typeInto(el, text, run, live) {
    if (reduce) { el.textContent = text; return; }
    for (let k = 1; k <= text.length; k += 3) {
      el.textContent = text.slice(0, k);
      await new Promise((r) => setTimeout(r, 12));
      if (run !== live()) return;
    }
    el.textContent = text;
  }

  async function countUp(el, to) {
    if (reduce) { el.textContent = to; return; }
    for (let k = 0; k <= 20; k++) { el.textContent = Math.round((to * k) / 20); await new Promise((r) => setTimeout(r, 35)); }
  }

  /* ==================== 4. FAMILY HELP DESK ==================== */
  const hd = D.helpdesk;
  const CATEGORY = {
    wifi_internet: "Wi-Fi and internet", phone_or_tablet: "Phone or tablet", apps_and_accounts: "Apps and accounts",
    scam_or_suspicious: "Scam or suspicious", payments_and_banking: "Payments and banking",
    tv_and_streaming: "TV and streaming", other: "Other",
  };
  const SHORT = ["Router light is red", "Electricity cut-off SMS", "WhatsApp storage full", "Bank caller wants the OTP", "Storage full again", "Video call on the TV"];
  const msgList = $("#msgList");
  hd.tickets.forEach((t, i) => {
    const b = document.createElement("button");
    b.className = "msg"; b.type = "button"; b.setAttribute("aria-pressed", "false");
    b.innerHTML = `<span class="who">${esc(t.person)}</span><span class="what">${esc(SHORT[i] || t.summary)}</span>`;
    b.addEventListener("click", () => showTicket(i));
    msgList.appendChild(b);
  });
  $("#tickets").innerHTML = hd.tickets.map((t, i) => `
    <li class="ticket" id="tk${i}"><span class="urg ${t.urgency}">${t.urgency}</span>
      <span>${esc(t.summary)}<span class="cat">${esc(t.person)} · ${CATEGORY[t.category]}${t.scam_risk === "likely_scam" ? " · likely scam" : ""}</span></span></li>`).join("");
  if (hd.patterns.repeats.length) $("#repeats").textContent = "Keeps coming back: " + hd.patterns.repeats.join("; ");

  let hdRun = 0;
  async function showTicket(i) {
    const run = ++hdRun, t = hd.tickets[i], chat = $("#chat");
    [...msgList.children].forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
    hd.tickets.forEach((_, j) => $(`#tk${j}`).classList.toggle("current", i === j));
    $("#chatName").textContent = t.person;
    $("#chatAvatar").textContent = t.person[0];
    chat.innerHTML = `<div class="bubble in">${esc(t.request)}<time>7:42 PM</time></div>`;
    await sleep(700); if (run !== hdRun) return;
    const scam = t.scam_risk === "likely_scam";
    chat.insertAdjacentHTML("beforeend", `<div class="sys">New ticket: <b>${CATEGORY[t.category]}</b> · ${t.urgency}${scam ? " · <b style=\"color:var(--red)\">likely scam</b>" : ""}</div>`);
    await sleep(700); if (run !== hdRun) return;
    chat.insertAdjacentHTML("beforeend", `<div class="typing">typing…</div>`);
    chat.scrollTop = chat.scrollHeight;
    await sleep(800); if (run !== hdRun) return;
    chat.querySelector(".typing").remove();
    const parts = t.reply.split("\n\n");
    const hasWarning = t.scam_risk !== "no_signs" && parts.length > 1;
    const bubble = document.createElement("div");
    bubble.className = "bubble out";
    chat.appendChild(bubble);
    const warnEl = hasWarning ? document.createElement("span") : null;
    if (warnEl) { warnEl.className = "warn"; bubble.appendChild(warnEl); }
    const body = document.createElement("span");
    bubble.appendChild(body);
    if (warnEl) await typeChat(warnEl, parts[0], run, chat);
    await typeChat(body, hasWarning ? parts.slice(1).join("\n\n") : t.reply, run, chat);
    if (run !== hdRun) return;
    bubble.insertAdjacentHTML("beforeend", "<time>7:43 PM ✓✓</time>");
    chat.scrollTop = chat.scrollHeight;
  }

  async function typeChat(el, text, run, chat) {
    if (reduce) { el.textContent = text; return; }
    for (let k = 1; k <= text.length; k += 4) {
      el.textContent = text.slice(0, k);
      chat.scrollTop = chat.scrollHeight;
      await new Promise((r) => setTimeout(r, 10));
      if (run !== hdRun) return;
    }
    el.textContent = text;
  }

  /* ==================== autoplay on first view ==================== */
  onFirstView($("#mindsprout"), () => showStory(1));
  onFirstView($("#testing"), () => { showTrick(0); $("#passChart").classList.add("shown"); });
  onFirstView($("#digest"), runDigest);
  onFirstView($("#helpdesk"), () => showTicket(3));
})();
