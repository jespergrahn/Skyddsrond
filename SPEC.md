# Skyddsrond – specifikation

Version 0.5 · 2026-10-27 · Status: utkast för genomgång

Det här dokumentet är källan för vad appen ska göra. Vi ändrar specen först och koden sedan. Varje krav har ett ID (t.ex. `F-03`) så att vi kan hänvisa till det i commits och diskussioner.

---

## 1. Syfte

Ett enkelt verktyg för att genomföra skyddsrond på kontoret: gå runt med telefon eller dator, bocka av rad för rad, notera brister och åtgärder, och exportera resultatet som PDF som sedan laddas upp i ordinarie system (t.ex. dokumentarkiv eller HR-system).

Checklistan bygger på upplägget i Prevents checklistor för skyddsrond på kontor och det systematiska arbetsmiljöarbetet (AFS 2023:1). Frågorna är egna formuleringar och kan justeras fritt i `checklist.js`.

## 2. Principer

1. **Avskalat.** En sak i taget på skärmen. Inga menyer man inte behöver.
2. **Mobil först.** Används stående, gående, med en hand. Stora tryckytor (minst 44 px).
3. **Ingen server.** Allt sparas lokalt i webbläsaren. Inga personuppgifter lämnar datorn förrän användaren själv laddar upp PDF:en.
4. **Ingen byggprocess.** Vanliga HTML-, CSS- och JS-filer. Öppna `index.html` eller publicera via GitHub Pages.
5. **Tappa aldrig data.** Allt sparas automatiskt vid varje ändring.

## 3. Användare

| Roll | Behov |
|---|---|
| Chef / arbetsmiljöansvarig | Leder ronden, fyller i, exporterar och arkiverar PDF |
| Skyddsombud | Deltar, ska stå med i protokollet |
| Övriga deltagare | Nämns i protokollet |

## 4. Flöde

```
Start ──► Uppgifter + byggnad ──► Översikt ──┬─► Gemensamt för kontoret (en gång)
                                     ▲       ├─► Våning 1 ─► Våning 2 ─► … ─► Våning N
                                     └───────┴─► Sammanfattning ──► Exportera PDF
```

**Grundidé (v0.5):** frågorna är av tre slag.

| Slag | Exempel | Görs |
|---|---|---|
| **Gemensamt** (`kontor`) | Policy, OVK-protokoll, brandskyddsansvarig, krisplan | En gång per rond |
| **Per våning** (`vaning`) | Nödutgångar, brandsläckare, belysning, pentry, sladdar | På varje våning |
| **Plats** (`plats`) | Reception, godsmottagning, soprum, städrum | Bara på den våning där platsen finns |

En rond med en enda våning fungerar som ett vanligt kontor utan våningsplan. Därför finns inget separat läge.

## 5. Funktionella krav

### Start
- **F-01** Visa knappen *Ny skyddsrond* och en lista med tidigare ronder (arbetsplats, datum, status, antal brister).
- **F-02** En tidigare rond kan öppnas, fortsättas eller tas bort (med bekräftelse).

### Uppgifter om ronden
- **F-03** Fält: arbetsplats, datum (förvalt idag), rondledare, skyddsombud, övriga deltagare.
- **F-04** Arbetsplats och datum är obligatoriska för att starta.

### Byggnad
- **F-25** Våningarna anges som en lista, en per rad (t.ex. *Entréplan*, *Våning 2* … *Källare*). Snabbval: ange ett antal så fylls *Våning 1 … Våning N* i. Tom lista ger en enda plats, *Kontoret*.
- **F-26** För varje plats (reception, godsmottagning, soprum, städrum) väljs vilken våning den finns på, eller *Finns inte*.
- **F-27** Byggnaden (våningar och platser) sparas och förvalts vid nästa nya rond.

### Rond
- **F-05** Översikten visar *Gemensamt för kontoret* överst och därefter varje våning. Varje rad visar förlopp och har en prick per område: grå = ej klar, svart = klar, magenta = brist.
- **F-28** En våningssida visar våningens områden som block. Varje block har knappen **Allt OK**, som markerar alla obesvarade rader i området som OK (rader med *Brist* ändras inte), och **Gå igenom**, som fäller ut raderna. Block med brist är alltid utfällda.
- **F-29** *Föregående / Nästa våning* finns i foten på våningssidorna.
- **F-06** Varje rad har tre svar: **OK**, **Brist**, **Ej aktuellt**. Ett tryck väljer, ett nytt tryck på samma avmarkerar.
- **F-07** Väljs *Brist* fälls fält ut: beskrivning, riskbedömning (låg / medel / hög, som i Prevents checklistor), åtgärd, ansvarig, klart senast. Förvald risk är *medel*.
- **F-08** Varje rad kan ha en valfri kommentar även vid OK.
- **F-09** Användaren kan lägga till egna rader i ett område. En egen rad gäller bara den våning den lades till på.
- **F-10** *(Ersatt av F-05.)*
- **F-11** Förlopp (besvarade / totalt) syns hela tiden.
- **F-24** Ett helt område på en våning (eller i *Gemensamt*) kan markeras som *Ej aktuellt*. Då räknas alla rader i området som *Ej aktuellt*, raderna döljs och tidigare svar sparas så att det går att ångra.

### Sammanfattning
- **F-12** Visar antal OK, brister, ej aktuellt och obesvarade.
- **F-13** Listar alla brister som en handlingsplan, sorterad på risk (hög först) och med våning angiven. Brister i områden markerade *Ej aktuellt* tas inte med.
- **F-14** Obesvarade rader markeras, men hindrar inte export.
- **F-15** Rutor för övergripande kommentar och datum för nästa rond.

### Export
- **F-16** *Exportera PDF* laddar ner en PDF direkt till datorn.
- **F-17** Filnamn: `Skyddsrond_<arbetsplats>_<ÅÅÅÅ-MM-DD>.pdf`.
- **F-18** PDF:en innehåller: rubrik, uppgifter om ronden, sammanfattning, handlingsplan, *Gemensamt* med alla svar, och rader för underskrift (rondledare och skyddsombud).
- **F-30** Per våning visas i PDF:en en rad per område: *Allt OK*, *Ej aktuellt*, *Ej bedömt* eller de rader som avviker (brist, ej aktuellt, ej bedömd, kommentarer) följt av "övriga OK". Det håller PDF:en kort även med 14 våningar.
- **F-19** Om PDF-biblioteket inte kan laddas (t.ex. blockerat i företagsnätet) används webbläsarens utskrift → *Spara som PDF* som reserv.

### Data
- **F-20** All data sparas automatiskt i webbläsarens `localStorage`.
- **F-21** *(Senare)* Export/import av en rond som JSON-fil för säkerhetskopia eller för att flytta mellan enheter.

## 6. Icke-funktionella krav

- **N-01** Fungerar i senaste Edge, Chrome och Safari (iOS) på telefon och dator.
- **N-02** Laddar på under 1 sekund, inga ramverk.
- **N-03** Tillgänglighet: tangentbordsnavigering, synlig fokus, kontrast enligt WCAG AA.
- **N-04** Svenska genomgående.
- **N-05** Data försvinner om webbläsardata rensas. Användaren ska informeras om detta på startsidan.

## 7. Design

**Känsla:** svart, vitt och luft. Typografin bär designen. Tres orange är märkesfärgen och används för det man ska trycka på härnäst. Magenta används bara för att markera brister.

**Färger enligt Tres palett:**

| Token | Tre-färg | Värde | Användning |
|---|---|---|---|
| `--ink` | Svart | `#000000` | Text, OK-markering |
| `--paper` | Vit | `#FFFFFF` | Bakgrund |
| `--soft` | Mjuk vit | `#EFEFEF` | Avdelare, ytor, *Ej aktuellt* |
| `--brand` | Orange | `#FF5C00` | Primärknapp, förloppsmätare, logotypmarkering |
| `--accent` | Magenta | `#FA208F` | *Brist*, risketiketter |
| `--muted` | – | `#6E6E6E` | Hjälptext (inte en Tre-färg, krävs för läsbarheten) |

Alla värden är bekräftade av användaren 2026-10-27.

**Regler:**
- **Röd** (`#EA2E2D`) används aldrig. Den är reserverad för Tres prispunkter.
- **Neutral orange** (`#FF8400`) och **ljus orange** (`#FFB000`) används inte i appen, så att den förblir avskalad.
- Magenta får aldrig dominera. Den används bara där det finns en brist.
- **Kontrast (N-03):** vit text på orange (3,1:1) och på magenta (3,7:1) klarar inte WCAG AA för vanlig text. Därför har orange och magenta ytor **svart text** (6,8:1 och 5,7:1). Magenta och orange används som textfärg bara i stor text (minst 24 px).

Typsnitt: systemtypsnitt (`system-ui`), som på Windows blir Segoe UI. Rubriker i fet vikt, stora och täta. Inga skuggor, inga rundade kort, inga ikoner utöver tecken (✓, !, –).

**Radlayout (mobil):**
```
Nödutgångar är skyltade och fria          
[ OK ] [ Brist ] [ Ej aktuellt ]
```
Vid *Brist* växer raden och visar åtgärdsfälten direkt under.

## 8. Datamodell

```js
Rond {
  id, version: 2, skapad, uppdaterad, status: "pågår" | "klar",
  info: { arbetsplats, datum, rondledare, skyddsombud, deltagare },
  byggnad: {
    vaningar: [{ id, namn }],
    platser: { [omradeId]: vaningId | null }   // rec, gods, avf, sta
  },
  svar: {
    ["<enhet>/<radId>"]: {                       // enhet = "kontor" eller ett våning-ID
      status: "ok" | "brist" | "na" | null,
      kommentar, atgard, ansvarig, klartSenast, risk: "låg" | "medel" | "hög"
    }
  },
  ejAktuellaOmraden: { ["<enhet>/<omradeId>"]: true },
  egnaRader: [{ id, enhet, omradeId, text }],
  sammanfattning: { kommentar, nastaRond }
}
```
Senast använda byggnad sparas separat (F-27).

Checklistan (`checklist.js`) är separerad från ronddata. Ändrade frågor påverkar därför inte gamla ronder, så länge rad-ID:n inte återanvänds.

**Migrering:** ronder från v0.1–v0.4 (utan `byggnad`) läses in som en byggnad med en våning, *Kontoret*. Svaren flyttas till rätt enhet. Svar på pensionerade rader visas inte. Fältet `prioritet` läses som `risk`.

## 8b. Checklista v3

Bantad 2026-10-27 för att fungera våning för våning: frågor som inte ändras mellan våningar flyttades till *Gemensamt*, närliggande frågor slogs ihop och frågor som sällan ger utslag på ett kontor togs bort. Ämnena är fortfarande avstämda mot Prevents *Allmän skyddsrond – Kontor*. Frågorna är egna formuleringar.

| Slag | Område | Rader |
|---|---|---|
| Gemensamt | Systematiskt arbetsmiljöarbete | 4 |
| Gemensamt | Organisatorisk och social arbetsmiljö | 3 |
| Gemensamt | Brand, första hjälpen och krisberedskap | 7 |
| Gemensamt | Fastighet och ventilation | 2 |
| Gemensamt | Hälsa och arbetsplatser | 2 |
| Gemensamt | Kemiska produkter | 2 |
| Gemensamt | Hot, våld och säkerhet | 3 |
| Per våning | Brand och utrymning | 4 |
| Per våning | Första hjälpen | 2 |
| Per våning | Arbetsplatser | 2 |
| Per våning | Ljus, luft och ljud | 5 |
| Per våning | Pentry och toaletter | 2 |
| Per våning | El | 2 |
| Plats | Reception | 3 |
| Plats | Godsmottagning | 2 |
| Plats | Soprum | 3 |
| Plats | Städrum | 2 |
| | **Gemensamt / per våning / platser** | **23 / 17 / 10** |

Med 14 våningar: 23 + 14 × 17 + 10 = 271 punkter, men med *Allt OK* ungefär 6 tryck per våning plus det som avviker.

**Pensionerade rad-ID:n (återanvänds aldrig):** `lok-1`, `lok-3`, `lok-5`, `lok-8`, `org-5`, `soc-2`, `soc-4`, `erg-3`, `erg-5`, `erg-7`, `erg-8`, `bel-2`, `bel-3`, `ven-2`, `ven-3`, `ven-4`, `per-3`, `per-4`, `per-5`, `bra-5`, `bra-6`, `bra-9`, `el-1`, `el-2`, `el-4`, `kem-1`, `kem-2`, `rec-3`, `rec-4`, `sta-1`, `sta-3`, `sta-4`, `gods-1`, `avf-1`, `avf-3`.

## 9. Filstruktur

```
index.html      Skal och vyer
styles.css      All design
app.js          Logik, lagring, PDF
checklist.js    Områden och frågor, lätt att redigera
assets/         Tre-logotyper (svart, vit) och logo.js (svart logga inbäddad för PDF)
SPEC.md         Det här dokumentet
README.md       Hur man kör och publicerar
```

## 10. Beslut och öppna frågor

| # | Fråga | Beslut (2026-10-27) | Väntar på |
|---|---|---|---|
| 1 | Tre-färgerna | Tres palett används, se §7. Alla värden bekräftade | – |
| 2 | Logotyp | Tres svarta linjelogga i appens topp och i PDF:ens sidhuvud (se F-22, F-23). Den vita versionen sparas för framtida mörka ytor | – |
| 3 | Checklistan | Avstämd mot Prevent, se §8b | – |
| 4 | Format i målsystemet | Vanlig PDF tills annat krav dyker upp | – |
| 5 | Hosting | GitHub Pages på jobbets GitHub (se N-06, N-07) | – |

### Krav som följer av besluten
- **F-22** Tre-logotypen (svart linjelogga, `assets/logo-svart.png`) visas i appens toppfält, 24 px hög, till vänster om ordet *Skyddsrond*.
- **F-23** Samma logotyp visas uppe till höger på PDF:ens första sida, 14 mm hög. Den bäddas in från `assets/logo.js`, så att exporten fungerar även när `index.html` öppnas direkt från disk.
- **N-06** Appen publiceras via GitHub Pages och måste fungera från en undermapp (relativa sökvägar).
- **N-07** jsPDF läggs i repot (`lib/jspdf.umd.min.js`) i stället för att hämtas från cdnjs, så att exporten inte beror på att företagsnätet släpper igenom CDN:en.

## 11. Backlog (förslag på nästa steg)

| ID | Förslag | Prioritet |
|---|---|---|
| B-01 | Foto på brist, bifogas i PDF | Hög |
| B-02 | JSON-export/import (F-21) | Medel |
| B-03 | Uppföljning: öppna förra rondens brister och markera som åtgärdade | Hög |
| B-04 | Flera checklistmallar (kontor, lager, butik) | Medel |
| B-05 | Fungera helt offline som installerbar app (PWA) | Låg |
| B-06 | Digital signatur på skärmen | Låg |

## 12. Ändringslogg

| Version | Datum | Ändring |
|---|---|---|
| 0.1 | 2026-10-27 | Första utkast och MVP |
| 0.2 | 2026-10-27 | Beslut om färg, logotyp och hosting. Checklista v2 (16 områden, 80 rader). Riskbedömning ersätter prioritet (F-07, F-13). Hela område *Ej aktuellt* (F-24) |
| 0.3 | 2026-10-27 | Tres färgpalett i §7 med regler för användning och kontrast |
| 0.4 | 2026-10-27 | Tre-logotyp i appen och PDF:en (F-22, F-23) |
| 0.5 | 2026-10-27 | Våning för våning: byggnad (F-25–F-27), gemensamt/per våning/plats, *Allt OK* per område (F-28), våningsnavigering (F-29), kort PDF per våning (F-30). Checklista v3 (23 + 17 per våning + 10) |
