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
- Carburanti: open data MIMIT
- Pedaggi: stima beta, non tariffa ufficiale

La selezione Marca → Modello usa una sola fonte per i dati auto: EEA. I valori vengono aggregati per modello e alimentazione e restano modificabili manualmente.

## Consumo dinamico
RouteSaver parte dal consumo base del modello selezionato nel catalogo EEA (oppure da quello inserito manualmente) e analizza le classi stradali e le velocità di riferimento dei tratti restituite dal routing. Il percorso viene suddiviso in urbano, extraurbano e autostrada/strade veloci e in fasce di velocità; la previsione viene calibrata in modo differente per benzina, diesel, full hybrid, plug-in hybrid ed elettrico. Se il dettaglio dei tratti non è disponibile, l'interfaccia lo segnala e usa un profilo stimato.

## Stato
MVP/beta privata di test.
