/** Хранилище заказов и отзывов: Vercel KV в проде, Map локально. */

const mem = globalThis.__TURTI_KV__ || (globalThis.__TURTI_KV__ = new Map());

async function kvClient() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  const { kv } = await import("@vercel/kv");
  return kv;
}

export async function storeGet(key) {
  const kv = await kvClient();
  if (kv) return kv.get(key);
  return mem.get(key) ?? null;
}

export async function storeSet(key, value) {
  const kv = await kvClient();
  if (kv) {
    await kv.set(key, value);
    return;
  }
  mem.set(key, value);
}

export async function storeDel(key) {
  const kv = await kvClient();
  if (kv) {
    await kv.del(key);
    return;
  }
  mem.delete(key);
}

export async function storeListPush(key, value, max = 5000) {
  const list = (await storeGet(key)) || [];
  list.unshift(value);
  if (list.length > max) list.length = max;
  await storeSet(key, list);
  return list;
}

export async function storeListRemove(key, predicate) {
  const list = (await storeGet(key)) || [];
  const next = list.filter((x) => !predicate(x));
  await storeSet(key, next);
  return next;
}

export async function storeIncr(key, ttlSec = 3600) {
  const kv = await kvClient();
  if (kv) {
    const n = await kv.incr(key);
    if (n === 1) await kv.expire(key, ttlSec);
    return n;
  }
  const n = (mem.get(key) || 0) + 1;
  mem.set(key, n);
  return n;
}
