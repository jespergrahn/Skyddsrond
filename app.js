// Skyddsrond – all logik. Se SPEC.md för krav-ID:n (F-xx).

const STORE_KEY = "skyddsrond.v1";
const BUILDING_KEY = "skyddsrond.byggnad"; // F-27
const STATUS = { ok: "OK", brist: "Brist", na: "Ej aktuellt" };
const RISK = ["låg", "medel", "hög"]; // F-07, samma skala som Prevent
const KONTOR = "kontor";
const PLATSER = CHECKLIST.filter((a) => a.slag === "plats");

const app = document.getElementById("app");
const progressEl = document.getElementById("progress");
const meterEl = document.querySelector("#meter span");
const openAreas = new Set(); // utfällda områden, "<enhet>/<omradeId>"

// ---------- Lagring (F-20) ----------

function readJson(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* privat läge eller fullt – appen fungerar ändå under sessionen */ }
}

let db = readJson(STORE_KEY, { ronder: {} });
Object.values(db.ronder).forEach(migrate);

function save() { writeJson(STORE_KEY, db); }

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

function defaultBuilding() {
  return { vaningar: [{ id: uid(), namn: "Kontoret" }], platser: {} };
}

function newRond() {
  const id = uid();
  db.ronder[id] = {
    id,
    version: 2,
    skapad: new Date().toISOString(),
    uppdaterad: new Date().toISOString(),
    status: "pågår",
    info: { arbetsplats: "", datum: today(), rondledare: "", skyddsombud: "", deltagare: "" },
    byggnad: readJson(BUILDING_KEY, null) || defaultBuilding(),
    svar: {},
    ejAktuellaOmraden: {},
    egnaRader: [],
    sammanfattning: { kommentar: "", nastaRond: "" },
  };
  save();
  return id;
}

// Ronder från v0.1–v0.4 saknar byggnad och har svar per rad-ID (SPEC.md §8)
function migrate(rond) {
  if (rond.version === 2) return;
  const v = { id: uid(), namn: rond.info.plats || "Kontoret" };
  const byggnad = { vaningar: [v], platser: {} };
  const areaOfRow = {};
  CHECKLIST.forEach((a) => a.rader.forEach((r) => { areaOfRow[r.id] = a; }));
  const enhetFor = (area) => {
    if (area.slag === "plats") byggnad.platser[area.id] = [v.id];
    return area.slag === KONTOR ? KONTOR : v.id;
  };

  const svar = {};
  Object.entries(rond.svar || {}).forEach(([radId, s]) => {
    const area = areaOfRow[radId];
    if (area) svar[`${enhetFor(area)}/${radId}`] = { ...s, risk: s.risk || s.prioritet };
  });
  const ejAktuella = {};
  Object.keys(rond.ejAktuellaOmraden || {}).forEach((areaId) => {
    const area = CHECKLIST.find((a) => a.id === areaId);
    if (area) ejAktuella[`${enhetFor(area)}/${areaId}`] = true;
  });
  const egnaRader = (rond.egnaRader || []).flatMap((r) => {
    const area = CHECKLIST.find((a) => a.id === r.omradeId);
    if (!area) return [];
    const enhet = enhetFor(area);
    const old = rond.svar?.[r.id];
    if (old) svar[`${enhet}/${r.id}`] = old;
    return [{ ...r, enhet }];
  });

  Object.assign(rond, { version: 2, byggnad, svar, ejAktuellaOmraden: ejAktuella, egnaRader });
  delete rond.info.plats;
}

// ---------- Modell ----------

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Enhet = "kontor" (gemensamt) eller en våning
function units(rond) {
  return [{ id: KONTOR, namn: "Gemensamt för kontoret" }, ...rond.byggnad.vaningar];
}

function unitName(rond, enhet) {
  return units(rond).find((u) => u.id === enhet)?.namn || "";
}

// En plats kan finnas på flera våningar. Äldre data har ett enda våning-ID.
function platsVaningar(byggnad, platsId) {
  const v = byggnad.platser[platsId];
  return Array.isArray(v) ? v : v ? [v] : [];
}

function areasFor(rond, enhet) {
  if (enhet === KONTOR) return CHECKLIST.filter((a) => a.slag === "kontor");
  return CHECKLIST.filter((a) => a.slag === "vaning" || (a.slag === "plats" && platsVaningar(rond.byggnad, a.id).includes(enhet)));
}

function areaRows(rond, enhet, area) {
  const base = { enhet, omradeId: area.id };
  return area.rader.map((r) => ({ ...r, ...base, key: `${enhet}/${r.id}` }))
    .concat(rond.egnaRader
      .filter((r) => r.enhet === enhet && r.omradeId === area.id)
      .map((r) => ({ ...r, ...base, key: `${enhet}/${r.id}`, egen: true })));
}

function unitRows(rond, enhet) {
  return areasFor(rond, enhet).flatMap((a) => areaRows(rond, enhet, a).map((r) => ({ ...r, omrade: a })));
}

function allRows(rond) {
  return units(rond).flatMap((u) => unitRows(rond, u.id).map((r) => ({ ...r, enhetNamn: u.namn })));
}

// F-24: ett område markerat som ej aktuellt gäller före radens eget svar
function areaNA(rond, enhet, areaId) {
  return !!rond.ejAktuellaOmraden[`${enhet}/${areaId}`];
}

function statusOf(rond, row) {
  return areaNA(rond, row.enhet, row.omradeId) ? "na" : rond.svar[row.key]?.status || null;
}

function riskOf(s) {
  return s.risk || "medel";
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
    .map((r) => ({ ...r, s: rond.svar[r.key] }))
    .sort((a, b) => RISK.indexOf(riskOf(b.s)) - RISK.indexOf(riskOf(a.s)));
}

// Sammanfattat läge för ett område: "na", "tom", "brist", "ok" eller "delvis"
function areaState(rond, enhet, area) {
  if (areaNA(rond, enhet, area.id)) return "na";
  const c = counts(rond, areaRows(rond, enhet, area));
  if (c.brist) return "brist";
  if (!c.klara) return "tom";
  return c.tom ? "delvis" : "ok";
}

function plural(n, en, flera) { return `${n} ${n === 1 ? en : flera}`; }

function setProgress(rond) {
  if (!rond) { progressEl.textContent = ""; meterEl.style.width = "0"; return; }
  const c = counts(rond);
  progressEl.textContent = `${c.klara} / ${c.total}`;
  meterEl.style.width = `${(c.klara / c.total) * 100}%`;
}

function foot(html) {
  return `<div class="foot"><div class="foot-inner">${html}</div></div>`;
}

// ---------- Byggnad (F-25 – F-27) ----------

function setFloors(rond, names) {
  names = names.map((n) => n.trim()).filter(Boolean);
  if (!names.length) names = ["Kontoret"];
  const old = rond.byggnad.vaningar;
  const used = new Set();
  // Behåll ID för våningar med samma namn, annars samma position – så att svar inte tappas vid småändringar
  const vaningar = names.map((namn, i) => {
    let match = old.find((v) => v.namn === namn && !used.has(v.id));
    if (!match && old[i] && !used.has(old[i].id) && !names.includes(old[i].namn)) match = old[i];
    const id = match ? match.id : uid();
    used.add(id);
    return { id, namn };
  });
  Object.keys(rond.byggnad.platser).forEach((k) => {
    rond.byggnad.platser[k] = platsVaningar(rond.byggnad, k).filter((id) => used.has(id));
  });
  rond.byggnad.vaningar = vaningar;
  saveBuilding(rond);
}

function saveBuilding(rond) {
  writeJson(BUILDING_KEY, rond.byggnad);
  touch(rond);
}

// ---------- Routing ----------
// #/                      start
// #/r/<id>/info           uppgifter och byggnad
// #/r/<id>/oversikt       översikt
// #/r/<id>/e/<enhet>      gemensamt eller en våning
// #/r/<id>/klar           sammanfattning

function go(hash) { location.hash = hash; }

function route() {
  const [, , id, view, arg] = location.hash.split("/");
  const rond = id && db.ronder[id];
  app.onclick = app.oninput = app.onsubmit = null;
  window.scrollTo(0, 0);
  if (!rond) return renderHome();
  setProgress(rond);
  if (view === "info") return renderInfo(rond);
  if (view === "oversikt") return renderOverview(rond);
  if (view === "e" && units(rond).some((u) => u.id === arg)) return renderUnit(rond, arg);
  if (view === "klar") return renderSummary(rond);
  go(`#/r/${rond.id}/oversikt`);
}

window.addEventListener("hashchange", route);
document.getElementById("home").addEventListener("click", () => go("#/"));

// ---------- Vyer ----------

function renderHome() {
  setProgress(null);
  const ronder = Object.values(db.ronder).sort((a, b) => b.uppdaterad.localeCompare(a.uppdaterad));
  app.innerHTML = `
    <h1>Skyddsrond</h1>
    <p class="lead">Gå runt våning för våning, bedöm och exportera protokollet som PDF.</p>
    <button class="btn primary block" data-act="new">Ny skyddsrond</button>
    ${ronder.length ? `<h2>Tidigare ronder</h2><ul class="list">${ronder.map((r) => {
      const c = counts(r);
      const n = r.byggnad.vaningar.length;
      return `<li><button data-open="${r.id}">
        <span>${esc(r.info.arbetsplats || "Namnlös")}<br><span class="meta">${esc(r.info.datum)} · ${n > 1 ? `${n} våningar · ` : ""}${r.status === "klar" ? "Klar" : `${c.klara}/${c.total}`}</span></span>
        ${c.brist ? `<span class="flag">${plural(c.brist, "brist", "brister")}</span>` : `<span class="meta">Inga brister</span>`}
      </button></li>`;
    }).join("")}</ul>` : ""}
    <p class="note">Allt sparas automatiskt i den här webbläsaren. Rensas webbläsardata försvinner ronderna, så exportera PDF när du är klar.</p>`;

  app.querySelector("[data-act=new]").onclick = () => go(`#/r/${newRond()}/info`);
  app.querySelectorAll("[data-open]").forEach((b) => {
    b.onclick = () => {
      const r = db.ronder[b.dataset.open];
      go(`#/r/${r.id}/${r.status === "klar" ? "klar" : counts(r).klara ? "oversikt" : "info"}`);
    };
  });
}

function platserHtml(rond) {
  return PLATSER.map((a) => {
    const valda = platsVaningar(rond.byggnad, a.id);
    return `<fieldset class="plats"><legend>${esc(a.titel)}</legend><div class="chips">
      ${rond.byggnad.vaningar.map((v) => `<label class="chip"><input type="checkbox" data-plats="${a.id}" value="${v.id}" ${valda.includes(v.id) ? "checked" : ""}><span>${esc(v.namn)}</span></label>`).join("")}
    </div></fieldset>`;
  }).join("");
}

function renderInfo(rond) {
  const i = rond.info;
  const f = (k, label, type = "text") =>
    `<label class="field"><span>${label}</span><input type="${type}" data-info="${k}" value="${esc(i[k])}"></label>`;
  app.innerHTML = `
    <p class="eyebrow">Uppgifter</p>
    <h1>Om ronden</h1>
    <p class="lead">Arbetsplats och datum krävs.</p>
    <div class="grid2">${f("arbetsplats", "Arbetsplats *")}${f("datum", "Datum *", "date")}</div>
    <div class="grid2">${f("rondledare", "Rondledare")}${f("skyddsombud", "Skyddsombud")}</div>
    <label class="field"><span>Övriga deltagare</span><textarea data-info="deltagare">${esc(i.deltagare)}</textarea></label>

    <h2>Byggnad</h2>
    <p class="hint">Sparas till nästa rond.</p>
    <label class="field"><span>Våningar, en per rad</span><textarea id="floors" rows="6">${esc(rond.byggnad.vaningar.map((v) => v.namn).join("\n"))}</textarea></label>
    <form class="quick" id="quick">
      <span>Snabbval:</span>
      <input type="number" min="1" max="60" inputmode="numeric" placeholder="14" aria-label="Antal våningar">
      <button class="link">Fyll i Våning 1–N</button>
    </form>
    <h2>Var finns</h2>
    <p class="hint">Markera alla våningar där platsen finns.</p>
    <div id="platser">${platserHtml(rond)}</div>

    <p><button class="link" data-act="del">Ta bort ronden</button></p>
    ${foot(`<button class="btn primary" data-act="start">${counts(rond).klara ? "Till översikten" : "Starta rond"}</button>`)}`;

  const startBtn = app.querySelector("[data-act=start]");
  const valid = () => { startBtn.disabled = !(i.arbetsplats.trim() && i.datum); };
  valid();
  app.querySelectorAll("[data-info]").forEach((el) => {
    el.oninput = () => { i[el.dataset.info] = el.value; touch(rond); valid(); };
  });

  const floorsEl = app.querySelector("#floors");
  const platserEl = app.querySelector("#platser");
  const applyFloors = () => {
    setFloors(rond, floorsEl.value.split("\n"));
    platserEl.innerHTML = platserHtml(rond);
    setProgress(rond);
  };
  floorsEl.oninput = applyFloors;
  app.querySelector("#quick").onsubmit = (e) => {
    e.preventDefault();
    const input = e.target.querySelector("input");
    const n = Math.min(60, parseInt(input.value, 10) || 0);
    if (n < 1) { input.focus(); return; }
    floorsEl.value = Array.from({ length: n }, (_, k) => `Våning ${k + 1}`).join("\n");
    applyFloors();
  };
  platserEl.onchange = (e) => {
    const id = e.target.dataset.plats;
    if (!id) return;
    rond.byggnad.platser[id] = [...platserEl.querySelectorAll(`[data-plats="${id}"]:checked`)].map((c) => c.value);
    saveBuilding(rond);
    setProgress(rond);
  };

  startBtn.onclick = () => { applyFloors(); go(`#/r/${rond.id}/oversikt`); };
  app.querySelector("[data-act=del]").onclick = () => {
    if (confirm("Ta bort ronden? Det går inte att ångra.")) { delete db.ronder[rond.id]; save(); go("#/"); }
  };
}

function dotsHtml(rond, enhet) {
  return `<span class="dots" aria-hidden="true">${areasFor(rond, enhet)
    .map((a) => `<i class="dot ${areaState(rond, enhet, a)}"></i>`).join("")}</span>`;
}

function renderOverview(rond) {
  const c = counts(rond);
  const list = units(rond);
  app.innerHTML = `
    <p class="eyebrow">${esc(rond.info.arbetsplats)} · ${esc(rond.info.datum)}</p>
    <h1>Översikt</h1>
    <p class="lead">${c.klara} av ${c.total} punkter bedömda${c.brist ? ` · ${plural(c.brist, "brist", "brister")}` : ""}.</p>
    <ul class="list">${list.map((u, k) => {
      const uc = counts(rond, unitRows(rond, u.id));
      return `<li${k === 0 && list.length > 1 ? ` class="sep"` : ""}><button data-u="${u.id}">
        <span>${esc(u.namn)}<br>${dotsHtml(rond, u.id)}</span>
        <span class="meta">${uc.brist ? `<span class="flag">${plural(uc.brist, "brist", "brister")}</span> ` : ""}${uc.klara}/${uc.total}</span>
      </button></li>`;
    }).join("")}</ul>
    <p class="legend"><i class="dot ok"></i> Klar <i class="dot brist"></i> Brist <i class="dot delvis"></i> Påbörjad <i class="dot tom"></i> Kvar</p>
    <p><button class="link" data-act="info">Ändra uppgifter och byggnad</button></p>
    ${foot(`<button class="btn primary" data-act="sum">Sammanfatta</button>`)}`;

  app.querySelectorAll("[data-u]").forEach((b) => { b.onclick = () => go(`#/r/${rond.id}/e/${b.dataset.u}`); });
  app.querySelector("[data-act=info]").onclick = () => go(`#/r/${rond.id}/info`);
  app.querySelector("[data-act=sum]").onclick = () => go(`#/r/${rond.id}/klar`);
}

function rowHtml(rond, r) {
  const s = rond.svar[r.key] || {};
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

  return `<div class="row" data-row="${r.key}">
    <p class="row-text">${esc(r.text)}</p>
    <div class="seg" role="group" aria-label="Bedömning">${seg}</div>
    ${more}
    ${links.join(" &nbsp; ")}
  </div>`;
}

function sideNavHtml(rond, current) {
  return units(rond).map((u) => {
    const c = counts(rond, unitRows(rond, u.id));
    const st = c.brist ? `<span class="flag">${c.brist}</span>` : !c.tom ? "✓" : c.klara ? `<span class="cnt">${c.klara}/${c.total}</span>` : "";
    const short = u.id === KONTOR ? "Gemensamt" : u.namn.replace(/^(våning|vån\.?|plan)\s*/i, "") || u.namn;
    return `<button type="button" data-go="${u.id}" ${u.id === current ? 'aria-current="page"' : ""}>
      <span class="full">${esc(u.id === KONTOR ? "Gemensamt" : u.namn)}</span><span class="short">${esc(short)}</span><span class="meta">${st}</span></button>`;
  }).join("");
}

// F-28: ett område som block med Allt OK / Gå igenom
function areaHtml(rond, enhet, area) {
  const rows = areaRows(rond, enhet, area);
  const na = areaNA(rond, enhet, area.id);
  const c = counts(rond, rows);
  const open = !na && (openAreas.has(`${enhet}/${area.id}`) || c.brist > 0);
  const state = na ? "Ej aktuellt"
    : c.brist ? `<span class="flag">${plural(c.brist, "brist", "brister")}</span>`
    : c.tom ? `${c.klara}/${c.total}` : "✓ Klart";

  return `<section class="area${open ? " open" : ""}" data-area="${area.id}">
    <div class="area-head"><h3>${esc(area.titel)}</h3><span class="meta">${state}</span></div>
    ${na ? `<div class="area-actions"><button class="btn" data-act="na">Ångra ej aktuellt</button></div>` : `
      <div class="area-actions">
        <button class="btn" data-act="allok" ${c.tom ? "" : "disabled"}>Allt OK</button>
        <button class="btn" data-act="toggle" ${c.brist ? "disabled" : ""}>${open ? "Dölj" : "Gå igenom"}</button>
      </div>
      ${open ? `<div class="rows">
        ${rows.map((r) => rowHtml(rond, r)).join("")}
        <form class="add"><input placeholder="Lägg till egen punkt" aria-label="Lägg till egen punkt"><button class="btn">Lägg till</button></form>
      </div>` : ""}
      <button class="link small" data-act="na">Ej aktuellt här</button>`}
  </section>`;
}

function renderUnit(rond, enhet) {
  const list = units(rond);
  const idx = list.findIndex((u) => u.id === enhet);
  const last = idx === list.length - 1;
  const areas = areasFor(rond, enhet);
  const eyebrow = enhet === KONTOR ? "Görs en gång" : `Våning ${idx} av ${list.length - 1}`;

  app.innerHTML = `
    <nav class="sidenav" id="sidenav" aria-label="Våningar">${sideNavHtml(rond, enhet)}</nav>
    <p class="eyebrow">${eyebrow}</p>
    <h1>${esc(unitName(rond, enhet))}</h1>
    <p class="lead" id="unit-count"></p>
    <div id="areas">${areas.map((a) => areaHtml(rond, enhet, a)).join("")}</div>
    ${foot(`
      <button class="btn" data-act="prev" ${idx === 0 ? "disabled" : ""}>Föregående</button>
      <button class="btn" data-act="overview">Översikt</button>
      <button class="btn primary" data-act="next">${last ? "Sammanfatta" : "Nästa"}</button>`)}`;

  const updateCount = () => {
    const c = counts(rond, unitRows(rond, enhet));
    app.querySelector("#unit-count").textContent =
      `${c.klara} av ${c.total} bedömda${c.brist ? ` · ${plural(c.brist, "brist", "brister")}` : ""}`;
    setProgress(rond);
    const left = nav.scrollLeft, top = nav.scrollTop;
    nav.innerHTML = sideNavHtml(rond, enhet);
    nav.scrollLeft = left; nav.scrollTop = top;
  };
  const nav = app.querySelector("#sidenav");
  nav.onclick = (e) => {
    const b = e.target.closest("[data-go]");
    if (b && b.dataset.go !== enhet) go(`#/r/${rond.id}/e/${b.dataset.go}`);
  };
  updateCount();
  nav.querySelector("[aria-current]")?.scrollIntoView({ block: "nearest", inline: "center" });

  const refresh = (sec, area, focusKey) => {
    sec.outerHTML = areaHtml(rond, enhet, area);
    if (focusKey) app.querySelector(`[data-row="${focusKey}"] textarea`)?.focus();
    updateCount();
  };

  app.querySelector("[data-act=prev]").onclick = () => go(`#/r/${rond.id}/e/${list[idx - 1].id}`);
  app.querySelector("[data-act=overview]").onclick = () => go(`#/r/${rond.id}/oversikt`);
  app.querySelector("[data-act=next]").onclick = () => go(last ? `#/r/${rond.id}/klar` : `#/r/${rond.id}/e/${list[idx + 1].id}`);

  app.onclick = (e) => {
    const btn = e.target.closest("button");
    const sec = btn?.closest("[data-area]");
    if (!sec || btn.type === "submit" && btn.closest("form")) return;
    const area = areas.find((a) => a.id === sec.dataset.area);
    const areaKey = `${enhet}/${area.id}`;
    const rowEl = btn.closest("[data-row]");
    let focusKey = null;

    if (rowEl) {
      const key = rowEl.dataset.row;
      const s = (rond.svar[key] ||= {});
      if (btn.dataset.v) {
        s.status = s.status === btn.dataset.v ? null : btn.dataset.v; // F-06
        if (s.status === "brist" && !s.risk) s.risk = "medel";
      } else if (btn.dataset.act === "comment") {
        s.visaKommentar = true;
        focusKey = key;
      } else if (btn.dataset.act === "remove") {
        if (!confirm("Ta bort punkten?")) return;
        const radId = key.slice(enhet.length + 1);
        rond.egnaRader = rond.egnaRader.filter((r) => !(r.enhet === enhet && r.id === radId));
        delete rond.svar[key];
      } else return;
    } else if (btn.dataset.act === "allok") {
      areaRows(rond, enhet, area).forEach((r) => {
        if (!statusOf(rond, r)) (rond.svar[r.key] ||= {}).status = "ok";
      });
      openAreas.delete(areaKey);
    } else if (btn.dataset.act === "toggle") {
      if (openAreas.has(areaKey)) openAreas.delete(areaKey); else openAreas.add(areaKey);
    } else if (btn.dataset.act === "na") {
      if (rond.ejAktuellaOmraden[areaKey]) delete rond.ejAktuellaOmraden[areaKey];
      else rond.ejAktuellaOmraden[areaKey] = true;
    } else return;

    touch(rond);
    refresh(sec, area, focusKey);
  };

  app.oninput = (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    const key = e.target.closest("[data-row]").dataset.row;
    (rond.svar[key] ||= {})[k] = e.target.value;
    touch(rond);
  };

  app.onsubmit = (e) => {
    e.preventDefault();
    const sec = e.target.closest("[data-area]");
    const input = e.target.querySelector("input");
    const text = input.value.trim();
    if (!sec || !text) return;
    const area = areas.find((a) => a.id === sec.dataset.area);
    rond.egnaRader.push({ id: "egen-" + uid(), enhet, omradeId: area.id, text });
    openAreas.add(`${enhet}/${area.id}`);
    touch(rond);
    refresh(sec, area);
    app.querySelector(`[data-area="${area.id}"] .add input`)?.focus();
  };
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
      <span class="prio">Risk ${esc(riskOf(b.s))}</span> <span class="sub">· ${esc(b.enhetNamn)} · ${esc(b.omrade.titel)}</span>
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
      <button class="btn block" data-act="back">Tillbaka till översikten</button>
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

// ---------- PDF (F-16 – F-19, F-30) ----------

function fileName(rond) {
  const plats = (rond.info.arbetsplats || "kontor").trim().replace(/[^\wåäöÅÄÖ-]+/g, "_");
  return `Skyddsrond_${plats}_${rond.info.datum || today()}.pdf`;
}

function buildingText(rond) {
  const v = rond.byggnad.vaningar;
  return v.length === 1 ? v[0].namn : `${v.length} våningar (${v[0].namn} – ${v[v.length - 1].namn})`;
}

function placesText(rond) {
  return PLATSER.map((a) => {
    const namn = platsVaningar(rond.byggnad, a.id).map((id) => unitName(rond, id)).filter(Boolean);
    return `${a.titel}: ${namn.join(", ") || "finns inte"}`;
  }).join(" · ");
}

// F-30: kort sammanfattning av ett område på en våning
function areaSummary(rond, enhet, area) {
  const rows = areaRows(rond, enhet, area);
  if (areaNA(rond, enhet, area.id)) return { label: "Ej aktuellt", avvikelser: [] };
  const c = counts(rond, rows);
  const avvikelser = rows.filter((r) => statusOf(rond, r) !== "ok" || rond.svar[r.key]?.kommentar)
    .map((r) => ({ r, s: rond.svar[r.key] || {}, status: statusOf(rond, r) }));
  if (!c.klara) return { label: "Ej bedömt", avvikelser: [] };
  if (!avvikelser.length) return { label: "Allt OK", avvikelser };
  const label = c.brist ? plural(c.brist, "brist", "brister") : c.tom ? `${c.tom} ej bedömda` : "OK, med kommentar";
  return { label, avvikelser, ovrigaOk: c.ok - avvikelser.filter((a) => a.status === "ok").length };
}

function exportPdf(rond) {
  if (!window.jspdf) return printFallback(rond);

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210, H = 297, M = 18, CW = W - M * 2;
  // Tres palett, se SPEC.md §7
  const BRAND = [255, 92, 0], ACCENT = [250, 32, 143], MUTED = [110, 110, 110], LINE = [239, 239, 239], INK = [0, 0, 0];
  let y = M;

  const ensure = (h) => { if (y + h > H - M - 8) { doc.addPage(); y = M; } };
  const text = (str, { size = 10, bold = false, color = INK, x = M, w = CW, gap = 1.5 } = {}) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(String(str), w);
    const lh = size * 0.42;
    lines.forEach((ln) => { ensure(lh); doc.text(ln, x, y + lh * 0.8); y += lh; });
    y += gap;
  };
  const right = (str, { size = 9, bold = false, color = INK } = {}) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(str, W - M, y + 3, { align: "right" });
  };
  const rule = (color = LINE) => { doc.setDrawColor(...color); doc.setLineWidth(0.2); doc.line(M, y, W - M, y); y += 3; };
  const heading = (str) => { y += 4; ensure(14); text(str.toUpperCase(), { size: 8, bold: true, color: MUTED, gap: 1 }); rule(INK); };
  const statusColor = (st) => (st === "brist" ? ACCENT : st === "ok" ? INK : MUTED);

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
  text(`${i.arbetsplats}  ·  ${i.datum}`, { size: 11, color: MUTED, gap: 6 });

  // Uppgifter
  heading("Uppgifter");
  [["Arbetsplats", i.arbetsplats], ["Datum", i.datum], ["Byggnad", buildingText(rond)], ["Platser", placesText(rond)],
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
  [["OK", c.ok], ["Brister", c.brist], ["Ej aktuellt", c.na], ["Ej bedömda", c.tom]].forEach(([label, n], k) => {
    const x = M + k * (CW / 4);
    doc.setFont("helvetica", "bold"); doc.setFontSize(20);
    doc.setTextColor(...(label === "Brister" && n ? ACCENT : INK));
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
    text(`Risk: ${riskOf(b.s)}   ·   ${b.enhetNamn}   ·   ${b.omrade.titel}`, { size: 8, color: ACCENT, gap: 1 });
    if (b.s.kommentar) text("Brist: " + b.s.kommentar, { size: 9, gap: 0.5 });
    if (b.s.atgard) text("Åtgärd: " + b.s.atgard, { size: 9, gap: 0.5 });
    text(`Ansvarig: ${b.s.ansvarig || "-"}   ·   Klart senast: ${b.s.klartSenast || "-"}`, { size: 9, color: MUTED, gap: 2 });
    rule();
  });

  // Gemensamt: alla rader
  heading("Gemensamt för kontoret");
  areasFor(rond, KONTOR).forEach((a) => {
    ensure(10);
    text(a.titel, { size: 9, bold: true, gap: 1 });
    if (areaNA(rond, KONTOR, a.id)) return text("Ej aktuellt", { size: 9, color: MUTED });
    areaRows(rond, KONTOR, a).forEach((r) => {
      const st = statusOf(rond, r);
      const s = rond.svar[r.key] || {};
      ensure(8);
      right(STATUS[st] || "Ej bedömd", { bold: st === "brist", color: statusColor(st) });
      text(r.text, { size: 9, w: CW - 30, gap: 0 });
      if (s.kommentar && st !== "brist") text(s.kommentar, { size: 8, color: MUTED, x: M + 4, w: CW - 34, gap: 0 });
      y += 1.5;
    });
    y += 1.5;
  });

  // Per våning: en rad per område (F-30)
  rond.byggnad.vaningar.forEach((v) => {
    heading(v.namn);
    areasFor(rond, v.id).forEach((a) => {
      const sum = areaSummary(rond, v.id, a);
      ensure(7);
      const st = sum.label === "Allt OK" ? "ok" : sum.avvikelser.some((x) => x.status === "brist") ? "brist" : "";
      right(sum.label, { bold: st === "brist", color: statusColor(st) });
      text(a.titel, { size: 9, w: CW - 40, gap: 0.5 });
      sum.avvikelser.forEach(({ r, s, status }) => {
        const label = STATUS[status] || "Ej bedömd";
        text(`${label}: ${r.text}${s.kommentar ? ` - ${s.kommentar}` : ""}`,
          { size: 8, color: status === "brist" ? ACCENT : MUTED, x: M + 4, w: CW - 44, gap: 0.3 });
      });
      if (sum.ovrigaOk) text("Övriga OK", { size: 8, color: MUTED, x: M + 4, gap: 0.3 });
      y += 1.2;
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
  const rowsTable = (enhet, a) => `<table>${areaRows(rond, enhet, a).map((r) => {
    const s = rond.svar[r.key] || {};
    return `<tr><td>${esc(r.text)}${s.kommentar ? `<br><small>${esc(s.kommentar)}</small>` : ""}</td><td>${STATUS[statusOf(rond, r)] || "Ej bedömd"}</td></tr>`;
  }).join("")}</table>`;

  document.getElementById("print").innerHTML = `
    <img src="assets/logo-svart.png" alt="Tre" style="float:right;height:48px">
    <h1>Skyddsrond</h1>
    <p>${esc(i.arbetsplats)} · ${esc(i.datum)} · ${esc(buildingText(rond))}</p>
    <p>Rondledare: ${esc(i.rondledare || "-")} · Skyddsombud: ${esc(i.skyddsombud || "-")}<br>Övriga: ${esc(i.deltagare || "-")}</p>
    <p><b>OK ${c.ok} · Brister ${c.brist} · Ej aktuellt ${c.na} · Ej bedömda ${c.tom}</b></p>
    ${rond.sammanfattning.kommentar ? `<p>${esc(rond.sammanfattning.kommentar)}</p>` : ""}
    <h2>Handlingsplan</h2>
    ${brister.length ? `<table><tr><th>Punkt</th><th>Var</th><th>Risk</th><th>Åtgärd</th><th>Ansvarig</th><th>Klart</th></tr>
      ${brister.map((b) => `<tr><td>${esc(b.text)}<br><small>${esc(b.s.kommentar)}</small></td><td>${esc(b.enhetNamn)}</td><td>${esc(riskOf(b.s))}</td><td>${esc(b.s.atgard)}</td><td>${esc(b.s.ansvarig)}</td><td>${esc(b.s.klartSenast)}</td></tr>`).join("")}
    </table>` : "<p>Inga brister noterade.</p>"}
    <h2>Gemensamt för kontoret</h2>
    ${areasFor(rond, KONTOR).map((a) => `<h3>${esc(a.titel)}</h3>${areaNA(rond, KONTOR, a.id) ? "<p>Ej aktuellt</p>" : rowsTable(KONTOR, a)}`).join("")}
    ${rond.byggnad.vaningar.map((v) => `<h2>${esc(v.namn)}</h2><table>${areasFor(rond, v.id).map((a) => {
      const sum = areaSummary(rond, v.id, a);
      return `<tr><td>${esc(a.titel)}${sum.avvikelser.map(({ r, s, status }) => `<br><small>${STATUS[status] || "Ej bedömd"}: ${esc(r.text)}${s.kommentar ? " - " + esc(s.kommentar) : ""}</small>`).join("")}</td><td>${esc(sum.label)}</td></tr>`;
    }).join("")}</table>`).join("")}
    <p style="margin-top:40px">______________________ &nbsp;&nbsp; ______________________<br>Rondledare &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Skyddsombud</p>`;
  const prevTitle = document.title;
  document.title = fileName(rond).replace(/\.pdf$/, "");
  window.print();
  document.title = prevTitle;
}

route();
