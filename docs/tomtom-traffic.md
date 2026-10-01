# RouteSaver — attivazione traffico TomTom

## Stato tecnico

RouteSaver usa la Routing API v1 di TomTom per ottenere geometria, durata e ritardo live dalla stessa risposta. Se la chiave non è disponibile o la richiesta fallisce, l'app torna ai percorsi OpenStreetMap e indica che il traffico non è disponibile.

La chiave non viene salvata nel repository. Durante il deploy GitHub Pages, il workflow sostituisce il marker presente in `assets/routing-config.js` con il secret `TOMTOM_API_KEY` soltanto nell'artefatto pubblicato.

La chiave distribuita a un browser può sempre essere letta dagli strumenti di sviluppo. Per questo, prima dell'attivazione deve essere limitata nel portale TomTom.

## Configurazione TomTom richiesta

Creare una chiave separata per RouteSaver e impostare:

- prodotto consentito: Routing API;
- dominio consentito: `baiez82-stack.github.io`;
- nessun wildcard più ampio del necessario;
- monitoraggio dell'utilizzo e delle quote;
- rotazione della chiave in caso di abuso.

Il path `/routesaver/` non va inserito nella whitelist: TomTom valida il dominio/origine, non il percorso della pagina.

## Secret GitHub

Nel repository `baiez82-stack/routesaver` creare il repository secret:

```text
TOMTOM_API_KEY
```

Il valore deve essere la chiave copiata dal portale TomTom. Non inserirla in file, issue, pull request, chat pubbliche o commit.

Dopo aver salvato il secret, eseguire nuovamente il workflow `Deploy RouteSaver to GitHub Pages` tramite `workflow_dispatch`, oppure effettuare un nuovo commit su `main`.

## Verifica automatica

Il deploy:

1. inserisce la chiave nell'artefatto GitHub Pages senza commetterla;
2. verifica la sintassi dell'app e avvia tutti i test;
3. esegue una richiesta TomTom Verona → Milano con traffico live;
4. verifica che la risposta contenga distanza, durata e `trafficDelayInSeconds`;
5. verifica che il CORS autorizzi `https://baiez82-stack.github.io`;
6. pubblica il sito soltanto se i controlli passano.

Se il secret manca, il deploy resta possibile ma mostra un warning e il traffico live rimane disattivato.

## Evoluzione commerciale

La soluzione con chiave browser limitata per dominio è adatta alla beta controllata. Prima di aumentare il traffico o attivare clienti B2B, spostare le chiamate TomTom dietro un proxy/backend con:

- chiave in variabile d'ambiente server-side;
- controllo dell'origine;
- rate limiting;
- monitoraggio costi e quote;
- timeout e retry controllati;
- log senza coordinate complete o credenziali;
- gestione distinta degli ambienti test e produzione.
