// Checklista v3 för skyddsrond på kontor – se SPEC.md §8b.
// slag: "kontor" = görs en gång, "vaning" = görs på varje våning, "plats" = bara på våningen där platsen finns.
// Ämnena är avstämda mot Prevents "Allmän skyddsrond – Kontor". Frågorna är egna formuleringar.
// Redigera fritt, men återanvänd aldrig ett rad-ID för en ny fråga (gamla ronder pekar på ID:t).
// Pensionerade ID:n står i SPEC.md §8b.

const CHECKLIST = [
  // ---------- Gemensamt för kontoret ----------
  {
    id: "org", slag: "kontor",
    titel: "Systematiskt arbetsmiljöarbete",
    rader: [
      { id: "org-1", text: "Det finns en aktuell arbetsmiljöpolicy som medarbetarna känner till" },
      { id: "org-2", text: "Uppgifter i arbetsmiljöarbetet är fördelade skriftligt" },
      { id: "org-3", text: "Förra skyddsrondens åtgärder är genomförda eller följs upp" },
      { id: "org-4", text: "Tillbud och olyckor rapporteras och utreds" },
    ],
  },
  {
    id: "soc", slag: "kontor",
    titel: "Organisatorisk och social arbetsmiljö",
    rader: [
      { id: "soc-1", text: "Arbetsbelastningen är rimlig i förhållande till resurserna" },
      { id: "soc-3", text: "Det finns rutiner för att hantera kränkande särbehandling" },
      { id: "soc-5", text: "Risker med ensamarbete och arbete utanför kontorstid är kända" },
    ],
  },
  {
    id: "krs", slag: "kontor",
    titel: "Brand, första hjälpen och krisberedskap",
    rader: [
      { id: "bra-7", text: "Det finns en utsedd brandskyddsansvarig" },
      { id: "bra-4", text: "Utrymningsövning har genomförts det senaste året" },
      { id: "bra-10", text: "Det finns utsedda utrymningsledare och en känd återsamlingsplats" },
      { id: "hjl-2", text: "Hjärtstartare finns eller närmaste är känd" },
      { id: "hjl-5", text: "Utgångsdatum kontrolleras, även för hjärtstartarens elektroder och batteri" },
      { id: "hjl-3", text: "Det finns personer utbildade i första hjälpen och HLR" },
      { id: "hjl-4", text: "Krisplan och viktiga telefonnummer är kända" },
    ],
  },
  {
    id: "fst", slag: "kontor",
    titel: "Fastighet och ventilation",
    rader: [
      { id: "ven-1", text: "Ventilationen är besiktigad och godkänd (OVK) och protokollet finns" },
      { id: "ven-5", text: "Medarbetarna vet hur man felanmäler problem med inomhusklimatet" },
    ],
  },
  {
    id: "hls", slag: "kontor",
    titel: "Hälsa och arbetsplatser",
    rader: [
      { id: "erg-4", text: "Medarbetare har fått information om bra arbetsställningar" },
      { id: "erg-6", text: "Synundersökning och terminalglasögon erbjuds vid behov" },
    ],
  },
  {
    id: "kem", slag: "kontor",
    titel: "Kemiska produkter",
    rader: [
      { id: "kem-4", text: "Kemiska produkter är förtecknade och säkerhetsdatablad finns" },
      { id: "kem-3", text: "Produkterna förvaras märkta och på rätt sätt" },
    ],
  },
  {
    id: "hot", slag: "kontor",
    titel: "Hot, våld och säkerhet",
    rader: [
      { id: "hot-1", text: "Det finns rutiner för besökare och passerkontroll" },
      { id: "hot-2", text: "Risker för hot och våld är bedömda" },
      { id: "hot-3", text: "Medarbetare vet hur man larmar och agerar vid hot" },
    ],
  },

  // ---------- Per våning ----------
  {
    id: "vbra", slag: "vaning",
    titel: "Brand och utrymning",
    rader: [
      { id: "bra-1", text: "Nödutgångar är skyltade och fria från hinder" },
      { id: "bra-8", text: "Nödutgångar går att öppna inifrån utan nyckel" },
      { id: "bra-2", text: "Utrymningsplanen sitter uppe och stämmer" },
      { id: "bra-3", text: "Brandsläckare och brandfilt finns, är kontrollerade och synliga" },
    ],
  },
  {
    id: "vhjl", slag: "vaning",
    titel: "Första hjälpen",
    rader: [
      { id: "hjl-1", text: "Förbandslådan är fylld" },
      { id: "hjl-6", text: "Första hjälpen och närmaste hjärtstartare är skyltade" },
    ],
  },
  {
    id: "verg", slag: "vaning",
    titel: "Arbetsplatser",
    rader: [
      { id: "erg-1", text: "Skrivbord och stolar går att ställa in och fungerar" },
      { id: "erg-2", text: "Bildskärmar står rätt i höjd och avstånd, utan bländning" },
    ],
  },
  {
    id: "vlok", slag: "vaning",
    titel: "Ljus, luft och ljud",
    rader: [
      { id: "bel-1", text: "Belysningen räcker och är fri från flimmer" },
      { id: "lok-2", text: "Temperaturen är behaglig, utan drag" },
      { id: "lok-7", text: "Luften upplevs som frisk" },
      { id: "lok-4", text: "Ljudmiljön tillåter koncentrerat arbete" },
      { id: "lok-6", text: "Golv är fria från snubbelrisker och sladdar" },
    ],
  },
  {
    id: "vper", slag: "vaning",
    titel: "Pentry och toaletter",
    rader: [
      { id: "per-1", text: "Pentry och vitvaror är rena och fungerar" },
      { id: "per-2", text: "Toaletter är rena och fungerar" },
    ],
  },
  {
    id: "vel", slag: "vaning",
    titel: "El",
    rader: [
      { id: "el-5", text: "Sladdar och grenuttag är hela och inte seriekopplade" },
      { id: "el-3", text: "Elcentraler är åtkomliga och inte blockerade" },
    ],
  },

  // ---------- Platser (bara på våningen där de finns) ----------
  {
    id: "rec", slag: "plats",
    titel: "Reception",
    rader: [
      { id: "rec-1", text: "Bemanningen gör det möjligt att ta pauser och bli avlöst" },
      { id: "rec-2", text: "Arbetsplatsen i receptionen går att ställa in efter personen" },
      { id: "rec-5", text: "Överfallslarm eller liknande finns och testas regelbundet" },
    ],
  },
  {
    id: "gods", slag: "plats",
    titel: "Godsmottagning",
    rader: [
      { id: "gods-2", text: "Transportvägar är fria från trösklar och hinder" },
      { id: "gods-3", text: "Kärror och lyfthjälpmedel finns för tunga leveranser" },
    ],
  },
  {
    id: "avf", slag: "plats",
    titel: "Soprum",
    rader: [
      { id: "avf-2", text: "Farligt avfall (batterier, lysrör, elektronik) samlas in separat" },
      { id: "avf-4", text: "Vägen till soprummet är fri från trösklar och tunga lyft" },
      { id: "avf-5", text: "Soprummet är belyst och hålls rent" },
    ],
  },
  {
    id: "sta", slag: "plats",
    titel: "Städrum",
    rader: [
      { id: "sta-2", text: "Städrummet har ventilation, utslagsvask och plats för förvaring" },
      { id: "sta-5", text: "Städkemikalier är märkta och förvaras rätt" },
    ],
  },
];
