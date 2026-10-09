# Software funnel — rozhodnutia na implementáciu

Toto je zadanie pre ďalšieho agenta. Marketingový záznam a anglický text stránok sú v `docs/software-funnel-brainstorm.md`. Tu sa už nerozhoduje stratégia. Tu sa stavia uloženie formulára.

Customer-facing text je anglický. Cieľové publikum je USA. Slovenskú verziu webu nerobíme.

## Čo už je v repozitári

Nemeň text ani štruktúru týchto stránok, okrem bodov v sekcii Úpravy formulára a privacy.

- `index.html` — anglická firemná homepage. Odkaz na software engineering vedie na `/software/`.
- `software/index.html` — landing. Bez bežnej navigácie. Logo vedie na `/`.
- `software/contact/index.html` — formulár. `FORM_ENDPOINT` je prázdny reťazec, preto odoslanie len otvorí thank-you page a brief ostane v `sessionStorage`.
- `software/thanks/index.html` — poďakovanie, `noindex`.
- `software/funnel.css` — spoločný vzhľad funnelu.
- `sitemap.xml` — `/`, `/software/`, `/software/contact/`. Thank-you page v sitemape nie je.

Case studies na landingu sú zverejnený návrh a môžu sa neskôr upraviť. Backend na ne nečaká. Fotka v sekcii About v tejto verzii nie je.

## Produktové rozhodnutia, ktoré sa nemenia

- Akvizícia: Meta reklama na USA. Upwork je až kontrakt (Direct Contracts), nie marketingová stránka a nie text landingu.
- V1 route: reklama → `/software/` → `/software/contact/` → `/software/thanks/` → osobná odpoveď → call → hourly ponuka → Upwork.
- Sadzba na stránke: from $95/hour. V reklame cena nie je.
- Tri reklamné uhly neskôr: existing software, AI / LLM, backend / integrations. MVP je len karta na landingu.
- Message-matched URL (`/software/ai` a podobne), Calendly, Meta Pixel a video skripty do tohto zadania nepatria.
- Meranie, až keď bude reklama: LandingView, ContactView, FormSubmit, QualifiedLead. QualifiedLead nie je odoslanie formulára. Je to ručné označenie v databáze.

## Hosting

GitHub Pages formulár neuloží. Cieľový beh je alwaysdata:

- jedna Node.js stránka na `enlightening.sk` a `www.enlightening.sk`
- príkaz: `node /home/[account]/enlightening-sk/dist/server.js`
- proces počúva na `process.env.HOST` a `process.env.PORT` (alwaysdata ich nastaví)
- Node 22 LTS (`NODEJS_VERSION=22`, ak default účtu nie je 22)
- MariaDB na `mysql-[account].alwaysdata.net:3306`
- pred doménou Cloudflare (cache len pre GET, POST `/api/lead` sa necacheuje)
- DNS prechod z GitHub Pages je prevádzkový krok. Kód má ísť do tohto repozitára tak, aby šiel spustiť lokálne aj týmto príkazom. Tajomstvá do gitu nepatria.

PHP, Formoid ani iná form-služba sa nepoužijú.

## Aplikácia

TypeScript sa kompiluje cez `tsc`. Na serveri beží JavaScript z `dist/`. `ts-node` v produkcii nie je.

Malý HTTP server (Hono na Node je v poriadku). Next.js ani iný prepis stránok nie je v zadaní. Server robí dve veci:

1. Servíruje verejné statické súbory z koreňa repozitára: `index.html`, `software/`, `robots.txt`, `sitemap.xml`, `CNAME`.
2. Prijíma `POST /api/lead` s `Content-Type: application/json`.

Verejne neservíruj `docs/`, `src/`, `dist/` zdrojové mapy, `node_modules/`, `.env` a súbory mimo verejného webu.

`FORM_ENDPOINT` v `software/contact/index.html` nastav na `/api/lead`. Ostáva same-origin, CORS netreba. Pri HTTP 2xx prehliadač prejde na `/software/thanks/`. Pri chybe ostane existujúca veta a tlačidlo sa znova zapne.

## Úpravy formulára

K existujúcim poliam pridaj:

- honeypot `company_website`: skryté pole, ľudia ho nechajú prázdne, autocomplete off, tabindex -1
- `loadedAt`: čas načítania stránky v milisekundách, nastavený skriptom
- Cloudflare Turnstile widget; verejný site key môže byť v HTML, secret len na serveri

Existujúce mená polí nemení:

| Pole | Povinné | Limit |
| --- | --- | --- |
| `help` | áno | jedna z hodnôt nižšie |
| `project` | áno | 1–8000 znakov po orezaní |
| `engagement` | áno | jedna z hodnôt nižšie |
| `budget` | áno | jedna z hodnôt nižšie |
| `start` | áno | jedna z hodnôt nižšie |
| `name` | áno | 1–200 |
| `email` | áno | platný e-mail, max 200 |
| `company` | nie | max 200, prázdne ulož ako NULL |

Povolené hodnoty kopíruj znak po znaku z `software/contact/index.html` (vrátane en dash v `10–20 hours` a `$2,000–$5,000`):

- help: `Existing software / fixing a problem`, `Backend development`, `AI / LLM integration`, `System / API integration`, `New application / custom software`, `MVP / product development`, `Not sure`, `Other`
- engagement: `A few hours for a specific problem`, `10–20 hours`, `20–40 hours`, `Ongoing development`, `Not sure yet`
- budget: `Under $2,000`, `$2,000–$5,000`, `$5,000–$10,000`, `$10,000+`, `Not sure yet`
- start: `As soon as possible`, `Within a few weeks`, `Within 1–3 months`, `I'm exploring options`

`Under $2,000` sa nevyhadzuje. Formulár lead nerozhoduje.

## Poradie na serveri

1. Odmietni honeypot, ak `company_website` nie je prázdne. Odpoveď ako pri bežnej chybe, lead nezapisuj.
2. Odmietni, ak od `loadedAt` uplynuli menej ako 3 sekundy, čas je v budúcnosti o viac ako 5 minút, alebo je starší ako 24 hodín.
3. Over Turnstile token voči Cloudflare siteverify. `TURNSTILE_SKIP=1` platí len mimo `NODE_ENV=production`. V produkcii chýbajúci secret znamená, že proces nenaštartuje.
4. Rate limit: najviac 5 pokusov na hash IP za hodinu, vrátane odmietnutých. Počítaj v MariaDB, nie v pamäti procesu.
5. Skontroluj polia a allowlist.
6. Vlož riadok do `leads`.
7. Až po úspešnom INSERTe vráť 200. Zlyhanie mailu lead nemaže a klientovi neukazuje chybu.
8. Resend pošle celý brief na `LEAD_NOTIFY_EMAIL` (`info@enlightening.sk`). `reply-to` je e-mail z formulára. Automatická odpoveď návštevníkovi v tejto verzii nie je.

HTTP: 400 validačná chyba, 403 Turnstile alebo honeypot, 429 rate limit, 500 pád databázy. Telo môže byť krátke JSON `{ "ok": false }`. Klient ho nerozlišuje.

## Databáza

MariaDB. Schéma ako SQL súbor v repozitári, ktorý sa dá spustiť raz.

`leads`:

- `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
- `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
- `help` VARCHAR(80) NOT NULL
- `project` TEXT NOT NULL
- `engagement` VARCHAR(80) NOT NULL
- `budget` VARCHAR(40) NOT NULL
- `start_when` VARCHAR(40) NOT NULL (stĺpec sa nevolá `start`)
- `name` VARCHAR(200) NOT NULL
- `email` VARCHAR(200) NOT NULL
- `company` VARCHAR(200) NULL
- `status` VARCHAR(20) NOT NULL DEFAULT `new`
- `qualified` TINYINT(1) NULL
- `ip_hash` CHAR(64) NULL
- `user_agent` VARCHAR(300) NULL

`status` len tieto hodnoty: `new`, `replied`, `call`, `won`, `not_fit`. Aplikácia ich v tejto verzii len zakladá ako `new`. Ďalší stav a `qualified` sa nastavujú v phpMyAdmin. Admin UI nestavaj.

`qualified` ostáva NULL, kým lead niekto ručne označí. To je metrika QualifiedLead, nie stĺpec plnený formulárom.

IP neukladaj v čitateľnej podobe. `ip_hash` je SHA-256 z IP a tajného `IP_HASH_SALT`. User-Agent orež na 300 znakov.

`lead_attempts` pre rate limit: `id`, `ip_hash`, `created_at`. Zapisuj pokus pred ostatnými kontrolami okrem úplne prázdneho tela.

## Premenné prostredia

V `.env.example`, bez hodnôt tajomstiev:

- `HOST`, `PORT`
- `MYSQL_HOST`, `MYSQL_PORT`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE`
- `RESEND_API_KEY`
- `LEAD_NOTIFY_EMAIL`
- `TURNSTILE_SECRET`
- `IP_HASH_SALT`
- `TURNSTILE_SKIP` (len lokálne)
- `NODE_ENV`

## Privacy

Pred ostrým prijatím leadov pridaj krátku anglickú stránku `/privacy/` a odkaz v pätičke funnelu aj na formulári vedľa vety „Your information will only be used to respond to your inquiry.“

Text stránky:

- prevádzkovateľ: enlightening.sk s.r.o., IČO 54864895, info@enlightening.sk
- účel: posúdenie dopytu pred prípadnou zmluvou
- čo sa ukladá: polia formulára, čas, hash IP, user agent
- ako dlho: 24 mesiacov od odoslania, ak z dopytu nevznikne zmluva
- mail s briefom ide na info@enlightening.sk cez Resend

Homepage firemnú pätičku nerozširuj o celý funnel. Stačí existujúci odkaz na `/software/`.

## Hotovo, keď

- lokálne `POST /api/lead` s platným telom vloží riadok a server vráti 200
- neplatná voľba, prázdny projekt, honeypot, príliš rýchle odoslanie a šiestý pokus za hodinu lead nevytvoria
- po úspechu existujúci formulár otvorí `/software/thanks/`
- po páde databázy thank-you page nenastane a tlačidlo sa dá stlačiť znova
- Resend sa volá až po INSERTe; jeho chyba thank-you page neblokuje
- statický web vyzerá ako teraz a `docs/` sa z Node servera nedajú stiahnuť
- v gite nie je `.env` ani kľúč
