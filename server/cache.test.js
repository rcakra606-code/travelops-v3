import test from 'node:test';
import assert from 'node:assert/strict';
import { cacheGet, cacheSet, cacheDel, getCacheStatus } from './cache.js';

test('cacheSet, cacheGet, and cacheDel work cleanly with memory LRU fallback', async () => {
  const key = `unit-test:${Date.now()}`;
  assert.equal(await cacheGet(key), null);

  await cacheSet(key, { hello: 'travelops', count: 42 }, 30);
  const hit = await cacheGet(key);
  assert.deepEqual(hit, { hello: 'travelops', count: 42 });

  await cacheDel(key);
  assert.equal(await cacheGet(key), null);

  const status = getCacheStatus();
  assert.equal(typeof status.hits, 'number');
  assert.equal(typeof status.misses, 'number');
  assert.equal(status.backend, 'memory-lru');
});
