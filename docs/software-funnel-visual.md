# Software landing — vizuálna spätná väzba

Interný záznam z review marketingového agenta, 12. októbra 2026. Ide o `/software/`, nie o homepage, formulár ani thank-you page.

Texty a skoršie marketingové rozhodnutia sú v `docs/software-funnel-brainstorm.md`. Zadanie na formulár a meranie je v `docs/software-funnel-implementation.md` a tento vizuálny prepis doň nepatrí.

## Čo agent vidí

Obsah je už použiteľný. Stránka ale pôsobí ako naformátovaná technická dokumentácia, nie ako landing pre človeka, ktorý prišiel z Meta reklamy.

Problém nie je dark mode. Problém je monotónnosť: rovnaká šírka, rovnaké tmavé pozadie, rovnaké boxy, rytmus text → box → box → box → text. Oko nedostáva nový impulz a stránka nemá výrazné momenty. Návštevník skenuje headline, CTA a vizuály, takže hierarchia a scannability rozhodujú.

Agent odhaduje, že to, čo vidno na screenshotoch, je zhruba 80 % presentation a hierarchia a 20 % text. Copy sa zatiaľ zásadne nemení.

Vizuálny smer: technical, premium, personal, calm. Senior engineer, ktorému sa dá zveriť problém za $95/h. Nie „cool AI agency“.

Nerobiť: gradienty všade, stock fotky programátorov, animované blobs, vymyslené testimonials, carousel, video background, veľa farieb, generické AI ilustrácie.

Po redesigne skontrolovať mobil skôr než desktop. Pre tento funnel je mobil pravdepodobne dôležitejší.

## Stav

Úlohy z časti nižšie sú spravené v `software/index.html` a `software/funnel.css`. Formulár a thank-you page ostali v pôvodnej šírke a so svojimi kartami. Body v diskusii (fotka, technology strip, availability, škrty textu, výsledkové lockupy, kratšie vety) sa nerobili.

## Úlohy, ktoré vieme urobiť hneď

Netreba nový asset, nový claim ani zmenu viet. Pracuje sa s tým, čo už je v `software/index.html`. Mení sa len prezentácia v `software/funnel.css` a rozloženie landingu. Formulár a thank-you page sa nechajú úzke, ako sú.

Landing môže byť širší než dnešných 820 px, inak sa dva stĺpce a mriežka 3×2 nezmestia. Accent ostáva dnešná `#7dd3fc`.

1. **Rytmus sekcií.** Sekcie nemajú vyzerať ako jeden opakovaný pattern. Väčší vertikálny odstup a výraznejšie H2. Poradie a charakter:
   - Hero: tmavé pozadie.
   - Capabilities: mierne svetlejší background.
   - Case studies: tmavší background, iný než capability karty.
   - How I work: bez kariet.
   - About: osobnejší blok, stále bez fotky, kým nie je súbor.
   - Záverečné CTA: celá plocha v accent farbe, tmavý text, nie ďalší tmavý box.
2. **Capabilities, mriežka 3×2.** Šesť kariet ostáva, na desktope v dvoch stĺpcoch a troch radoch, na mobile pod sebou. Existujúce nadpisy, problem statement a dve vety sa neprepisujú. K nadpisu patrí malá line ikona (inline SVG), nie emoji. Sekundárne CTA `Tell me what you need` ostáva.
3. **Case studies ako dôkaz, nie ako ďalšie capability karty.** Štyri existujúce príklady ostanú v inom vizuálnom vzore než capabilities: väčší nadpis, kontext (banking, insurance, vlastný produkt, produkt od nápadu) oddelený od odseku. Vety sa neprepisujú a nevymýšľajú sa nové výsledkové lockupy. Tie sú v diskusii nižšie.
4. **How I work, timeline krokov.** Päť existujúcich krokov na desktope v jednej vodorovnej línii (`01` → `05`), na mobile pod sebou. Text krokov ostáva. Blok nad krokmi (`No fixed-price guessing`, sadzba, odhad a weekly limit) zatiaľ ostáva celý. Je to rozhodnutá ponuka, nie dekorácia. Či sa skráti, je v diskusii.
5. **Trust pod hero ako tri krátke signály.** Z existujúcej vety spraviť tri položky: 20 years of experience, EU based, remote with international clients. Fakty sa nemenia.
6. **Záverečné CTA ako accent sekciu.** Nadpis, odseky, cena a tlačidlo ostávajú doslovne. Mení sa len plocha: svetlý turquoise band na celú šírku sekcie, aby stránka mala koniec.
7. **Mobilná kontrola po úprave.** Prejsť `/software/` na šírke telefónu: hero, 3×2 zložené do jedného stĺpca, case studies, zvislá timeline, accent CTA, žiadny vodorovný scroll.

## Úlohy, ktoré ešte potrebujú diskusiu

1. **Fotka Michala.** V repozitári žiadna fotografia nie je. Agent považuje dvojstĺpcový hero s reálnou fotkou za najväčší rozdiel: vľavo dnešný message, vpravo profesionálna fotka, pod ňou Michal Mihálik, Senior Software Engineer, 20 years of experience. Rovnaký súbor chce aj v About. Stock, ilustrácia ani placeholder sa nemajú použiť. Treba dodať súbor, orez a alt text. Kým fotka nie je, hero ostáva jeden stĺpec. Layout s fotkou je inak popísaný a nečeká na ďalší návrh.
2. **Technology strip.** Návrh medzi capabilities a case studies: `CORE EXPERIENCE` a jeden riadok `.NET`, `C#`, `Java`, `SQL`, `REST APIs`, `Node.js`, `TypeScript`, `LLMs`, `AWS`. Nie je v agentovom balíku priorít a ide proti skoršiemu rozhodnutiu, že landing nie je zoznam technológií. Treba povedať, či strip vôbec chceme, a či je každý názov v rade férový trust signál.
3. **„Available for new projects“ v hlavičke.** Je len v náčrte above-the-fold, nie v priorite. Je to prevádzkové tvrdenie: musí byť pravda a musí sa dať zložiť, keď kapacita nebude. Do implementácie hneď nepatrí.
4. **Koľko textu v How I work zmazať.** Timeline krokov ide hneď. Agent k nej chce nanajvýš jednu vetu. Dnešná sekcia nad krokmi vysvetľuje, prečo hodinová sadzba, nie fixed price. To je produktové rozhodnutie z brainstormu. Treba povedať, či ten blok ostane nad timeline, alebo ktorá jedna veta ho nahradí.
5. **About: štatistiky a škrt.** Agent chce namiesto piatich odsekov fotku, meno, jednu vetu o 20 rokoch a odvetviach a štyri skratky: 20 years / professional experience, Backend → AI / broad engineering background, EU based / working internationally, End-to-end / analysis → production, plus 1–2 krátke odseky. Skratky sú nový copy, nie len zalomenie. Treba potvrdiť znenie štyroch skratiek a ktoré dnešné odseky ostanú.
6. **Veľké výsledkové lockupy v case studies.** Agent kreslí prvý príklad ako `MINUTES → NEAR-INSTANT` a druhý ako `REST · SOAP · WCF · MESSAGING`. Tretí a štvrtý lockup nenavrhuje. Zväčšenie výsledku je hlasnejší claim než dnešný nadpis. Case studies sa majú držať potvrdených viet. Kým nie sú štyri lockupy schválené, karty používajú dnešné nadpisy.
7. **Krátke varianty hero a záverečného CTA.** V náčrte je kratší podnadpis („from backend systems to production AI“), cena „From $95/hour“ a iný záverečný nadpis „Have a software problem?“. V priorite agent zároveň píše, že copy sa zatiaľ zásadne nemení. Kým sa nevyberie variant, ostávajú dnešné vety a mení sa len plocha a rozloženie.
