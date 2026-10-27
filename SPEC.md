# Skyddsrond – specifikation

Version 0.4 · 2026-10-27 · Status: utkast för genomgång

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
Start ──► Uppgifter om ronden ──► Rond (område för område) ──► Sammanfattning ──► Exportera PDF
  ▲                                                                                     │
  └──────────────────────────────── tidigare ronder ◄────────────────────────────────────┘
```

## 5. Funktionella krav

### Start
- **F-01** Visa knappen *Ny skyddsrond* och en lista med tidigare ronder (arbetsplats, datum, status, antal brister).
- **F-02** En tidigare rond kan öppnas, fortsättas eller tas bort (med bekräftelse).

### Uppgifter om ronden
- **F-03** Fält: arbetsplats, plats/våning, datum (förvalt idag), rondledare, skyddsombud, övriga deltagare.
- **F-04** Arbetsplats och datum är obligatoriska för att starta.

### Rond
- **F-05** Checklistan visas per område. Ett område i taget, med *Föregående / Nästa*.
- **F-06** Varje rad har tre svar: **OK**, **Brist**, **Ej aktuellt**. Ett tryck väljer, ett nytt tryck på samma avmarkerar.
- **F-07** Väljs *Brist* fälls fält ut: beskrivning, riskbedömning (låg / medel / hög, som i Prevents checklistor), åtgärd, ansvarig, klart senast. Förvald risk är *medel*.
- **F-08** Varje rad kan ha en valfri kommentar även vid OK.
- **F-09** Användaren kan lägga till egna rader i ett område.
- **F-10** En översikt visar alla områden och hur många rader som är besvarade, så man kan hoppa direkt.
- **F-11** Förlopp (besvarade / totalt) syns hela tiden.
- **F-24** Ett helt område kan markeras som *Ej aktuellt* med ett tryck (t.ex. när kontoret saknar reception eller godsmottagning). Då räknas alla rader i området som *Ej aktuellt*, raderna döljs och tidigare svar sparas så att det går att ångra. I PDF:en står området kvar med texten "Ej aktuellt för arbetsplatsen".

### Sammanfattning
- **F-12** Visar antal OK, brister, ej aktuellt och obesvarade.
- **F-13** Listar alla brister som en handlingsplan, sorterad på risk (hög först). Brister i områden markerade *Ej aktuellt* tas inte med.
- **F-14** Obesvarade rader markeras, men hindrar inte export.
- **F-15** Rutor för övergripande kommentar och datum för nästa rond.

### Export
- **F-16** *Exportera PDF* laddar ner en PDF direkt till datorn.
- **F-17** Filnamn: `Skyddsrond_<arbetsplats>_<ÅÅÅÅ-MM-DD>.pdf`.
- **F-18** PDF:en innehåller: rubrik, uppgifter om ronden, sammanfattning, handlingsplan, alla svar per område, och rader för underskrift (rondledare och skyddsombud).
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
  id, skapad, uppdaterad, status: "pågår" | "klar",
  info: { arbetsplats, plats, datum, rondledare, skyddsombud, deltagare },
  svar: {
    [radId]: {
      status: "ok" | "brist" | "na" | null,
      kommentar, atgard, ansvarig, klartSenast, risk: "låg" | "medel" | "hög"
    }
  },
  ejAktuellaOmraden: { [omradeId]: true },
  egnaRader: [{ id, omradeId, text }],
  sammanfattning: { kommentar, nastaRond }
}
```
Checklistan (`checklist.js`) är separerad från ronddata. Ändrade frågor påverkar därför inte gamla ronder, så länge rad-ID:n inte återanvänds.

Ronder sparade med v0.1 har fältet `prioritet` i stället för `risk`. Appen läser `risk ?? prioritet`, så gamla ronder fungerar utan migrering.

## 8b. Checklista v2

Avstämd mot Prevents *Allmän skyddsrond – Kontor* (12 områden, 62 frågor) 2026-10-27. Frågorna är egna formuleringar. Prevents lista täcker främst fysisk miljö. Vi behåller våra egna områden för SAM, organisatorisk och social arbetsmiljö, el, kemi samt hot och våld, som Prevent har i separata checklistor.

| # | Område | Rader | Ursprung |
|---|---|---|---|
| 1 | Systematiskt arbetsmiljöarbete | 5 | Egen |
| 2 | Organisatorisk och social arbetsmiljö | 5 | Egen |
| 3 | Bildskärmsarbete och ergonomi | 8 | Prevent + egen |
| 4 | Belysning | 3 | Prevent (ny) |
| 5 | Lokaler och klimat | 6 | Prevent + egen |
| 6 | Ventilation | 5 | Prevent (ny) |
| 7 | Personalutrymmen | 5 | Prevent + egen |
| 8 | Reception | 5 | Prevent (ny) |
| 9 | Brand och utrymning | 9 | Prevent + egen |
| 10 | Första hjälpen och krisberedskap | 6 | Prevent + egen |
| 11 | El och utrustning | 4 | Egen |
| 12 | Kemiska produkter | 3 | Egen |
| 13 | Städ och lokalvård | 5 | Prevent (ny) |
| 14 | Godsmottagning | 3 | Prevent (ny) |
| 15 | Soprum och källsortering | 5 | Prevent (ny) |
| 16 | Hot, våld och säkerhet | 3 | Egen |
| | **Totalt** | **80** | |

Pensionerade rad-ID:n (återanvänds aldrig): `lok-1` (flyttad till Ventilation som `ven-1`), `lok-3` (flyttad till Belysning som `bel-1`).

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
