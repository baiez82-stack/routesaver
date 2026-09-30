# RouteSaver - Piano di monetizzazione

## Tesi
RouteSaver non deve monetizzare vendendo dati di posizione o riempiendo l'interfaccia di pubblicità. Il valore economico è nel far risparmiare denaro e tempo su ogni viaggio e nel trasformare questo risparmio in:
1. abbonamenti B2C;
2. ricavi B2B per veicolo;
3. API / white-label;
4. commissioni affiliate o lead commerciali, sempre separate dal ranking dei risultati.

## Benchmark
- ViaMichelin offre già costo carburante, pedaggi e itinerario economico: RouteSaver deve differenziarsi con il vincolo esplicito "quanti minuti sei disposto a perdere per risparmiare?", consumo previsto per auto/percorso e confronto soste/rifornimento.
- ABRP utilizza un modello freemium: core gratuito e Premium. Nel 2026 ABRP mostra Premium a 5 EUR/mese e dichiara milioni di utenti.
- Chargeprice dichiara di poter ricevere commissioni da link affiliati senza alterare l'ordinamento per prezzo.
- Fleetio utilizza pricing per veicolo, da circa 4 USD/veicolo/mese per il piano Essential.
- Stripe Standard in Italia non richiede canone mensile e applica 1,5% + 0,25 EUR alle carte standard SEE.

Fonti:
- https://www.viamichelin.com/routes
- https://abetterrouteplanner.com/home
- https://www.chargeprice.app/
- https://www.fleetio.com/pricing
- https://stripe.com/it/pricing

## Offerta RouteSaver

### Free - 0 EUR
Obiettivo: acquisizione.
- confronto Veloce / Bilanciato / Risparmio;
- costo stimato viaggio;
- consumo dinamico per percorso;
- prezzi carburante MIMIT;
- soste carburante / ricarica disponibili in beta;
- un veicolo;
- nessun account obbligatorio.

### Plus
Prezzo di lancio:
- Founding: 19,99 EUR / anno per i primi 500 utenti;
- Standard: 29,99 EUR / anno;
- mensile: 3,99 EUR / mese.

Funzioni:
- più veicoli salvati;
- storico viaggi e risparmio cumulato;
- profilo consumi calibrato dall'utente;
- preferenze rifornimento e ricarica;
- confronto avanzato delle soste;
- export PDF/CSV;
- niente sponsorizzazioni nel flusso principale;
- funzioni premium future: traffico/meteo/live charger quando disponibili.

### Business
Prezzo iniziale da validare:
- 39 EUR / mese fino a 10 veicoli;
- 2,90 EUR / mese per ogni veicolo aggiuntivo.

Funzioni:
- flotta e profili veicolo;
- politiche di costo;
- report mensile;
- export;
- confronto tratte ricorrenti;
- utenti multipli;
- dashboard costo/km.

### API / White label
Dopo validazione:
- Starter API: 99 EUR / mese;
- Pro/API e white-label: da 299 EUR / mese;
- enterprise: preventivo.

Clienti target:
- NCC;
- piccole flotte commerciali;
- autonoleggi;
- travel management;
- aziende con tecnici/commerciali in trasferta;
- comparatori e portali travel.

## Affiliate / Lead
Da attivare solo dopo traffico misurabile:
- operatori di ricarica;
- abbonamenti/tariffe EV;
- pedaggi/telepedaggio;
- parcheggi;
- assicurazioni auto;
- noleggio.

Regola prodotto: un partner sponsorizzato non deve mai risultare "migliore" solo perché paga. La raccomandazione economica resta indipendente. Gli elementi sponsorizzati devono essere marcati chiaramente.

## Cosa NON monetizzare
- posizione individuale;
- storico spostamenti identificabile;
- vendita di dati personali;
- ranking alterato da sponsor.

## Checkout
Fase 1: Stripe Payment Links / Checkout.
Motivo:
- nessun costo fisso mensile per Stripe Standard;
- rapido da integrare;
- carte e wallet;
- commissione per transazione.

A 19,99 EUR/anno una carta SEE standard costa circa 0,55 EUR di commissione Stripe.
A 29,99 EUR/anno circa 0,70 EUR.

## Obiettivi economici indicativi
Questi sono scenari, non previsioni.

- 500 Founding x 19,99 EUR = 9.995 EUR lordi una tantum nel primo anno.
- 2.000 Plus annuali x 29,99 EUR = 59.980 EUR ARR.
- 100 clienti Business x 39 EUR/mese = 46.800 EUR ARR.
- 20 clienti API x 99 EUR/mese = 23.760 EUR ARR.

Mix indicativo: circa 130.000 EUR ARR prima di IVA/imposte, commissioni, rimborsi e costi operativi.

A scala maggiore il vero upside è B2B/API: non dipendere soltanto da migliaia di utenti consumer.

## Piano di lancio a costo quasi zero

### Fase 0 - adesso
- GitHub Pages;
- open data;
- nessuna advertising;
- niente app store;
- raccogliere test qualitativi.

### Fase 1 - primi paganti
- attivare Stripe;
- aprire 500 Founding Member;
- misurare conversione e retention;
- nessuna spesa ads finché non vediamo uso ripetuto.

### Fase 2 - acquisizione organica
- contenuti SEO: costo viaggio, costo carburante tratta, conviene autostrada o statale;
- Reel/TikTok con casi reali: "+11 minuti = -7,40 EUR";
- landing per tratte ad alta domanda;
- referral: 1 mese Plus per ogni amico pagante.

### Fase 3 - B2B
- contatto diretto a NCC, agenti, imprese con flotte leggere;
- demo su loro tratte reali;
- prova gratuita 14 giorni;
- prezzo per veicolo.

## KPI
Prima di investire:
- >=30% utenti che effettuano una seconda ricerca entro 30 giorni;
- >=10% utenti attivi che cliccano su una sosta/rifornimento;
- >=3% conversione Free -> Plus come primo obiettivo di test;
- CAC organico vicino a zero nella fase iniziale;
- payback immediato sull'annuale.

## Vincolo tecnico
Gli endpoint routing/open usati nella beta non sono adatti a traffico commerciale elevato. Prima di una crescita significativa bisogna passare a infrastruttura/API con SLA o a servizi propri. Non va comprata prima che il prodotto dimostri domanda.
