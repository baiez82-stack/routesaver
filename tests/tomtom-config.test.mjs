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

test('repository version keeps TomTom disabled until deployment injects a key', async () => {
  const source = await readFile(configUrl, 'utf8');
  assert.match(source, /__TOMTOM_API_KEY__/);
  const context = execute(source);
  assert.equal(context.window.RouteSaverConfig.tomtomApiKey, '');
  assert.equal(context.window.RouteSaverConfig.tomtomTrafficEnabled, false);
  assert.equal(context.document.documentElement.dataset.tomtomTraffic, 'not-configured');
});

test('deployment-injected TomTom key enables live traffic configuration', async () => {
  const source = (await readFile(configUrl, 'utf8'))
    .replace("'__TOMTOM_API_KEY__'", JSON.stringify('test-domain-restricted-key'));
  const context = execute(source);
  assert.equal(context.window.RouteSaverConfig.tomtomApiKey, 'test-domain-restricted-key');
  assert.equal(context.window.RouteSaverConfig.tomtomTrafficEnabled, true);
  assert.equal(context.window.RouteSaverConfig.tomtomKeySource, 'github-pages-secret');
  assert.equal(context.document.documentElement.dataset.tomtomTraffic, 'configured');
});

test('an explicit runtime override remains supported', async () => {
  const source = await readFile(configUrl, 'utf8');
  const context = execute(source, { tomtomApiKey: 'runtime-key' });
  assert.equal(context.window.RouteSaverConfig.tomtomApiKey, 'runtime-key');
  assert.equal(context.window.RouteSaverConfig.tomtomTrafficEnabled, true);
  assert.equal(context.window.RouteSaverConfig.tomtomKeySource, 'runtime-override');
});
