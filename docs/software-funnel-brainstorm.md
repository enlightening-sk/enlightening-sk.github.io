# Software funnel — prvotný brainstorm

Interný záznam z komunikácie s marketingovým agentom, 9. októbra 2026.
Nie je to zadanie na implementáciu. Customer-facing texty sú v angličtine, lebo cieľové publikum je USA.

Homepage `enlightening.sk` zostáva firemná stránka. Funnel je samostatná vetva. Homepage je už preložená do angličtiny; agent ju videl ešte v slovenčine. Slovenskú verziu webu nerobíme.

## Čo je rozhodnuté

- Akvizícia ide cez Meta (Facebook/Instagram) reklamu na USA. Upwork nie je akvizičný kanál.
- Upwork slúži až na kontrakt, platby a reputáciu. Vhodný nástroj sú Direct Contracts pre klientov privedených zvonka. Do reklamy ani do hlavného textu landingu Upwork nepatrí.
- Funnel: Meta video → landing → project brief → osobné posúdenie → technical discovery call → ponuka → Upwork hourly contract.
- Reklama je úzka (jeden problém). Landing a identita sú široké (viem riešiť viac druhov softvérových problémov).
- Cena sa v reklame nezobrazuje. Na landingu áno, ešte pred formulárom, ako filter.
- Sadzba na prvý test: **from $95/hour**. Hodinová sadzba, nie fixed price. Pred štartom: priority, orientačný odhad hodín a weekly hour limit.
- Prvý experiment: 3 positioningy, nie sedem tém naraz. Ktoré tri, ešte nie je uzatvorené (pozri otvorené body). Úspech sa meria cost per qualified lead, nie CTR.
- Message-matched landingy (`/software/backend`, `/software/ai`, …) až podľa dát. Vo V1 všetky reklamy vedú na jeden landing.

## Tri vrstvy

### 1. Ad — zachytiť konkrétny problém

Cieľ videa je dostať správneho človeka na landing. Nie vysvetliť celé portfólio a nie povedať cenu.

Kostra každého videa (asi 30–45 s):

1. Hook — konkrétny problém v prvých 3–5 sekundách
2. Problem — prečo tá situácia vzniká, bez zoznamu technológií
3. How I help — čo s tým vieš urobiť
4. Proof — jeden krátky dôkaz z reálnej práce
5. Broaden — spoločná veta: „And that's just one example of the software problems I can help you solve.“
6. CTA — „Tell me what you're trying to build, fix or improve using the form below. I'll personally review it and let you know if I can help.“

Kandidáti na uhly (na prvý test len časť z nich):

- Backend / performance
- AI / LLM integration
- Legacy .NET / Java
- Integrations (API, payments, webhooks)
- MVP / custom software

### 2. Landing — vysvetliť ponuku a kvalifikovať

Hlavný sľub, spoločný pre všetky reklamy:

> Have a software problem you need solved?
> Tell me what you're building, fixing or trying to improve.
> I'll personally review it and let you know if I can help.

Nie „hire a senior developer“, nie zoznam technológií, nie „book a free consultation“.

Route V1:

| Krok | URL | Úloha v meraní |
| --- | --- | --- |
| Landing | `/software` | návšteva |
| Formulár | `/software/contact` | prejavený intent |
| Poďakovanie | `/software/thanks` | lead |

Neskoršie, až podľa dát: `/software/backend`, `/software/ai`, `/software/dotnet`, `/software/integrations`.

#### `/software`

1. **Hero.** Problém zákazníka, nie agentúrny slogan. Podnadpis v zmysle: pomáham firmám stavať, opravovať a zlepšovať softvér — backend, integrácie, AI funkcie aj celé aplikácie. `Senior software engineering from $95/hour.` CTA: `Tell me about your project`. Krátky trust bar: asi 20 rokov, EU, remote pre zahraničných klientov.
2. **Problems I can help with.** Karty, aby človek z úzkej reklamy videl širší záber: Backend, AI & LLM, Existing software, System integration, Custom software, MVP.
3. **Real problems I've solved.** 3–4 mini case studies z reálnej práce, nie logá technológií a nie vymyslené referencie. Návrhy agenta (banking performance z minút na takmer okamžite, enterprise integrácie, production AI pipeline, produkt od nápadu po prevádzku) treba pred zverejnením potvrdiť vetu po vete.
4. **How I work.** Hodinovka ako spôsob spolupráce, nie ako „programátor za $95“. Fixed-price acceptance criteria zámerne nerobíme. Dohoda pred štartom: priority, prvý odhad, weekly limit. `From $95/hour.`
5. **About.** Nízko na stránke. Fotka, Michal Mihálik, ~20 rokov, odvetvia, nie celé CV.
6. **Final CTA.** Rovnaký sľub ako hero, odkaz na formulár.

Hlas stránky je prvý osobný (Michal). Právnická osoba v pätičke zostáva enlightening.sk s.r.o.

#### `/software/contact`

Samostatná stránka, nie formulár nalepený pod landing. Klient nemusí priniesť špecifikáciu.

- What do you need help with? — Backend / AI / Existing software / Integration / New application / Not sure / Other
- What's the problem or project? — veľké textové pole
- What level of engagement do you expect? — a few hours / 10–20 h / 20–40 h / Ongoing / Not sure
- Expected monthly development budget — Under $2k / $2–5k / $5–10k / $10k+ / Not sure
- When would you like to start? — ASAP / a few weeks / 1–3 months / exploring
- Name
- Work email
- Company / website — voliteľné
- CTA: `Send my project`
- Pod CTA: osobne si to pozriem a ozvem sa, ak viem pomôcť

Dvojkrokový formulár bol nápad na neskorší A/B test. Vo V1 je jedna stránka formulára.

#### `/software/thanks`

Nie holé „form submitted“. Text v zmysle: pozriem si to osobne; ak viem pomôcť, ozvem sa s otázkami alebo s návrhom krátkeho callu. Štyri kroky ďalej: review → upresnenie problému → návrh štartu (prvé kroky a orientačné hodiny) → hourly contract from $95/hour s dohodnutým limitom.

### 3. Následná komunikácia — z leadu kontrakt

Marketing končí odoslaním briefu. Ďalej je consultative selling.

1. **Prvá odpoveď.** Najprv ukázať, že problému rozumieš, a priložiť jeden relevantný dôkaz. Až potom navrhnúť krátky call. Nie „som voľný, sadzba je $95“.
2. **Call.** Technical discovery: problém, súčasný systém, dopad na biznis, želaný výsledok, obmedzenia, priorita. Otázka na obe strany: viem to reálne vyriešiť a dáva to obchodne zmysel?
3. **Návrh.** `$95/hour`, prvé okno (príklad z agenta: 10 hodín na investigation), čo sa pozrie ako prvé, limit sa bez dohody neprekročí.
4. **Kontrakt.** Upwork hourly, weekly limit, time tracking, týždenná fakturácia.

Príklad tónu prvej odpovede je v pôvodnej komunikácii (pomalé .NET reporty nad SQL Serverom a banking performance case).

## Čo zámerne nie je vo V1

- Sedem tém a message-matched URL naraz
- Cena v reklame
- Calendly alebo „book a free consultation“ ako prvý krok
- Upwork ako štvrtá marketingová vrstva
- Formulár len Name / Email / Phone / Message
- Fixed price
- Prepis homepage na sales page
- Slovenská verzia funnelu

## Otvorené pred textom landingu

- Ktoré presne tri uhly idú do prvého experimentu. Agent navrhoval backend / existing systems, AI, MVP. V route neskôr pribudli aj legacy a integrácie. Treba vybrať tri.
- Case studies: ktoré vety sú presné a zverejniteľné (klient, odvetvie, čísla).
- Fotka do sekcie About.
- Či trust bar hovorí „Based in EU“ takto natvrdo.
- Meta Pixel / CAPI a budget testu ($500 / $1 000 / $2 000) až keď stránky vedia odlíšiť návštevu, otvorenie formulára a lead.

## Technické predpoklady (mimo marketingového vlákna)

GitHub Pages formulár neuloží a nepošle mail. Statické stránky vedia vzniknúť aj skôr. Ostrý formulár potrebuje backend (predtým: alwaysdata, databáza, Cloudflare Turnstile, voliteľne Resend) a krátku privacy poznámku: slovenská s.r.o. je prevádzkovateľ, účel je posúdenie zákazky pred zmluvou.

Meranie, ktoré má route podporovať: ad click → `/software` → `/software/contact` → `/software/thanks`.

## Ďalšie kroky

1. Potvrdiť tri reklamné uhly a vetu po vete case studies, ktoré smú na web.
2. Napísať anglický obsah `/software`, `/software/contact` a `/software/thanks` po sekciách a schváliť ho pred kódom.
3. Až potom zložiť statické stránky. Homepage nechať ako firemný prehľad.
4. Samostatne zapojiť uloženie formulára, ochranu proti spamu a potvrdzovací mail.
5. Video skripty písať až podľa schváleného sľubu landingu, aby reklama sľubovala to, čo stránka vie dodržať.
