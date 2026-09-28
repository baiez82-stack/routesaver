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
- Pedaggi: stima beta, non tariffa ufficiale

La selezione Marca → Modello usa una sola fonte per i dati auto: EEA. RouteSaver combina il valore WLTP del modello con i dati real-world OBFCM EEA quando esiste un riferimento compatibile per produttore/alimentazione. Il numero di veicoli alla base del riferimento viene mostrato nell'interfaccia. Il valore resta sempre modificabile manualmente.

## Consumo dinamico
RouteSaver parte dal consumo base del modello selezionato nel catalogo EEA. Se disponibile, la baseline viene prima corretta con il rapporto real-world/WLTP osservato nei dati OBFCM EEA del produttore e della stessa alimentazione; per le plug-in viene inoltre evitato di usare il basso WLTP charge-weighted come se fosse il consumo del motore termico. In alternativa l'utente può inserire il proprio consumo reale. RouteSaver analizza poi le classi stradali e le velocità di riferimento dei tratti restituite dal routing. Il percorso viene suddiviso in urbano, extraurbano e autostrada/strade veloci e in fasce di velocità; la previsione viene calibrata in modo differente per benzina, diesel, full hybrid, plug-in hybrid ed elettrico. Se il dettaglio dei tratti non è disponibile, l'interfaccia lo segnala e usa un profilo stimato.

## Soste lungo il percorso
Per benzina, diesel, hybrid e plug-in RouteSaver cerca distributori con prezzo MIMIT vicino alla linea del percorso. Per EV stima se serve una ricarica usando batteria iniziale, capacità e consumo previsto, quindi cerca una colonnina vicino al punto di sosta teorico. Per le plug-in può mostrare una ricarica opzionale vicino al punto in cui la batteria prevista si esaurisce.

Le distanze dai distributori sono geometriche e non equivalgono al tempo effettivo di deviazione. Le colonnine OpenStreetMap non garantiscono disponibilità, prezzo o potenza in tempo reale.

## Stato
MVP/beta privata di test.
