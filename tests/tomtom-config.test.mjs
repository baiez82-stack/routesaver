import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';

const configUrl = new URL('../assets/routing-config.js', import.meta.url);

function execute(source, initialConfig = {}) {
  const elements = new Map();
  const context = {
    window: { RouteSaverConfig: { ...initialConfig } },
    document: {
      documentElement: { dataset: {} },
      querySelector(selector) {
        if (!elements.has(selector)) elements.set(selector, null);
        return elements.get(selector);
      },
    },
  };
  vm.runInNewContext(source, context, { filename: 'routing-config.js' });
  return context;
}

test('repository version contains no TomTom key and stays disabled without a proxy', async () => {
  const source = await readFile(configUrl, 'utf8');
  assert.doesNotMatch(source, /tomtomApiKey|__TOMTOM_API_KEY__/);
  const context = execute(source);
  assert.equal(context.window.RouteSaverConfig.tomtomProxyUrl, '');
  assert.equal(context.window.RouteSaverConfig.tomtomTrafficEnabled, false);
  assert.equal(context.document.documentElement.dataset.tomtomTraffic, 'not-configured');
});

test('an HTTPS proxy runtime override enables live traffic without exposing a key', async () => {
  const source = await readFile(configUrl, 'utf8');
  const context = execute(source, { tomtomProxyUrl: 'https://routesaver-api.example/api/tomtom' });
  assert.equal(context.window.RouteSaverConfig.tomtomProxyUrl, 'https://routesaver-api.example/api/tomtom');
  assert.equal(context.window.RouteSaverConfig.tomtomTrafficEnabled, true);
  assert.equal(context.window.RouteSaverConfig.tomtomKeySource, 'server-proxy');
  assert.equal(context.document.documentElement.dataset.tomtomTraffic, 'configured');
});
