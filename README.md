# RouteSaver

Beta sperimentale di un comparatore di percorsi che mette in relazione tempo di viaggio e costo reale dello spostamento.

## Obiettivo
Confrontare percorsi alternativi mostrando:
- durata e distanza
- carburante o energia stimata
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

## Stato
MVP/beta privata di test.
