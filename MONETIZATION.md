# RouteSaver — Piano di monetizzazione e validazione

## Tesi

RouteSaver non deve monetizzare vendendo dati di posizione o riempiendo l'interfaccia di pubblicità. Il valore economico è aiutare persone e imprese a valutare il compromesso tra tempo aggiuntivo e costo stimato del viaggio.

Le linee di ricavo previste sono:

1. abbonamento B2C Plus;
2. abbonamento B2B per flotte leggere;
3. API e white-label dopo la validazione;
4. commissioni affiliate o lead commerciali, sempre separati dal ranking dei risultati.

## Posizionamento

ViaMichelin e altri strumenti mostrano già carburante, pedaggi e itinerari economici. RouteSaver deve differenziarsi con una domanda semplice e controllabile dall'utente:

> **Quanti minuti in più sei disposto a guidare per spendere meno?**

RouteSaver non viene venduto come navigatore. È il comparatore economico da usare prima della partenza; la guida resta affidata al navigatore scelto dall'utente.

## Offerta di validazione

### Free — 0 EUR durante la beta

Obiettivo: acquisizione e verifica dell'utilità reale.

- confronto tra percorsi disponibili;
- limite personale di minuti extra;
- costo stimato del viaggio;
- consumo dinamico per percorso;
- prezzi carburante MIMIT;
- soste carburante o ricarica disponibili in beta;
- un veicolo;
- nessun account obbligatorio;
- utilizzo soggetto a fair use e disponibilità dei servizi esterni.

### Plus Founding

Proposta di lancio:

- 19,99 EUR per il primo anno;
- disponibilità limitata ai primi 100 utenti;
- nessun pagamento finché infrastruttura, condizioni e fatturazione non sono pronte;
- richiesta di accesso via email, non vincolante.

Prezzo obiettivo successivo:

- 29,99 EUR/anno;
- 3,49 EUR/mese.

Funzioni previste:

- più veicoli salvati;
- storico viaggi e risparmio cumulato;
- tratte preferite e ricorrenti;
- profilo consumi calibrato dall'utente;
- preferenze rifornimento e ricarica;
- confronto avanzato delle soste;
- export PDF/CSV;
- accesso anticipato alle nuove funzioni.

### Business Pilot

Prima offerta commerciale da validare:

- 99 EUR per 90 giorni;
- fino a 10 veicoli;
- configurazione iniziale assistita;
- dashboard costo/km;
- tratte ricorrenti;
- report mensile;
- export per amministrazione;
- assistenza diretta durante il pilot.

Prezzo obiettivo dopo il pilot, soltanto se il prodotto dimostra valore:

- 39 EUR/mese;
- oppure 390 EUR/anno;
- eventuali veicoli aggiuntivi da quotare dopo aver misurato il costo reale del servizio.

Target iniziali:

- agenti di commercio;
- installatori e manutentori;
- tecnici in trasferta;
- fotografi e videomaker;
- imprese con 2–10 veicoli;
- studi professionali con trasferte ricorrenti;
- piccole attività turistiche o di noleggio.

I corrieri e le flotte complesse non sono il target iniziale: richiedono ottimizzazione multistop, dispatching, tracciamento e funzioni operative che la beta non offre.

### API e white-label

Solo dopo la validazione di utilizzo e costi:

- Starter API: ipotesi 99 EUR/mese;
- Pro/API e white-label: ipotesi da 299 EUR/mese;
- enterprise: preventivo.

## Regola commerciale

Un partner sponsorizzato non deve mai risultare migliore soltanto perché paga. Eventuali proposte di ricarica, telepedaggio, parcheggio, assicurazione o noleggio devono essere:

- separate dal ranking dei percorsi;
- identificate chiaramente come sponsorizzate o affiliate;
- misurate senza usare posizione individuale o storico identificabile per pubblicità comportamentale.

## Cosa non monetizzare

- posizione individuale;
- storico spostamenti identificabile;
- vendita di dati personali;
- ranking alterato da sponsor;
- promesse di risparmio garantito.

## Checkout

Nella beta non è attivo alcun checkout.

Quando tutti i requisiti saranno confermati, la prima integrazione prevista è Stripe Checkout o Payment Links, con:

- pagamento ospitato dal provider;
- portale cliente per gestione del piano;
- webhook verificato lato server;
- emissione e riconciliazione documenti fiscali;
- nessuna chiave privata nel frontend;
- condizioni economiche mostrate prima dell'acquisto.

L'attivazione resta bloccata finché `billing/config.mjs` non segnala come completati i controlli fiscali, legali, privacy, fornitori, fatturazione e backend.

## Obiettivi di validazione

Prima di investire in app native o advertising:

- almeno 50 persone effettuano un calcolo reale;
- almeno 30% degli utenti test torna a effettuare una seconda ricerca entro 30 giorni;
- almeno 10 richieste qualificate per Plus;
- almeno 3 aziende accettano di discutere un Business Pilot;
- almeno un pilot produce dati misurabili su utilizzo e risparmio stimato;
- costo API medio per calcolo conosciuto;
- nessuna dipendenza commerciale da endpoint pubblici senza SLA.

## Scenari economici indicativi

Questi sono esercizi di validazione, non previsioni.

- 100 Founding × 19,99 EUR = 1.999 EUR lordi nel primo anno;
- 10 clienti Business × 39 EUR × 12 mesi = 4.680 EUR di ricavi ricorrenti annui;
- totale iniziale dei due scenari: 6.679 EUR lordi, prima di commissioni, rimborsi, API, imposte e costi operativi.

A scala maggiore il potenziale principale è B2B/API, ma soltanto dopo aver dimostrato domanda e affidabilità.

## Piano di lancio

### Fase 0 — beta pubblica gratuita

- GitHub Pages;
- open data;
- nessun advertising;
- nessun pagamento;
- pagina piani con candidature via email;
- raccolta di test qualitativi e tratte reali.

### Fase 1 — validazione dell'offerta

- primi 100 potenziali Founding Member;
- selezione di 3–5 aziende pilota;
- demo costruita su tratte reali del cliente;
- misurazione di utilizzo, errori, costi provider e valore percepito;
- nessuna spesa ads finché non emerge uso ripetuto.

### Fase 2 — infrastruttura commerciale

- dominio proprietario;
- backend account e organizzazioni;
- provider routing/geocoding con condizioni commerciali compatibili;
- pedaggi affidabili o chiaramente verificabili;
- Stripe e fatturazione;
- privacy e termini commerciali aggiornati;
- rate limiting, monitoraggio e backup.

### Fase 3 — acquisizione organica

- contenuti SEO su costo viaggio e confronto autostrada/statale;
- Reel e TikTok con casi reali, senza promettere risultati garantiti;
- LinkedIn orientato a tecnici, commerciali e flotte leggere;
- pagine per tratte ad alta domanda;
- referral soltanto dopo la prima retention misurata.

### Fase 4 — distribuzione

- PWA installabile prima delle app native;
- store soltanto dopo richiesta concreta degli utenti e unit economics sostenibili;
- API/white-label solo dopo stabilità del servizio.

## Vincolo tecnico

Gli endpoint pubblici usati nella beta non sono una base sufficiente per traffico commerciale significativo. Prima di far pagare o aumentare il volume occorre passare a provider con condizioni compatibili, quote controllate e, dove necessario, SLA o infrastruttura propria.

## Incassi tramite attività esistente

RouteSaver è predisposto come progetto dell'attività individuale di Samuele Baietta. Pagamenti disattivati. Prima della vendita devono essere confermati dal professionista fiscale almeno compatibilità dell'attività, codice attività, fatturazione, contributi e impatto del fatturato complessivo sul regime applicato.
