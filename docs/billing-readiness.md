# Incassi RouteSaver — attività individuale

## Identità e limiti
Fornitore previsto: attività individuale di Samuele Baietta. Dati fiscali completi da configurare privatamente sul backend.
Fonte: certificato di attribuzione e modello AA9/12 del 30 aprile 2024 forniti dal titolare.
La configurazione pubblica non contiene partita IVA o indirizzo fiscale; verificarne l'attualità prima del lancio e approvare separatamente i dati da pubblicare.
Il documento indica attività marketing 73.11.02; non prova la compatibilità della vendita SaaS.
Verificare con il commercialista attività/codifica vigente, regime e trattamento B2C/B2B.
Il PDF, il codice fiscale personale, le credenziali e i dati dei clienti non vanno nel repository.

## Cosa funziona adesso
- Configurazione unica del venditore in `billing/config.mjs`, condivisa dalle pagine pubbliche.
- Pagamenti disattivati; nessun dato fiscale dei clienti raccolto.
- Utility in `billing/accounting.mjs` per riconciliazione e bozze domestiche, con importi in centesimi.
- Separazione tra incasso lordo, rimborsi, commissioni e accredito netto. Il netto non è utile disponibile né imponibile.
- Bozza RF19/N2.2 per l'ipotesi domestica forfettaria, senza IVA esposta; nessun invio SdI.
- Rivalsa INPS e riaddebito bollo senza default: serve una decisione esplicita.
- Soglia bollo strettamente superiore a 77,47 euro, 2 euro nell'ipotesi domestica supportata.
- Vendite estere escluse dalla bozza domestica; richiedono una valutazione separata.

## Flusso da implementare prima di incassare
1. Confermare dati attuali, contatto di assistenza/privacy, attività e trattamento fiscale.
2. Approvare condizioni commerciali, prezzo totale, rinnovo/disdetta e gestione recesso/rimborsi.
3. Verificare licenze commerciali dei servizi dati: Transitous è attualmente beta non commerciale.
4. Collegare un account Stripe intestato all'attività individuale, con accrediti al conto del titolare compatibile con il provider.
5. Usare Billing + Checkout per gli abbonamenti e Customer Portal per disdetta/gestione.
6. Backend separato da GitHub Pages con chiave riservata/restricted key; nessun segreto nel browser.
7. Webhook con firma verificata, gestione idempotente e archivio eventi. Attivare Plus soltanto dopo conferma server del pagamento.
8. Gestire checkout.session.completed/async_payment_succeeded secondo payment_status, invoice.paid/payment_failed e customer.subscription.*; riconciliare rimborsi e contestazioni.
9. Conservare dati minimi cliente, paese, nome/denominazione, indirizzo e identificativi fiscali necessari al caso; nessun dato carta o percorso nei record fiscali.
10. Collegare un sistema di fatturazione italiano/SdI con stato invio/esito/conservazione e gestione note di credito. La ricevuta o invoice Stripe non sostituisce automaticamente la fattura elettronica italiana.
11. Applicare il controllo di disponibilità sul server. La funzione frontend non è una barriera di sicurezza e non attiva il checkout.

Non abilitare Stripe automatic_tax indiscriminatamente: verificare regime, mercati, registrazioni e configurazione Tax. Non dedurre la tassazione di tutte le vendite dall'impostazione domestica forfettaria.
Nessun calcolo automatico di imposte/contributi personali: dipendono dall'attività complessiva del titolare.

## Fonti consultate
- https://www.agenziaentrate.gov.it/portale/fattura-elettronica-per-i-forfettari
- https://www1.agenziaentrate.gov.it/web_app_entrate/bollo_fatture.html
- https://docs.stripe.com/billing/subscriptions/design-an-integration
- https://docs.stripe.com/billing/subscriptions/webhooks
- https://docs.stripe.com/billing/taxes/collect-taxes

Questa è predisposizione tecnica, non un checkout attivo o una certificazione di conformità fiscale.
