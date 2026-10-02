# RouteSaver

Beta pubblica gratuita di un comparatore di percorsi che mette in relazione tempo di viaggio e costo stimato dello spostamento.

> **Posizionamento:** non è un altro navigatore. È il comparatore economico da usare prima di partire: l'utente decide quanti minuti in più è disposto a guidare e RouteSaver confronta le alternative disponibili.

## Obiettivo

Confrontare percorsi alternativi mostrando:

- durata e distanza;
- carburante o energia stimata con consumo dinamico per tipo di strada;
- pedaggi stimati o da verificare;
- risparmio rispetto al percorso più veloce;
- limite massimo di minuti extra accettati dall'utente;
- apertura del viaggio in navigatori esterni, con avvertenza sul possibile ricalcolo.

## Stato del prodotto

- beta pubblica gratuita;
- nessun account obbligatorio;
- nessun checkout o pagamento attivo;
- manifestazioni di interesse Founding e Business raccolte via email;
- infrastruttura e licenze commerciali ancora da completare prima della vendita.

La pagina `plus.html` presenta l'offerta di validazione:

- **Free:** uso gratuito durante la beta;
- **Plus Founding:** proposta da 19,99 EUR per il primo anno, riservata ai primi 100 utenti quando il servizio commerciale sarà pronto;
- **Business Pilot:** proposta da 99 EUR per 90 giorni, fino a 10 veicoli;
- dopo il pilot: obiettivo 39 EUR/mese o 390 EUR/anno, da confermare solo dopo la validazione.

Le richieste inviate dalla pagina non sono ordini e non comportano addebiti.

## Privacy

La beta non richiede account, non integra analytics o advertising e salva le preferenze di viaggio nel browser. La posizione viene usata soltanto su richiesta esplicita. Il sito è pubblicato tramite GitHub Pages e comunica direttamente con i servizi cartografici necessari alla funzione richiesta.

Contatto pubblico: `dovesibaeccociqua@gmail.com`.

## Dati

- Routing/geocoding: servizi basati su OpenStreetMap;
- catalogo veicoli e consumi: European Environment Agency (EEA), dataset 2025 provisional;
- carburanti e distributori: open data MIMIT, aggiornamento quotidiano;
- colonnine: OpenStreetMap/Overpass, senza disponibilità o prezzi live garantiti;
- trasporto pubblico: Transitous/MOTIS, soltanto nella beta gratuita non commerciale;
- pedaggi: stima beta, non tariffa ufficiale.

La selezione Marca → Modello usa una sola fonte per i dati auto: EEA. RouteSaver combina il valore WLTP del modello con i dati real-world OBFCM EEA quando esiste un riferimento compatibile per produttore e alimentazione. Per EV e plug-in, quando sono disponibili autonomia elettrica e consumo elettrico EEA, ricava inoltre una capacità energetica equivalente e la compila automaticamente nel calcolo. Il numero di veicoli alla base del riferimento viene mostrato nell'interfaccia. Tutti i valori restano modificabili manualmente.

## Consumo dinamico

RouteSaver parte dal consumo base del modello selezionato nel catalogo EEA. Se disponibile, la baseline viene prima corretta con il rapporto real-world/WLTP osservato nei dati OBFCM EEA del produttore e della stessa alimentazione; per le plug-in viene evitato di usare il basso WLTP charge-weighted come se fosse il consumo del motore termico. In alternativa l'utente può inserire il proprio consumo reale.

RouteSaver analizza quindi classi stradali e velocità di riferimento dei tratti restituite dal routing. Il percorso viene suddiviso in urbano, extraurbano e autostrada/strade veloci e in fasce di velocità; la previsione viene calibrata in modo differente per benzina, diesel, full hybrid, plug-in hybrid ed elettrico. Se il dettaglio dei tratti non è disponibile, l'interfaccia lo segnala e usa un profilo stimato.

## Soste lungo il percorso

Per benzina, diesel, hybrid e plug-in RouteSaver cerca distributori con prezzo MIMIT vicino alla linea del percorso. Per EV stima se serve una ricarica usando batteria iniziale, capacità e consumo previsto, quindi cerca una colonnina vicino al punto di sosta teorico. Per le plug-in può mostrare una ricarica opzionale vicino al punto in cui la batteria prevista si esaurisce.

Le distanze dai distributori sono geometriche e non equivalgono al tempo effettivo di deviazione. Le colonnine OpenStreetMap non garantiscono disponibilità, prezzo o potenza in tempo reale.

## Auto vs trasporto pubblico

Per i viaggi medio-lunghi la beta può confrontare il percorso auto consigliato con un itinerario pubblico porta-a-porta. Il confronto considera durata, cambi, linee o mezzi, numero di viaggiatori, parcheggio auto opzionale e prezzo del biglietto per persona quando disponibile o inserito manualmente.

Transitous/MOTIS viene usato esclusivamente nella beta gratuita non commerciale e con una singola richiesta per calcolo. Per una futura versione commerciale servirà una fonte tariffaria/routing con licenza e condizioni compatibili.

## Predisposizione incassi

Identità del fornitore, contatto e ipotesi fiscale domestica sono centralizzati in `billing/config.mjs`. I pagamenti restano disattivati; non esistono checkout, archivio clienti o invio SdI attivi.

Prima di attivare qualsiasi incasso devono risultare verificati almeno:

- compatibilità dell'attività e inquadramento fiscale;
- dati completi del fornitore;
- condizioni commerciali, recesso, rinnovi e disdetta;
- licenze e condizioni dei provider dati;
- informativa privacy aggiornata alla nuova infrastruttura;
- fatturazione e riconciliazione;
- backend webhook verificato.

Utility di riconciliazione e bozze con test: `node --test tests/billing.test.mjs`. Procedura di completamento: `docs/billing-readiness.md`.

## Percorsi, traffico e navigazione

Il motore condiviso è `assets/route-core.js`. Eseguire `node --test tests/*.test.*` per le regressioni economiche, di navigazione e di lancio.

- Ogni link Google Maps contiene fino a tre punti della traccia effettiva. Sono passaggi o soste, non un vincolo sulla geometria: Google può ricalcolare. Il GPX conserva tutti i punti per applicazioni compatibili. Waze e Mappe Apple non sono proposti perché non rispettano la traccia RouteSaver.
- I nomi dei percorsi non influenzano consumi o pedaggi. Senza metadati stradali, il profilo è esplicitamente stimato. La traccia Valhalla viene accettata per il profilo solo se la sua lunghezza è coerente; un pedaggio non determinato rimane sconosciuto.
- Un pedaggio mancante non è zero. Il confronto economico completo resta sospeso finché non è disponibile o inserito dall'utente. I km a pedaggio rilevati da TomTom sulle tratte italiane usano ancora un coefficiente indicativo, non le tariffe dei concessionari. Vignette, traghetti e treni auto richiedono un importo verificato.
- Il traffico live usa un proxy serverless: il browser non riceve mai la chiave TomTom. La funzione `api/tomtom.mjs` accetta richieste solo dal dominio pubblico RouteSaver, con parametri rigidamente validati; la credenziale va salvata su Vercel come variabile server-only `TOMTOM_API_KEY`. L'URL pubblico del proxy si configura in `assets/routing-config.js`. Verificare sempre quote, limiti e condizioni del fornitore.
- TomTom restituisce nella stessa risposta geometria e tempi con traffico, per partenza immediata. Due richieste per confronto: alternative e percorso che evita i pedaggi. Il ritardo non viene sommato nuovamente alla durata. Se una delle richieste fallisce si usa un intero insieme di percorsi senza traffico, con avviso; non si mescolano tempi di un fornitore e tracce di un altro.
- Il maggior consumo durante i rallentamenti è una stima marginale: 0,8 l/h benzina, 0,6 diesel, 0,2 full hybrid, 0,6 sulla quota termica PHEV, 1 kW ausiliari EV/quota elettrica PHEV. Questi coefficienti interni **non sono dati EEA né una calibrazione sperimentale**, e non modellano completamente stop/start, accelerazioni, temperatura o recupero energetico. Il PHEV rispetta la batteria disponibile con riserva del 10%. Il modello richiede validazione con viaggi misurati.
- Dopo cinque minuti il confronto con traffico chiede aggiornamento e sospende il consiglio. Nessuna promessa di risparmio garantito o navigazione CarPlay nativa.

## Distribuzione

Il ramo `main` viene validato e pubblicato automaticamente tramite GitHub Actions e GitHub Pages. La beta non è ancora distribuita tramite App Store o Google Play; la priorità è validare uso ripetuto e disponibilità a pagare prima di sviluppare applicazioni native.
