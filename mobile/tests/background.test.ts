import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBackgroundProvider } from '../src/services/background';
const original = 'file:///private/athlete.jpg';
test('unconfigured service retains original and makes no network request', async () => {
  let calls = 0;
  const provider = createBackgroundProvider(undefined, async () => {
    calls++;
    throw new Error('unexpected network');
  });
  const result = await provider.remove(original);
  assert.equal(result.uri, original);
  assert.equal(result.cutout, false);
  assert.equal(calls, 0);
});
test('network and upstream failures preserve the original', async () => {
  for (const fetcher of [
    async () => {
      throw new Error('offline');
    },
    async () => new Response('error', { status: 503 }),
    async () => Response.json({ status: 'fallback' }),
  ]) {
    const result = await createBackgroundProvider('https://example.test', fetcher).remove(original);
    assert.equal(result.uri, original);
    assert.equal(result.cutout, false);
  }
});
test('only an explicit PNG result activates cutout mode', async () => {
  const png = 'data:image/png;base64,iVBORw0KGgo=';
  const result = await createBackgroundProvider('https://example.test', async () =>
    Response.json({ status: 'processed', image: png }),
  ).remove(original);
  assert.equal(result.uri, png);
  assert.equal(result.cutout, true);
  const invalid = await createBackgroundProvider('https://example.test', async () =>
    Response.json({ status: 'processed', image: 'https://untrusted.test/photo' }),
  ).remove(original);
  assert.equal(invalid.uri, original);
  assert.equal(invalid.cutout, false);
});
