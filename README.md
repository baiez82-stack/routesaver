# RouteSaver

Beta sperimentale di un comparatore di percorsi che mette in relazione tempo di viaggio e costo reale dello spostamento.

## Obiettivo
Confrontare percorsi alternativi mostrando:
- durata e distanza
- carburante o energia stimata con consumo dinamico per tipo di strada
- pedaggi stimati
- risparmio rispetto al percorso più veloce
- limite massimo di minuti extra accettati dall'utente

## Privacy
La beta non richiede account, non integra analytics o advertising e salva le preferenze solo nel browser. La posizione viene usata soltanto su richiesta esplicita.

## Dati
- Routing/geocoding: servizi basati su OpenStreetMap
- Catalogo veicoli e consumi: European Environment Agency (EEA), dataset 2025 provisional
- Carburanti e distributori: open data MIMIT, aggiornamento quotidiano
- Colonnine: OpenStreetMap/Overpass, senza disponibilità o prezzi live garantiti
- Trasporto pubblico: Transitous/MOTIS, solo beta non commerciale
- Pedaggi: stima beta, non tariffa ufficiale

La selezione Marca → Modello usa una sola fonte per i dati auto: EEA. RouteSaver combina il valore WLTP del modello con i dati real-world OBFCM EEA quando esiste un riferimento compatibile per produttore/alimentazione. Per EV e plug-in, quando sono disponibili autonomia elettrica e consumo elettrico EEA, ricava inoltre una capacità energetica equivalente e la compila automaticamente nel calcolo. Il numero di veicoli alla base del riferimento viene mostrato nell'interfaccia. Tutti i valori restano modificabili manualmente.

## Consumo dinamico
RouteSaver parte dal consumo base del modello selezionato nel catalogo EEA. Se disponibile, la baseline viene prima corretta con il rapporto real-world/WLTP osservato nei dati OBFCM EEA del produttore e della stessa alimentazione; per le plug-in viene inoltre evitato di usare il basso WLTP charge-weighted come se fosse il consumo del motore termico. In alternativa l'utente può inserire il proprio consumo reale. RouteSaver analizza poi le classi stradali e le velocità di riferimento dei tratti restituite dal routing. Il percorso viene suddiviso in urbano, extraurbano e autostrada/strade veloci e in fasce di velocità; la previsione viene calibrata in modo differente per benzina, diesel, full hybrid, plug-in hybrid ed elettrico. Se il dettaglio dei tratti non è disponibile, l'interfaccia lo segnala e usa un profilo stimato.

## Soste lungo il percorso
Per benzina, diesel, hybrid e plug-in RouteSaver cerca distributori con prezzo MIMIT vicino alla linea del percorso. Per EV stima se serve una ricarica usando batteria iniziale, capacità e consumo previsto, quindi cerca una colonnina vicino al punto di sosta teorico. Per le plug-in può mostrare una ricarica opzionale vicino al punto in cui la batteria prevista si esaurisce.

Le distanze dai distributori sono geometriche e non equivalgono al tempo effettivo di deviazione. Le colonnine OpenStreetMap non garantiscono disponibilità, prezzo o potenza in tempo reale.

## Stato
MVP/beta privata di test.


## Auto vs trasporto pubblico
Per i viaggi medio-lunghi la beta può confrontare il percorso auto consigliato con un itinerario pubblico porta-a-porta. Il confronto considera durata, cambi, linee/mezzi, numero di viaggiatori, parcheggio auto opzionale e prezzo biglietto per persona quando disponibile o inserito manualmente.

Transitous/MOTIS viene usato esclusivamente nella beta non commerciale e con una singola richiesta per calcolo. Per una futura versione commerciale servirà una fonte tariffaria/routing con licenza e condizioni compatibili (ad esempio un partner/API commerciale).
## Predisposizione incassi
Identità del fornitore e ipotesi fiscale domestica centralizzate in `billing/config.mjs`. Pagamenti disattivati; nessun checkout, archivio clienti o invio SdI attivo. Utility di riconciliazione e bozze con test (`node --test tests/billing.test.mjs`). Procedura di completamento: `docs/billing-readiness.md`.

### Percorsi, traffico e navigazione

Il motore condiviso è `assets/route-core.js`. Eseguire `node --test tests/*.test.*` per le regressioni economiche e di navigazione.

- Ogni link Google Maps contiene fino a tre punti della traccia effettiva. Sono passaggi/soste, non un vincolo sulla geometria: l'app esterna può ricalcolare. Waze e Mappe Apple ricevono la destinazione; il GPX conserva tutti i punti per applicazioni compatibili.
- I nomi dei percorsi non influenzano più consumi o pedaggi. Senza metadati stradali, il profilo è esplicitamente stimato. La traccia Valhalla viene accettata per il profilo solo se la sua lunghezza è coerente; un pedaggio non determinato rimane sconosciuto.
- Un pedaggio mancante non è zero. Il confronto economico completo resta sospeso finché non è disponibile o inserito dall'utente. I km a pedaggio rilevati da TomTom sulle tratte italiane usano ancora un coefficiente **indicativo**, non le tariffe dei concessionari. Vignette, traghetti e treni auto richiedono un importo verificato.
- La versione predefinita **non ha traffico live**. Per abilitarlo impostare `tomtomApiKey` in `assets/routing-config.js` con una chiave browser TomTom abilitata alla Routing API v1, limitata al dominio del sito e con quote/limiti verificati. La chiave browser è pubblica: non usare credenziali private. Per un servizio commerciale valutare un proxy con controllo delle richieste e verificare condizioni e costi del fornitore.
- TomTom restituisce nella stessa risposta geometria e tempi con traffico, per partenza immediata. Due richieste per confronto: alternative e percorso che evita i pedaggi. Il ritardo non viene sommato nuovamente alla durata. Se una delle richieste fallisce si usa un intero insieme di percorsi senza traffico, con avviso; non si mescolano tempi di un fornitore e tracce di un altro.
- Il maggior consumo durante i rallentamenti è una stima marginale: 0,8 l/h benzina, 0,6 diesel, 0,2 full hybrid, 0,6 sulla quota termica PHEV, 1 kW ausiliari EV/quota elettrica PHEV. Questi coefficienti interni **non sono dati EEA né una calibrazione sperimentale**, e non modellano completamente stop/start, accelerazioni, temperatura o recupero energetico. Il PHEV rispetta la batteria disponibile con riserva del 10%. Il modello richiede validazione con viaggi misurati.
- Dopo cinque minuti il confronto con traffico chiede aggiornamento e sospende il consiglio. Nessuna promessa di risparmio garantito o navigazione CarPlay nativa.

Documentazione ufficiale: [TomTom Routing v1](https://docs.tomtom.com/routing-api/documentation/tomtom-maps/v1/calculate-route), [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started), [Waze deep links](https://developers.google.com/waze/deeplinks/), [Apple Map Links](https://developer.apple.com/library/archive/featuredarticles/iPhoneURLScheme_Reference/MapLinks/MapLinks.html).
