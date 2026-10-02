import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTomTomUrl } from '../api/tomtom.mjs';

test('proxy builds a fixed traffic-aware TomTom request', () => {
  const url = new URL(buildTomTomUrl({ from: '45.1,10.2', to: '45.3,10.4', maxAlternatives: '2' }, 'secret'));
  assert.equal(url.searchParams.get('key'), 'secret');
  assert.equal(url.searchParams.get('traffic'), 'true');
  assert.equal(url.searchParams.get('departAt'), 'now');
  assert.equal(url.searchParams.get('instructionsType'), 'text');
  assert.equal(url.searchParams.get('language'), 'it-IT');
  assert.equal(url.searchParams.getAll('sectionType').length, 6);
});

test('proxy permits only the supported avoid option and valid coordinates', () => {
  const safe = new URL(buildTomTomUrl({ from: '45,10', to: '46,11', avoid: 'anything' }, 'secret'));
  assert.equal(safe.searchParams.has('avoid'), false);
  const noToll = new URL(buildTomTomUrl({ from: '45,10', to: '46,11', avoid: 'tollRoads' }, 'secret'));
  assert.equal(noToll.searchParams.get('avoid'), 'tollRoads');
  assert.throws(() => buildTomTomUrl({ from: '95,10', to: '46,11' }, 'secret'));
  assert.throws(() => buildTomTomUrl({ from: '45,10/x', to: '46,11' }, 'secret'));
});
