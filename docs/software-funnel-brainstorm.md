# Software funnel — prvotný brainstorm

Interný záznam z komunikácie s marketingovým agentom, 9. a 10. októbra 2026.
Customer-facing texty sú v angličtine, lebo cieľové publikum je USA.
Implementačné zadanie je v `docs/software-funnel-implementation.md`. Tento súbor je zdroj textov a marketingových rozhodnutí.

Homepage `enlightening.sk` zostáva firemná stránka. Funnel je samostatná vetva. Homepage je už preložená do angličtiny; agent ju videl ešte v slovenčine. Slovenskú verziu webu nerobíme.

## Čo je rozhodnuté

- Akvizícia ide cez Meta (Facebook/Instagram) reklamu na USA. Upwork nie je akvizičný kanál.
- Upwork slúži až na kontrakt, platby a reputáciu. Vhodný nástroj sú Direct Contracts pre klientov privedených zvonka. Do reklamy ani do hlavného textu landingu Upwork nepatrí.
- Funnel: Meta video → landing → project brief → osobné posúdenie → technical discovery call → ponuka → Upwork hourly contract.
- Reklama je úzka (jeden problém). Landing a identita sú široké (viem riešiť viac druhov softvérových problémov).
- Cena sa v reklame nezobrazuje. Na landingu áno, ešte pred formulárom, ako filter.
- Sadzba na prvý test: **from $95/hour**. Hodinová sadzba, nie fixed price. Pred štartom: priority, orientačný odhad hodín a weekly hour limit.
- Prvý experiment má tri uhly. Úspech sa meria cost per qualified lead, nie CTR a nie počtom všetkých formulárov.
  - Existing software / performance / legacy: „Something in our existing software is becoming a problem.“
  - AI / LLM integration: „We want AI to do something useful and reliable in our actual product/business.“
  - Backend / integrations: „We need an experienced engineer to build/connect the part behind our product.“
- MVP development je na landingu len sekundárna capability. Do prvých reklám nejde.
- Message-matched landingy (`/software/backend`, `/software/ai`, …) až podľa dát. Vo V1 všetky reklamy vedú na jeden landing.
- Meranie sa stavia ešte pred prvou platenou kampaňou. Model eventov z 10. októbra je v sekcii Meranie. Názvy z 9. októbra (LandingView, ContactView, FormSubmit) sa nepoužijú.

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

Tri uhly V1 sú uzavreté: existing software / performance / legacy, AI / LLM integration, backend / integrations. MVP v reklamách zatiaľ nie je.

### 2. Landing — vysvetliť ponuku a kvalifikovať

Hlavný sľub, spoločný pre všetky reklamy:

> Have a software problem you need solved?
> Tell me what you're building, fixing or trying to improve.
> I'll personally review it and let you know if I can help.

Nie „hire a senior developer“, nie zoznam technológií, nie „book a free consultation“.

Route V1:

| Krok | URL | Event | Odkiaľ |
| --- | --- | --- | --- |
| Landing | `/software` | PageView | Pixel |
| Otvorenie formulára | `/software/contact` | ViewContent | Pixel |
| Backend prijal platný formulár | `POST /api/lead` | Lead | Pixel + CAPI, jeden event |
| Lead, s ktorým chceš reálne pracovať | ručne po posúdení | QualifiedLead | neskôr CAPI |

Lead nie je klik na Send ani otvorenie `/software/thanks`. Klik na Tell me about your project samostatný event nemá. QualifiedLead nie je odoslanie formulára.

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

- What do you need help with? — existing software / backend / AI / system integration / new application / MVP / not sure / other
- Tell me about your project or problem — veľké textové pole
- How much development help do you expect to need? — a few hours / 10–20 h / 20–40 h / ongoing / not sure
- Expected monthly development budget — under $2,000 / $2,000–$5,000 / $5,000–$10,000 / $10,000+ / not sure
- When would you like to start? — ASAP / a few weeks / 1–3 months / exploring
- Name a work email sú povinné. Company / website je voliteľné.
- CTA: `Send my project`
- Pod CTA: osobné posúdenie a veta, že údaje slúžia len na odpoveď na dopyt

„Under $2,000“ v budgete zostáva. Pri $95/h to môže byť rozumná krátka zákazka. Formulár dáva kontext, nerozhoduje za teba.

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

## Meranie

Záznam z 10. októbra 2026. Doplniť pred prvým dolárom na tri reklamné uhly. Dodatočné meranie by prišlo o dáta z prvého testu.

Pixel povie, čo návštevník robil. CAPI potvrdí, že vznikol skutočný lead. Databáza povie, či to bol dobrý lead. Neskôr CAPI pošle túto kvalitu späť do Meta. V Ads Manageri má časom prestať stačiť cost per lead. Ďalší cieľ je cost per qualified lead a nakoniec customer acquisition cost. Pri $95/h je jeden klient na 100 hodín $9 500. Optimalizácia na najlacnejší formulár je zavádzajúca.

Príklad, prečo vlastná databáza rozhoduje inak než Meta CPL:

| Lead | Angle | Creative | Meta Lead | Qualified | Contract |
| --- | --- | --- | --- | --- | --- |
| A | AI | video_01 | áno | áno | áno |
| B | AI | video_02 | áno | nie | |
| C | Legacy | video_01 | áno | áno | áno |
| D | Backend | video_03 | áno | nie | |

Meta môže ukázať AI video za $38/lead. Databáza môže ukázať AI 10 leadov a 1 qualified, Legacy 5 leadov, 4 qualified a 2 contracts. Vyšší CPL na Legacy je potom vedľajší.

### Eventy V1

Celý funnel: Meta ad → `/software` → `/software/contact` → úspešný lead → neskôr qualified lead.

- `/software`: PageView, Pixel.
- `/software/contact`: PageView + ViewContent, Pixel. To stačí namiesto eventu za klik na Tell me about your project.
- Úspešný `POST /api/lead`: Lead, Pixel aj CAPI. Najdôležitejší event V1. Zdroj pravdy je, že backend prijal validný formulár.
- Michal označí lead ako relevantný: QualifiedLead, neskôr len CAPI.

Na `/software/thanks` sa Lead nespúšťa. Refresh, história alebo priama URL by vyrobili falošnú konverziu.

Dva príklady posúdenia:

- „Can you build me an AI SaaS for $200?“ je Lead a nie je QualifiedLead.
- „We're running a .NET application with SQL Server and need someone to investigate recurring performance problems. We expect 20–40 hours initially.“ je Lead aj QualifiedLead.

Neskorší funnel, až bude QualifiedLead a výhra odchádzať do Meta: PageView → ViewContent → Lead → QualifiedLead → Contract / Won.

### Pixel a CAPI

Pixel beží na funnel stránkach a sleduje návštevu. CAPI ide zo servera až po úspešnom uložení leadu. Server v tej chvíli vie, že Turnstile prešiel, request je validný, lead je v databáze, a má email, meno, prípadne company a metadata requestu. To je kvalitnejší signál než samotný browser.

Do CAPI patria len matching údaje: hashed email, hashed meno (first/last len keď sa dajú spoľahlivo rozdeliť), client IP, user agent, `_fbp` a `_fbc`, keď existuje. Email a meno sa hashujú SHA-256. Prehliadač má `_fbp` a `_fbc` poslať spolu s formulárom na `/api/lead`.

Úspešný lead ide dvoma cestami a Meta ho musí vidieť ako jeden Lead. Pre každý submit prehliadač vygeneruje `event_id` (UUID). Pixel pošle Lead s týmto `eventID`, rovnaké `event_id` dostane `/api/lead` a CAPI. Deduplikácia je dôležitejšia než ďalšie eventy.

Pixel ID je hodnota v prostredí, nie literál v kóde. CAPI access token je len server-side secret.

### UTM a fbclid

Okrem Meta sa pri návšteve uložia `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term` a `fbclid`. Pri leade sa zapíšu do MariaDB. Z nich neskôr vznikne porovnanie angle / creative / qualified / contract z tabuľky vyššie.

### Stav leadu

QualifiedLead bude možno najdôležitejší event, aj keď admin UI teraz nie je. Po formulári vznikne Lead so stavom nový. Kvalitu nastavíš ručne, zo začiatku SQL príkazom alebo malým interným scriptom.

Agent navrhol hodnoty `new`, `qualified`, `unqualified`, `contacted`, `won`, `lost`. V schéme už je pipeline `new`, `replied`, `call`, `won`, `not_fit` a samostatný stĺpec `qualified`. Ten stĺpec je príznak QualifiedLead. Implementačné zadanie pipeline neprepisuje.

### Súhlas

EU firma a Meta Pixel. Pixel sa nespúšťa pred marketingovým súhlasom tam, kde je súhlas právne potrebný. CAPI súhlas neobchádza: stále ide o odoslanie údajov tretej strane na reklamu a meranie.

Necessary cookies vždy. Marketing / Meta podľa súhlasu. Privacy policy popisuje Meta Pixel, CAPI a spracovanie leadov. Režim pre US kampaň a pre EU návštevníka sa má dať meniť podľa krajiny a súhlasu. Natvrdo „Meta vždy“ v implementácii nie je.

### Čo z toho ide do V1

V1 má mať: Pixel na funnel stránkach, CAPI na úspešný `/api/lead`, spoločné `event_id`, `_fbp` a `_fbc`, UTM + `fbclid` pri leade, databázu pripravenú na qualified, načítanie Meta podľa súhlasu a overenie cez Meta Test Events pred launchom.

V1 nemá: Calendly, admin UI, `/software/ai`, attribution dashboard ani ďalšie custom eventy. QualifiedLead do Meta odíde až v ďalšej verzii.

## Čo zámerne nie je vo V1

- Sedem tém a message-matched URL naraz
- Cena v reklame
- Calendly alebo „book a free consultation“ ako prvý krok
- Upwork ako štvrtá marketingová vrstva
- Formulár len Name / Email / Phone / Message
- Fixed price
- Prepis homepage na sales page
- Slovenská verzia funnelu
- Admin UI, attribution dashboard a eventy navyše oproti modelu v sekcii Meranie
- Lead odvodený z otvorenia `/software/thanks/` alebo z kliku na Tell me about your project
- Natvrdo zapnutý Meta Pixel bez súhlasu tam, kde je súhlas potrebný

## Stav po statických stránkach

Landing, formulár a thank-you page sú v `software/`. Case studies sú na landingu ako návrh a dajú sa upraviť bez čakania na backend. Fotka v About zatiaľ nie je.

Uloženie formulára, Turnstile, Resend, MariaDB, privacy stránka a presun z GitHub Pages na alwaysdata sú v `docs/software-funnel-implementation.md`. Backend je Node.js a TypeScript, nie PHP. Pixel, CAPI, súhlas a atribúcia z 10. októbra sú v tom istom zadaní, v sekcii Meranie, a v kóde zatiaľ nie sú.

## V1 copy

Text od marketingového agenta, 9. októbra 2026. Stránky z neho už stoja v `software/`. Case studies sú zverejnený návrh.

### `/software`

Have a software problem you need solved?

I help businesses build, fix and improve software — from backend systems and integrations to AI-powered features and complete applications.

Senior software engineering from $95/hour.

[Tell me about your project →]

20 years of software engineering experience · Based in the EU · Working remotely with international clients

What can I help you with?

You don't need to know which technology or solution you need. Start with the problem.

Existing Software

Is an existing application becoming slow, difficult to maintain or increasingly expensive to change?

I can help investigate performance problems, fix difficult issues, refactor problematic areas and improve existing .NET, Java and database-driven systems.

Backend Development

Need reliable backend functionality for an existing or new product?

I work with APIs, databases, business logic, authentication, background processing and other server-side functionality, with extensive experience in C#/.NET and Java.

AI & LLM Integration

Want to use AI inside a real product or business process rather than build another prototype?

I can help with LLM integration, structured generation, grounded research, validation, evaluation, automated workflows and production AI pipelines.

System Integration

Need different systems to reliably talk to each other?

I have worked with REST and SOAP APIs, webhooks, payment systems, message queues, external services and complex enterprise integrations.

Custom Software

Sometimes the right solution doesn't exist off the shelf.

I can design and build custom applications and internal tools around specific business processes and requirements.

MVP & Product Development

Have an idea that needs to become working software?

I have independently taken products from architecture and UX through implementation, payments, email, analytics, deployment and production operation.

[Tell me what you need →]

Examples of problems I've worked on

The examples below are proposed case-study copy and will be verified before publication.

From minutes to near-instant

On a banking and trading system, I worked on a data-intensive application view that took several minutes to load. After analyzing how the data was being processed, I redesigned part of the processing and caching approach, reducing the load time to near-instant.

Complex enterprise integrations

For an insurance platform, I worked on integrations connecting business processes with external systems using REST, SOAP, WCF and asynchronous messaging, including bidirectional data flows and callback confirmation.

A production AI content pipeline

For one of my own products, I built a multi-stage LLM pipeline covering grounded research, structured data generation, validation, scoring, content generation, localization and publishing. The system combines LLM evaluation with deterministic validation rather than trusting model output alone.

From idea to production

I have independently built and operated online products covering architecture, backend development, databases, payments, booking workflows, transactional email, analytics, deployment and ongoing production operation.

How I work

No fixed-price guessing

Software work often becomes clearer once you start working with the actual system, codebase and requirements.

That's why I primarily work on an hourly basis instead of trying to predict every requirement, edge case and acceptance criterion before the work begins.

My rate starts at $95/hour.

Before starting, we'll agree on what to tackle first, an initial effort estimate and, where appropriate, a weekly hour limit.

You'll know what I'm working on and you'll stay in control of how much time is spent.

A typical engagement looks like this

1. You describe the problem — Tell me what you're building, what isn't working or what you'd like to improve.
2. I review it — I'll personally look at your request and determine whether it's something I can genuinely help with.
3. We clarify what's needed — For suitable projects, we'll discuss the system, requirements, constraints and desired outcome.
4. I suggest a starting point — I'll propose what I would tackle first and provide an initial estimate of the effort involved.
5. We start working — The work is billed hourly, with priorities and spending kept transparent.

Who will you be working with?

I'm Michal Mihálik, a senior software engineer with approximately 20 years of professional experience.

I've worked on software across banking, trading, insurance, logistics, healthcare, industrial systems and web products.

My strongest areas are backend and full-stack development with C#/.NET and Java, relational databases, APIs and system integrations. More recently, I've also been building production systems involving LLMs, automated AI workflows and browser-based applications.

Over the years I've worked both independently and as part of international teams — from analyzing requirements and designing solutions to implementation, testing, deployment and production support.

I prefer pragmatic engineering: understand the actual problem first, then use the level of technical complexity the problem really requires.

What software problem are you dealing with?

Whether you're trying to fix an existing system, build something new, integrate different services or introduce AI into a real product, tell me what you're trying to accomplish.

I'll personally review your request and let you know if I believe I can help.

Senior software engineering from $95/hour.

[Tell me about your project →]

### `/software/contact`

Tell me about your project

You don't need to prepare a formal specification.

Just tell me what you're trying to build, fix or improve. I'll personally review your request and let you know if I believe I can help.

Senior software engineering from $95/hour.

What do you need help with? (required)

Select the closest option. It's fine if you're not sure.

- Existing software / fixing a problem
- Backend development
- AI / LLM integration
- System / API integration
- New application / custom software
- MVP / product development
- Not sure
- Other

Tell me about your project or problem. (required)

What are you trying to accomplish? What's currently not working? What would a good outcome look like?

How much development help do you expect to need? (required)

- A few hours for a specific problem
- 10–20 hours
- 20–40 hours
- Ongoing development
- Not sure yet

What's your expected monthly development budget? (required)

- Under $2,000
- $2,000–$5,000
- $5,000–$10,000
- $10,000+
- Not sure yet

When would you like to start? (required)

- As soon as possible
- Within a few weeks
- Within 1–3 months
- I'm exploring options

Your name (required)

Work email (required)

Company / website (optional)

[Send my project →]

I'll personally review what you send. If it looks like something I can help with, I'll get back to you to clarify any important details or suggest the next step.

Your information will only be used to respond to your inquiry.

### `/software/thanks`

Thanks. I'll take a look.

I've received your project details.

I'll personally review what you've sent and, if I believe I can help, I'll get back to you with any initial questions or suggest a short call to discuss the problem.

What happens next?

1. I review your project — I'll look at the problem, what you're trying to achieve and the information you've provided.
2. We clarify what's needed — If the project looks like a good fit, I'll contact you with any important questions or suggest a short call.
3. I suggest a starting point — Once I understand the problem well enough, I'll suggest what I would tackle first and give you an initial indication of the effort involved.
4. We agree on how to start — My work starts at $95/hour. Where appropriate, we'll agree on an initial number of hours or a weekly limit so that you remain in control of the spend.

There's no need to define every possible requirement and edge case upfront. We'll start with clear priorities and adjust based on what we learn while working on the actual problem.

— Michal Mihálik
