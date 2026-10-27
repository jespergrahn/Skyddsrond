// Skyddsrond – all logik. Se SPEC.md för krav-ID:n (F-xx).

const STORE_KEY = "skyddsrond.v1";
const STATUS = { ok: "OK", brist: "Brist", na: "Ej aktuellt" };
const RISK = ["låg", "medel", "hög"]; // F-07, samma skala som Prevent

const app = document.getElementById("app");
const progressEl = document.getElementById("progress");
const meterEl = document.querySelector("#meter span");

// ---------- Lagring (F-20) ----------

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { ronder: {} }; }
  catch { return { ronder: {} }; }
}

let db = load();

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(db)); }
  catch { /* privat läge eller fullt – appen fungerar ändå under sessionen */ }
}

function touch(rond) {
  rond.uppdaterad = new Date().toISOString();
  save();
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

function newRond() {
  const id = uid();
  db.ronder[id] = {
    id,
    skapad: new Date().toISOString(),
    uppdaterad: new Date().toISOString(),
    status: "pågår",
    info: { arbetsplats: "", plats: "", datum: today(), rondledare: "", skyddsombud: "", deltagare: "" },
    svar: {},
    ejAktuellaOmraden: {},
    egnaRader: [],
    sammanfattning: { kommentar: "", nastaRond: "" },
  };
  save();
  return id;
}

// ---------- Hjälpfunktioner ----------

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function areaRows(rond, area) {
  return area.rader.map((r) => ({ ...r, omradeId: area.id }))
    .concat(rond.egnaRader.filter((r) => r.omradeId === area.id).map((r) => ({ ...r, egen: true })));
}

function allRows(rond) {
  return CHECKLIST.flatMap((a) => areaRows(rond, a).map((r) => ({ ...r, omrade: a })));
}

// F-24: ett område markerat som ej aktuellt gäller före radens eget svar
function areaNA(rond, areaId) {
  return !!rond.ejAktuellaOmraden?.[areaId];
}

function statusOf(rond, row) {
  return areaNA(rond, row.omradeId) ? "na" : rond.svar[row.id]?.status || null;
}

// Ronder från v0.1 har "prioritet" i stället för "risk"
function riskOf(s) {
  return s.risk || s.prioritet || "medel";
}

function counts(rond, rows = allRows(rond)) {
  const c = { ok: 0, brist: 0, na: 0, tom: 0, total: rows.length };
  rows.forEach((r) => { c[statusOf(rond, r) || "tom"]++; });
  c.klara = c.total - c.tom;
  return c;
}

function bristList(rond) {
  return allRows(rond)
    .filter((r) => statusOf(rond, r) === "brist")
    .map((r) => ({ ...r, s: rond.svar[r.id] }))
    .sort((a, b) => RISK.indexOf(riskOf(b.s)) - RISK.indexOf(riskOf(a.s)));
}

function fmtDate(iso) {
  return iso ? new Date(iso).toLocaleDateString("sv-SE") : "";
}

function setProgress(rond) {
  if (!rond) { progressEl.textContent = ""; meterEl.style.width = "0"; return; }
  const c = counts(rond);
  progressEl.textContent = `${c.klara} / ${c.total}`;
  meterEl.style.width = `${(c.klara / c.total) * 100}%`;
}

function foot(html) {
  return `<div class="foot"><div class="foot-inner">${html}</div></div>`;
}

// ---------- Routing ----------
// #/                      start
// #/r/<id>/info           uppgifter om ronden
// #/r/<id>/o/<index>      område
// #/r/<id>/oversikt       översikt
// #/r/<id>/klar           sammanfattning

function go(hash) { location.hash = hash; }

function route() {
  const [, , id, view, idx] = location.hash.split("/");
  const rond = id && db.ronder[id];
  window.scrollTo(0, 0);
  if (!rond) return renderHome();
  setProgress(rond);
  if (view === "info") return renderInfo(rond);
  if (view === "o") return renderArea(rond, Math.max(0, Math.min(CHECKLIST.length - 1, +idx || 0)));
  if (view === "oversikt") return renderOverview(rond);
  if (view === "klar") return renderSummary(rond);
  renderHome();
}

window.addEventListener("hashchange", route);
document.getElementById("home").addEventListener("click", () => go("#/"));

// ---------- Vyer ----------

function renderHome() {
  setProgress(null);
  const ronder = Object.values(db.ronder).sort((a, b) => b.uppdaterad.localeCompare(a.uppdaterad));
  app.innerHTML = `
    <h1>Skyddsrond</h1>
    <p class="lead">Gå runt, bedöm rad för rad och exportera protokollet som PDF.</p>
    <button class="btn primary block" data-act="new">Ny skyddsrond</button>
    ${ronder.length ? `<h2>Tidigare ronder</h2><ul class="list">${ronder.map((r) => {
      const c = counts(r);
      return `<li><button data-open="${r.id}">
        <span>${esc(r.info.arbetsplats || "Namnlös")}<br><span class="meta">${esc(r.info.datum)} · ${r.status === "klar" ? "Klar" : `${c.klara}/${c.total}`}</span></span>
        <span class="meta ${c.brist ? "flag" : ""}">${c.brist} brist${c.brist === 1 ? "" : "er"}</span>
      </button></li>`;
    }).join("")}</ul>` : ""}
    <p class="note">Allt sparas automatiskt i den här webbläsaren. Rensas webbläsardata försvinner ronderna, så exportera PDF när du är klar.</p>`;

  app.querySelector("[data-act=new]").onclick = () => go(`#/r/${newRond()}/info`);
  app.querySelectorAll("[data-open]").forEach((b) => {
    b.onclick = () => {
      const r = db.ronder[b.dataset.open];
      go(r.status === "klar" ? `#/r/${r.id}/klar` : counts(r).klara ? `#/r/${r.id}/oversikt` : `#/r/${r.id}/info`);
    };
  });
}

function renderInfo(rond) {
  const i = rond.info;
  const f = (k, label, type = "text") =>
    `<label class="field"><span>${label}</span><input type="${type}" data-info="${k}" value="${esc(i[k])}"></label>`;
  app.innerHTML = `
    <p class="eyebrow">Uppgifter</p>
    <h1>Om ronden</h1>
    <p class="lead">Arbetsplats och datum krävs.</p>
    ${f("arbetsplats", "Arbetsplats *")}
    <div class="grid2">${f("plats", "Plats / våning")}${f("datum", "Datum *", "date")}</div>
    <div class="grid2">${f("rondledare", "Rondledare")}${f("skyddsombud", "Skyddsombud")}</div>
    <label class="field"><span>Övriga deltagare</span><textarea data-info="deltagare">${esc(i.deltagare)}</textarea></label>
    <button class="link" data-act="del">Ta bort ronden</button>
    ${foot(`<button class="btn primary" data-act="start">${counts(rond).klara ? "Fortsätt" : "Starta rond"}</button>`)}`;

  const startBtn = app.querySelector("[data-act=start]");
  const valid = () => { startBtn.disabled = !(i.arbetsplats.trim() && i.datum); };
  valid();
  app.querySelectorAll("[data-info]").forEach((el) => {
    el.oninput = () => { i[el.dataset.info] = el.value; touch(rond); valid(); };
  });
  startBtn.onclick = () => go(`#/r/${rond.id}/${counts(rond).klara ? "oversikt" : "o/0"}`);
  app.querySelector("[data-act=del]").onclick = () => {
    if (confirm("Ta bort ronden? Det går inte att ångra.")) { delete db.ronder[rond.id]; save(); go("#/"); }
  };
}

function rowHtml(rond, r) {
  const s = rond.svar[r.id] || {};
  const seg = Object.entries(STATUS).map(([v, label]) =>
    `<button type="button" data-v="${v}" aria-pressed="${s.status === v}">${label}</button>`).join("");
  const field = (k, label, type = "text") =>
    `<label class="field"><span>${label}</span><input type="${type}" data-k="${k}" value="${esc(s[k])}"></label>`;

  let more = "";
  if (s.status === "brist") {
    more = `<div class="row-more brist">
      <label class="field"><span>Beskriv bristen</span><textarea data-k="kommentar">${esc(s.kommentar)}</textarea></label>
      <label class="field"><span>Risk</span><select data-k="risk">
        ${RISK.map((p) => `<option ${riskOf(s) === p ? "selected" : ""}>${p}</option>`).join("")}
      </select></label>
      <label class="field"><span>Åtgärd</span><textarea data-k="atgard">${esc(s.atgard)}</textarea></label>
      <div class="grid2">${field("ansvarig", "Ansvarig")}${field("klartSenast", "Klart senast", "date")}</div>
    </div>`;
  } else if (s.kommentar || s.visaKommentar) {
    more = `<div class="row-more"><label class="field"><span>Kommentar</span><textarea data-k="kommentar">${esc(s.kommentar)}</textarea></label></div>`;
  }

  const links = [];
  if (s.status !== "brist" && !s.kommentar && !s.visaKommentar) links.push(`<button class="link" data-act="comment">Lägg till kommentar</button>`);
  if (r.egen) links.push(`<button class="link" data-act="remove">Ta bort rad</button>`);

  return `<div class="row" data-row="${r.id}">
    <p class="row-text">${esc(r.text)}</p>
    <div class="seg" role="group" aria-label="Bedömning">${seg}</div>
    ${more}
    ${links.join(" &nbsp; ")}
  </div>`;
}

function renderArea(rond, idx) {
  const area = CHECKLIST[idx];
  const last = idx === CHECKLIST.length - 1;
  const na = areaNA(rond, area.id);
  app.innerHTML = `
    <p class="eyebrow">Område ${idx + 1} av ${CHECKLIST.length}</p>
    <h1>${esc(area.titel)}</h1>
    ${na ? `
      <p class="lead">Ej aktuellt för arbetsplatsen. Alla punkter räknas som ej aktuella.</p>
      <button class="btn" data-act="area-na">Ångra och bedöm området</button>` : `
      <p class="lead"><span id="area-count"></span><br><button class="link" data-act="area-na">Hela området är ej aktuellt</button></p>
      <div id="rows">${areaRows(rond, area).map((r) => rowHtml(rond, r)).join("")}</div>
      <form class="add" id="add"><input placeholder="Lägg till egen punkt" aria-label="Lägg till egen punkt"><button class="btn">Lägg till</button></form>`}
    ${foot(`
      <button class="btn" data-act="prev" ${idx === 0 ? "disabled" : ""}>Föregående</button>
      <button class="btn" data-act="overview">Översikt</button>
      <button class="btn primary" data-act="next">${last ? "Sammanfatta" : "Nästa"}</button>`)}`;

  app.querySelector("[data-act=prev]").onclick = () => go(`#/r/${rond.id}/o/${idx - 1}`);
  app.querySelector("[data-act=overview]").onclick = () => go(`#/r/${rond.id}/oversikt`);
  app.querySelector("[data-act=next]").onclick = () => go(last ? `#/r/${rond.id}/klar` : `#/r/${rond.id}/o/${idx + 1}`);
  // F-24: radernas svar ligger kvar, så det går att ångra
  app.querySelector("[data-act=area-na]").onclick = () => {
    rond.ejAktuellaOmraden ||= {};
    if (na) delete rond.ejAktuellaOmraden[area.id];
    else rond.ejAktuellaOmraden[area.id] = true;
    touch(rond);
    route();
  };
  if (na) return;

  const updateCount = () => {
    const c = counts(rond, areaRows(rond, area));
    app.querySelector("#area-count").textContent = `${c.klara} av ${c.total} bedömda${c.brist ? ` · ${c.brist} brist${c.brist === 1 ? "" : "er"}` : ""}`;
    setProgress(rond);
  };
  updateCount();

  const rowsEl = app.querySelector("#rows");
  const rerenderRow = (rowEl, r) => { rowEl.outerHTML = rowHtml(rond, r); };
  const findRow = (id) => areaRows(rond, area).find((r) => r.id === id);

  rowsEl.addEventListener("click", (e) => {
    const rowEl = e.target.closest("[data-row]");
    if (!rowEl) return;
    const id = rowEl.dataset.row;
    const s = (rond.svar[id] ||= {});
    const btn = e.target.closest("button");
    if (!btn) return;

    if (btn.dataset.v) {
      s.status = s.status === btn.dataset.v ? null : btn.dataset.v; // F-06
      if (s.status === "brist" && !s.risk) s.risk = riskOf(s);
    } else if (btn.dataset.act === "comment") {
      s.visaKommentar = true;
    } else if (btn.dataset.act === "remove") {
      if (!confirm("Ta bort punkten?")) return;
      rond.egnaRader = rond.egnaRader.filter((r) => r.id !== id);
      delete rond.svar[id];
      touch(rond);
      rowEl.remove();
      return updateCount();
    } else return;

    touch(rond);
    rerenderRow(rowEl, findRow(id));
    if (btn.dataset.act === "comment") rowsEl.querySelector(`[data-row="${id}"] textarea`)?.focus();
    updateCount();
  });

  rowsEl.addEventListener("input", (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    const id = e.target.closest("[data-row]").dataset.row;
    (rond.svar[id] ||= {})[k] = e.target.value;
    touch(rond);
  });

  app.querySelector("#add").onsubmit = (e) => {
    e.preventDefault();
    const input = e.target.querySelector("input");
    const text = input.value.trim();
    if (!text) return;
    const r = { id: "egen-" + uid(), omradeId: area.id, text };
    rond.egnaRader.push(r);
    touch(rond);
    rowsEl.insertAdjacentHTML("beforeend", rowHtml(rond, { ...r, egen: true }));
    input.value = "";
    updateCount();
  };
}

function renderOverview(rond) {
  const c = counts(rond);
  app.innerHTML = `
    <p class="eyebrow">${esc(rond.info.arbetsplats)} · ${esc(rond.info.datum)}</p>
    <h1>Översikt</h1>
    <p class="lead">${c.klara} av ${c.total} punkter bedömda.</p>
    <ul class="list">${CHECKLIST.map((a, i) => {
      const ac = counts(rond, areaRows(rond, a));
      return `<li><button data-i="${i}">
        <span>${esc(a.titel)}</span>
        <span class="meta">${areaNA(rond, a.id) ? "Ej aktuellt" : `${ac.brist ? `<span class="flag">${ac.brist} !</span> · ` : ""}${ac.klara}/${ac.total}`}</span>
      </button></li>`;
    }).join("")}</ul>
    <p><button class="link" data-act="info">Ändra uppgifter om ronden</button></p>
    ${foot(`<button class="btn primary" data-act="sum">Sammanfatta</button>`)}`;

  app.querySelectorAll("[data-i]").forEach((b) => { b.onclick = () => go(`#/r/${rond.id}/o/${b.dataset.i}`); });
  app.querySelector("[data-act=info]").onclick = () => go(`#/r/${rond.id}/info`);
  app.querySelector("[data-act=sum]").onclick = () => go(`#/r/${rond.id}/klar`);
}

function renderSummary(rond) {
  const c = counts(rond);
  const brister = bristList(rond);
  const sum = rond.sammanfattning;
  app.innerHTML = `
    <p class="eyebrow">${esc(rond.info.arbetsplats)} · ${esc(rond.info.datum)}</p>
    <h1>Sammanfattning</h1>
    <p class="lead">${c.tom ? `${c.tom} punkter är inte bedömda. Du kan exportera ändå.` : "Alla punkter är bedömda."}</p>

    <div class="stats">
      <div><b>${c.ok}</b><span>OK</span></div>
      <div class="${c.brist ? "hit" : ""}"><b>${c.brist}</b><span>Brister</span></div>
      <div><b>${c.na}</b><span>Ej aktuellt</span></div>
      <div><b>${c.tom}</b><span>Ej bedömda</span></div>
    </div>

    <h2>Handlingsplan</h2>
    ${brister.length ? `<ul class="plan">${brister.map((b) => `<li>
      <span class="prio">Risk ${esc(riskOf(b.s))}</span> <span class="sub">· ${esc(b.omrade.titel)}</span>
      <p><b>${esc(b.text)}</b></p>
      ${b.s.kommentar ? `<p>${esc(b.s.kommentar)}</p>` : ""}
      ${b.s.atgard ? `<p>Åtgärd: ${esc(b.s.atgard)}</p>` : ""}
      <p class="sub">${esc(b.s.ansvarig || "Ingen ansvarig")} · ${esc(b.s.klartSenast || "Inget datum")}</p>
    </li>`).join("")}</ul>` : `<p class="empty">Inga brister noterade.</p>`}

    <h2>Avslutning</h2>
    <label class="field"><span>Övergripande kommentar</span><textarea data-sum="kommentar">${esc(sum.kommentar)}</textarea></label>
    <label class="field"><span>Nästa skyddsrond</span><input type="date" data-sum="nastaRond" value="${esc(sum.nastaRond)}"></label>

    <div class="actions">
      <button class="btn primary block" data-act="pdf">Exportera PDF</button>
      <button class="btn block" data-act="back">Tillbaka till ronden</button>
    </div>`;

  app.querySelectorAll("[data-sum]").forEach((el) => {
    el.oninput = () => { sum[el.dataset.sum] = el.value; touch(rond); };
  });
  app.querySelector("[data-act=back]").onclick = () => go(`#/r/${rond.id}/oversikt`);
  app.querySelector("[data-act=pdf]").onclick = () => {
    rond.status = "klar";
    touch(rond);
    exportPdf(rond);
  };
}

// ---------- PDF (F-16 – F-19) ----------

function fileName(rond) {
  const plats = (rond.info.arbetsplats || "kontor").trim().replace(/[^\wåäöÅÄÖ-]+/g, "_");
  return `Skyddsrond_${plats}_${rond.info.datum || today()}.pdf`;
}

function exportPdf(rond) {
  if (!window.jspdf) return printFallback(rond);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, H = 297, M = 18, CW = W - M * 2;
  // Tres palett, se SPEC.md §7
  const BRAND = [255, 92, 0], ACCENT = [250, 32, 143], MUTED = [110, 110, 110], LINE = [239, 239, 239];
  let y = M;

  const ensure = (h) => { if (y + h > H - M - 8) { doc.addPage(); y = M; } };
  const text = (str, { size = 10, bold = false, color = [0, 0, 0], x = M, w = CW, gap = 1.5 } = {}) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(str), w);
    const lh = size * 0.42;
    lines.forEach((ln) => { ensure(lh); doc.text(ln, x, y + lh * 0.8); y += lh; });
    y += gap;
  };
  const rule = (color = LINE) => { doc.setDrawColor(...color); doc.setLineWidth(0.2); doc.line(M, y, W - M, y); y += 3; };
  const heading = (str) => { y += 4; ensure(14); text(str.toUpperCase(), { size: 8, bold: true, color: MUTED, gap: 1 }); rule([0, 0, 0]); };

  const i = rond.info;
  const c = counts(rond);

  // Rubrik med logotyp uppe till höger (F-23)
  if (typeof LOGO_PNG !== "undefined") {
    const lh = 14;
    doc.addImage(LOGO_PNG, "PNG", W - M - lh * LOGO_RATIO, M, lh * LOGO_RATIO, lh);
  }
  doc.setFillColor(...BRAND);
  doc.rect(M, y, 14, 1.6, "F");
  y += 5;
  text("Skyddsrond", { size: 26, bold: true, gap: 1 });
  text([i.arbetsplats, i.plats].filter(Boolean).join(", ") + "  ·  " + i.datum, { size: 11, color: MUTED, gap: 6 });

  // Uppgifter
  heading("Uppgifter");
  [["Arbetsplats", i.arbetsplats], ["Plats / våning", i.plats], ["Datum", i.datum],
   ["Rondledare", i.rondledare], ["Skyddsombud", i.skyddsombud], ["Övriga deltagare", i.deltagare]]
    .forEach(([k, v]) => {
      const startY = y;
      text(k, { size: 9, color: MUTED, w: 45, gap: 0 });
      const afterLabel = y;
      y = startY;
      text(v || "-", { size: 10, x: M + 48, w: CW - 48, gap: 0 });
      y = Math.max(y, afterLabel) + 1.5;
    });

  // Sammanfattning
  heading("Sammanfattning");
  ensure(16);
  const cols = [["OK", c.ok], ["Brister", c.brist], ["Ej aktuellt", c.na], ["Ej bedömda", c.tom]];
  cols.forEach(([label, n], k) => {
    const x = M + k * (CW / 4);
    doc.setFont("helvetica", "bold"); doc.setFontSize(20);
    doc.setTextColor(...(label === "Brister" && n ? ACCENT : [0, 0, 0]));
    doc.text(String(n), x, y + 7);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text(label, x, y + 12);
  });
  y += 17;
  if (rond.sammanfattning.kommentar) text(rond.sammanfattning.kommentar, { size: 10 });
  if (rond.sammanfattning.nastaRond) text("Nästa skyddsrond: " + rond.sammanfattning.nastaRond, { size: 10 });

  // Handlingsplan
  heading("Handlingsplan");
  const brister = bristList(rond);
  if (!brister.length) text("Inga brister noterade.", { color: MUTED });
  brister.forEach((b, n) => {
    ensure(22);
    text(`${n + 1}. ${b.text}`, { size: 10, bold: true, gap: 0.5 });
    text(`Risk: ${riskOf(b.s)}   ·   ${b.omrade.titel}`, { size: 8, color: ACCENT, gap: 1 });
    if (b.s.kommentar) text("Brist: " + b.s.kommentar, { size: 9, gap: 0.5 });
    if (b.s.atgard) text("Åtgärd: " + b.s.atgard, { size: 9, gap: 0.5 });
    text(`Ansvarig: ${b.s.ansvarig || "-"}   ·   Klart senast: ${b.s.klartSenast || "-"}`, { size: 9, color: MUTED, gap: 2 });
    rule();
  });

  // Alla punkter
  CHECKLIST.forEach((a) => {
    heading(a.titel);
    if (areaNA(rond, a.id)) return text("Ej aktuellt för arbetsplatsen", { size: 9, color: MUTED });
    areaRows(rond, a).forEach((r) => {
      const s = rond.svar[r.id] || {};
      const label = STATUS[s.status] || "Ej bedömd";
      ensure(8);
      const startY = y;
      doc.setFont("helvetica", s.status === "brist" ? "bold" : "normal");
      doc.setFontSize(9);
      doc.setTextColor(...(s.status === "brist" ? ACCENT : s.status === "ok" ? [0, 0, 0] : MUTED));
      doc.text(label, W - M, startY + 3, { align: "right" });
      text(r.text, { size: 9, w: CW - 30, gap: 0 });
      if (s.kommentar && s.status !== "brist") text(s.kommentar, { size: 8, color: MUTED, x: M + 4, w: CW - 34, gap: 0 });
      y += 1.5;
    });
  });

  // Underskrifter
  y += 10; ensure(30);
  text("Underskrifter", { size: 8, bold: true, color: MUTED, gap: 14 });
  const half = (CW - 10) / 2;
  [[i.rondledare, "Rondledare"], [i.skyddsombud, "Skyddsombud"]].forEach(([name, role], k) => {
    const x = M + k * (half + 10);
    doc.setDrawColor(0); doc.setLineWidth(0.3); doc.line(x, y, x + half, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...MUTED);
    doc.text(`${role}${name ? ": " + name : ""}`, x, y + 4);
  });

  // Sidfot
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...MUTED);
    doc.text(`Skyddsrond · ${i.arbetsplats} · ${i.datum}`, M, H - 10);
    doc.text(`Sida ${p} av ${pages}`, W - M, H - 10, { align: "right" });
  }

  doc.save(fileName(rond));
}

// Reserv: webbläsarens utskrift → Spara som PDF (F-19)
function printFallback(rond) {
  const i = rond.info;
  const c = counts(rond);
  const brister = bristList(rond);
  document.getElementById("print").innerHTML = `
    <img src="assets/logo-svart.png" alt="Tre" style="float:right;height:48px">
    <h1>Skyddsrond</h1>
    <p>${esc(i.arbetsplats)} ${i.plats ? "· " + esc(i.plats) : ""} · ${esc(i.datum)}</p>
    <p>Rondledare: ${esc(i.rondledare || "-")} · Skyddsombud: ${esc(i.skyddsombud || "-")}<br>Övriga: ${esc(i.deltagare || "-")}</p>
    <p><b>OK ${c.ok} · Brister ${c.brist} · Ej aktuellt ${c.na} · Ej bedömda ${c.tom}</b></p>
    ${rond.sammanfattning.kommentar ? `<p>${esc(rond.sammanfattning.kommentar)}</p>` : ""}
    <h2>Handlingsplan</h2>
    ${brister.length ? `<table><tr><th>Punkt</th><th>Risk</th><th>Åtgärd</th><th>Ansvarig</th><th>Klart</th></tr>
      ${brister.map((b) => `<tr><td>${esc(b.text)}<br><small>${esc(b.s.kommentar)}</small></td><td>${esc(riskOf(b.s))}</td><td>${esc(b.s.atgard)}</td><td>${esc(b.s.ansvarig)}</td><td>${esc(b.s.klartSenast)}</td></tr>`).join("")}
    </table>` : "<p>Inga brister noterade.</p>"}
    ${CHECKLIST.map((a) => `<h2>${esc(a.titel)}</h2>${areaNA(rond, a.id) ? "<p>Ej aktuellt för arbetsplatsen</p>" : `<table>${areaRows(rond, a).map((r) => {
      const s = rond.svar[r.id] || {};
      return `<tr><td>${esc(r.text)}${s.kommentar ? `<br><small>${esc(s.kommentar)}</small>` : ""}</td><td>${STATUS[s.status] || "Ej bedömd"}</td></tr>`;
    }).join("")}</table>`}`).join("")}
    <p style="margin-top:40px">______________________ &nbsp;&nbsp; ______________________<br>Rondledare &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Skyddsombud</p>`;
  const prevTitle = document.title;
  document.title = fileName(rond).replace(/\.pdf$/, "");
  window.print();
  document.title = prevTitle;
}

route();
