# Skyddsrond

Ett avskalat verktyg för att göra skyddsrond på kontoret. Du går runt våning för våning, bedömer och exporterar protokollet som PDF.

Frågorna är av tre slag: *gemensamma* frågor som besvaras en gång, frågor *per våning*, och *platser* (reception, godsmottagning, soprum, städrum) som bara visas på våningen där de finns. Varje område på en våning har knappen *Allt OK*, så att du bara behöver gå in i detalj där något avviker.

Krav och design finns i [SPEC.md](SPEC.md). Ändra specen först och koden sedan.

## Köra

Dubbelklicka på `index.html`. Det behövs ingen installation och ingen server.

PDF-exporten använder biblioteket jsPDF, som laddas från cdnjs. Om det är blockerat i nätverket öppnas webbläsarens utskrift i stället. Välj då *Spara som PDF*.

## Publicera på GitHub Pages (valfritt)

1. Ladda upp mappen till ett repo.
2. Gå till *Settings → Pages* och välj grenen `main` och mappen `/ (root)`.
3. Öppna länken på telefonen och lägg den på hemskärmen.

## Ändra checklistan

Redigera `checklist.js`. Återanvänd aldrig ett rad-ID för en ny fråga, eftersom sparade ronder pekar på ID:t.

## Data

Allt sparas i webbläsarens `localStorage` på enheten. Inget skickas någonstans. Om du rensar webbläsardata försvinner ronderna, så exportera PDF när du är klar.
