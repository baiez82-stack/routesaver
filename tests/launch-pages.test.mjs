import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const load = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('Plus is a public development placeholder without offers or payments', async () => {
  const html = await load('plus.html');
  assert.match(html, /IN SVILUPPO/);
  assert.match(html, /non è ancora disponibile al pubblico/i);
  assert.match(html, /non sono attivi pagamenti o abbonamenti/i);
  assert.doesNotMatch(html, /FOUNDING MEMBER|€19,99|€99|Business Pilot/i);
  assert.doesNotMatch(html, /<form\b/i);
  assert.doesNotMatch(html, /<input[^>]+(?:card|carta|iban)/i);
});

test('privacy page identifies the controller, contact and public-beta scope', async () => {
  const html = await load('privacy.html');
  assert.match(html, /Samuele Baietta/);
  assert.match(html, /dovesibaeccociqua@gmail\.com/);
  assert.match(html, /BETA PUBBLICA GRATUITA/);
  assert.match(html, /GitHub Pages/);
  assert.match(html, /Transitous\/MOTIS/);
  assert.match(html, /non sono attivi pagamenti/i);
});

test('terms page makes the free and pre-commercial status explicit', async () => {
  const html = await load('terms.html');
  assert.match(html, /BETA PUBBLICA GRATUITA/);
  assert.match(html, /non attiva account, abbonamenti o acquisti/i);
  assert.match(html, /RouteSaver non è un navigatore/i);
  assert.match(html, /manifestazione di interesse non vincolante/i);
  assert.match(html, /Stato pre-commerciale/);
});

test('homepage bootstrap exposes public-beta labels', async () => {
  const html = await load('index.html');
  const script = await load('assets/routing-config.js');
  assert.match(html, /id="includeNoToll"/);
  assert.match(html, /Traffico live non disponibile: nessun percorso consigliato/);
  assert.match(html, /Scarica traccia GPX/);
  assert.match(html, /Affidabilità della stima/);
  assert.match(html, /Range prudenziale/);
  assert.match(html, /Apri in Google Maps/);
  assert.match(html, /Opzioni avanzate · Beta/);
  assert.match(html, /route-core\.js\?v=20261006b/);
  assert.match(html, /Navigazione RouteSaver · Beta/);
  assert.match(html, /Stai uscendo dal percorso conveniente/);
  assert.doesNotMatch(html, /Waze · ricalcola|Mappe Apple · ricalcola/);
  assert.match(script, /BETA GRATUITA/);
  assert.match(script, /Beta pubblica gratuita/);
  assert.match(script, /if\(plans\)plans\.remove\(\)/);
});
