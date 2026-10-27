// Checklista v2 för skyddsrond på kontor – se SPEC.md §8b.
// Avstämd mot Prevents "Allmän skyddsrond – Kontor". Frågorna är egna formuleringar.
// Redigera fritt, men återanvänd aldrig ett rad-ID för en ny fråga (gamla ronder pekar på ID:t).
// Pensionerade ID:n: lok-1, lok-3.

const CHECKLIST = [
  {
    id: "org",
    titel: "Systematiskt arbetsmiljöarbete",
    rader: [
      { id: "org-1", text: "Det finns en aktuell arbetsmiljöpolicy som medarbetarna känner till" },
      { id: "org-2", text: "Uppgifter i arbetsmiljöarbetet är fördelade skriftligt" },
      { id: "org-3", text: "Förra skyddsrondens åtgärder är genomförda eller följs upp" },
      { id: "org-4", text: "Tillbud och olyckor rapporteras och utreds" },
      { id: "org-5", text: "Nyanställda får introduktion i arbetsmiljö och säkerhet" },
    ],
  },
  {
    id: "soc",
    titel: "Organisatorisk och social arbetsmiljö",
    rader: [
      { id: "soc-1", text: "Arbetsbelastningen är rimlig i förhållande till resurserna" },
      { id: "soc-2", text: "Medarbetarna vet vad som ska prioriteras när det är mycket att göra" },
      { id: "soc-3", text: "Det finns rutiner för att hantera kränkande särbehandling" },
      { id: "soc-4", text: "Det finns möjlighet till återhämtning under arbetsdagen" },
      { id: "soc-5", text: "Risker med ensamarbete och arbete utanför kontorstid är kända" },
    ],
  },
  {
    id: "erg",
    titel: "Bildskärmsarbete och ergonomi",
    rader: [
      { id: "erg-1", text: "Skrivbord och stolar går att ställa in efter personen" },
      { id: "erg-2", text: "Bildskärmar står rätt i höjd och avstånd, utan bländning" },
      { id: "erg-3", text: "Tangentbord och mus finns som separata enheter till bärbara datorer" },
      { id: "erg-4", text: "Medarbetare har fått information om bra arbetsställningar" },
      { id: "erg-5", text: "Det finns möjlighet att variera mellan att sitta och stå" },
      { id: "erg-6", text: "Synundersökning och terminalglasögon erbjuds vid behov" },
      { id: "erg-7", text: "Medarbetarna kan påverka hur den egna arbetsplatsen är utformad" },
      { id: "erg-8", text: "Text och bild på skärmen är lätta att läsa (storlek, kontrast, skärpa)" },
    ],
  },
  {
    id: "bel",
    titel: "Belysning",
    rader: [
      { id: "bel-1", text: "Allmänbelysningen räcker för arbetet och är fri från flimmer" },
      { id: "bel-2", text: "Arbetsplatserna har tillgång till dagsljus och utblick" },
      { id: "bel-3", text: "Den som behöver mer ljus kan få extra arbetsbelysning" },
    ],
  },
  {
    id: "lok",
    titel: "Lokaler och klimat",
    rader: [
      { id: "lok-2", text: "Temperaturen är behaglig, utan drag" },
      { id: "lok-7", text: "Luften upplevs som frisk, utan lukt eller torrhet" },
      { id: "lok-8", text: "Utsatta platser (t.ex. vid fönster i söderläge) kan kylas eller värmas extra" },
      { id: "lok-4", text: "Ljudmiljön tillåter koncentrerat arbete" },
      { id: "lok-5", text: "Det finns rum för samtal och fokusarbete" },
      { id: "lok-6", text: "Golv är fria från snubbelrisker och sladdar" },
    ],
  },
  {
    id: "ven",
    titel: "Ventilation",
    rader: [
      { id: "ven-1", text: "Ventilationen är besiktigad och godkänd (OVK) och protokollet finns" },
      { id: "ven-2", text: "Till- och frånluft fungerar i alla rum" },
      { id: "ven-3", text: "Ventilationen ger inte drag eller störande ljud" },
      { id: "ven-4", text: "Det finns rutiner för skötsel och dokumentation av ventilationen" },
      { id: "ven-5", text: "Medarbetarna vet hur man felanmäler problem med inomhusklimatet" },
    ],
  },
  {
    id: "per",
    titel: "Personalutrymmen",
    rader: [
      { id: "per-1", text: "Pentry och lunchrum är rena och har tillräckligt med platser" },
      { id: "per-2", text: "Toaletter är rena och fungerar" },
      { id: "per-3", text: "Det finns möjlighet att vila vid behov" },
      { id: "per-4", text: "Kylskåp, kaffemaskiner och diskmaskiner fungerar och rengörs" },
      { id: "per-5", text: "Det finns låsbar förvaring för personliga tillhörigheter" },
    ],
  },
  {
    id: "rec",
    titel: "Reception",
    rader: [
      { id: "rec-1", text: "Bemanningen gör det möjligt att ta pauser och bli avlöst" },
      { id: "rec-2", text: "Arbetsplatsen i receptionen går att ställa in efter personen" },
      { id: "rec-3", text: "Headset finns för den som har mycket telefonarbete" },
      { id: "rec-4", text: "Ljus från entré och fönster bländar inte" },
      { id: "rec-5", text: "Överfallslarm eller liknande finns och testas regelbundet" },
    ],
  },
  {
    id: "bra",
    titel: "Brand och utrymning",
    rader: [
      { id: "bra-7", text: "Det finns en utsedd brandskyddsansvarig" },
      { id: "bra-1", text: "Nödutgångar är skyltade och fria från hinder" },
      { id: "bra-8", text: "Nödutgångar går att öppna inifrån utan nyckel" },
      { id: "bra-2", text: "Utrymningsplaner sitter uppe och stämmer" },
      { id: "bra-3", text: "Brandsläckare och brandfiltar finns, är kontrollerade och synliga" },
      { id: "bra-9", text: "Utrymningslarmet hörs eller syns i alla utrymmen" },
      { id: "bra-4", text: "Brandlarm och utrymningsövning har genomförts det senaste året" },
      { id: "bra-5", text: "Återsamlingsplats är känd av alla" },
      { id: "bra-6", text: "Det finns utsedda utrymningsledare" },
    ],
  },
  {
    id: "hjl",
    titel: "Första hjälpen och krisberedskap",
    rader: [
      { id: "hjl-1", text: "Förbandslåda finns, är fylld och märkt" },
      { id: "hjl-2", text: "Hjärtstartare finns eller närmaste är känd" },
      { id: "hjl-5", text: "Utgångsdatum kontrolleras, även för hjärtstartarens elektroder och batteri" },
      { id: "hjl-6", text: "Första hjälpen-utrustning och hjärtstartare är skyltade" },
      { id: "hjl-3", text: "Det finns personer utbildade i första hjälpen och HLR" },
      { id: "hjl-4", text: "Krisplan och viktiga telefonnummer är kända" },
    ],
  },
  {
    id: "el",
    titel: "El och utrustning",
    rader: [
      { id: "el-1", text: "Sladdar, grenuttag och kontakter är hela" },
      { id: "el-2", text: "Grenuttag är inte seriekopplade" },
      { id: "el-3", text: "Elcentraler är åtkomliga och inte blockerade" },
      { id: "el-4", text: "Skrivare och annan utrustning är placerade och servade rätt" },
    ],
  },
  {
    id: "kem",
    titel: "Kemiska produkter",
    rader: [
      { id: "kem-1", text: "Kemiska produkter (t.ex. städ- och skrivarprodukter) är förtecknade" },
      { id: "kem-2", text: "Säkerhetsdatablad finns tillgängliga" },
      { id: "kem-3", text: "Produkterna förvaras märkta och på rätt sätt" },
    ],
  },
  {
    id: "sta",
    titel: "Städ och lokalvård",
    rader: [
      { id: "sta-1", text: "Städrutiner och ansvar är tydliga" },
      { id: "sta-2", text: "Städrummet har ventilation, utslagsvask och plats för förvaring" },
      { id: "sta-3", text: "Städvagnar och redskap är ergonomiska och i gott skick" },
      { id: "sta-4", text: "Golv rengörs på ett sätt som inte ger halkrisk" },
      { id: "sta-5", text: "Städkemikalier är märkta och förvaras rätt" },
    ],
  },
  {
    id: "gods",
    titel: "Godsmottagning",
    rader: [
      { id: "gods-1", text: "Lastplatsen fungerar säkert för leveranser" },
      { id: "gods-2", text: "Transportvägar är fria från trösklar och hinder" },
      { id: "gods-3", text: "Kärror och lyfthjälpmedel finns för tunga leveranser" },
    ],
  },
  {
    id: "avf",
    titel: "Soprum och källsortering",
    rader: [
      { id: "avf-1", text: "Medarbetarna vet hur avfallet ska sorteras" },
      { id: "avf-2", text: "Farligt avfall (batterier, lysrör, elektronik) samlas in separat" },
      { id: "avf-3", text: "Handskar och annat skydd finns vid hantering av avfall" },
      { id: "avf-4", text: "Vägen till soprummet är fri från trösklar och tunga lyft" },
      { id: "avf-5", text: "Soprummet är belyst och hålls rent" },
    ],
  },
  {
    id: "hot",
    titel: "Hot, våld och säkerhet",
    rader: [
      { id: "hot-1", text: "Det finns rutiner för besökare och passerkontroll" },
      { id: "hot-2", text: "Risker för hot och våld är bedömda" },
      { id: "hot-3", text: "Medarbetare vet hur man larmar och agerar vid hot" },
    ],
  },
];
