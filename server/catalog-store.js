/** Каталог урбечей: дефолты из catalog.js + правки в KV. */

import { storeGet, storeSet } from "./kv.js";
import {
  PRODUCTS,
  COLLECTIONS,
  PHOTOS,
  HITS,
  CAT_NUTS,
  CAT_SEEDS,
  SLUGS,
  INTENSITY,
  JAR_WEIGHT,
  goodsTotal as goodsTotalStatic,
  orderWeight as orderWeightStatic,
  itemInfo as itemInfoStatic,
} from "../js/catalog.js";

const CATALOG_KEY = "catalog:v1";

let cache = null;
let cacheAt = 0;
const CACHE_MS = 15000;

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function defaultCatalog() {
  const products = {};
  for (const [id, p] of Object.entries(PRODUCTS)) {
    products[id] = { ...clone(p), id };
  }
  return {
    version: 1,
    products,
    photos: clone(PHOTOS),
    collections: clone(COLLECTIONS),
    hits: [...HITS],
    catNuts: [...CAT_NUTS],
    catSeeds: [...CAT_SEEDS],
    slugs: { ...SLUGS },
    intensity: { ...INTENSITY },
  };
}

function enrichCollections(catalog) {
  const cols = catalog.collections || {};
  for (const c of Object.values(cols)) {
    if (!c || !Array.isArray(c.items)) continue;
    c.jars = c.items.length;
    c.oldPrice = c.items.reduce((s, id) => s + (catalog.products[id]?.prices?.[250] || 0), 0);
    c.save = Math.max(0, (c.oldPrice || 0) - (c.price || 0));
  }
  return catalog;
}

function normalizeProduct(raw, id) {
  const pid = String(id || raw.id || "").trim();
  if (!/^[a-z0-9-]+$/.test(pid)) throw new Error("ID: только латиница, цифры и дефис");
  if (!String(raw.name || "").trim()) throw new Error("Укажите название");

  const prices = { 250: 0, 500: 0, 1000: 0 };
  for (const size of [250, 500, 1000]) {
    const v = Number(raw.prices?.[size] ?? raw["price" + size]);
    if (!v || v <= 0) throw new Error(`Цена ${size} г должна быть больше 0`);
    prices[size] = Math.round(v);
  }

  const group = raw.group === "seed" ? "seed" : "nut";
  return {
    id: pid,
    name: String(raw.name).trim().slice(0, 80),
    color: String(raw.color || "#C9A96E").slice(0, 20),
    group,
    ing: String(raw.ing || "").trim().slice(0, 200),
    plus: String(raw.plus || "").trim().slice(0, 300),
    desc: String(raw.desc || "").trim().slice(0, 600),
    eat: String(raw.eat || "").trim().slice(0, 200),
    prices,
    hit: Boolean(raw.hit),
    badge: String(raw.badge || "").trim().slice(0, 40) || undefined,
    hidden: Boolean(raw.hidden),
  };
}

export function invalidateCatalogCache() {
  cache = null;
  cacheAt = 0;
}

export async function getCatalog({ seed = true } = {}) {
  if (cache && Date.now() - cacheAt < CACHE_MS) return cache;

  let stored = await storeGet(CATALOG_KEY);
  if (!stored && seed) {
    stored = defaultCatalog();
    await storeSet(CATALOG_KEY, stored);
  }
  if (!stored) stored = defaultCatalog();

  const catalog = enrichCollections({
    ...stored,
    products: stored.products || {},
    photos: stored.photos || {},
    collections: stored.collections || {},
    hits: stored.hits || [],
    catNuts: stored.catNuts || [],
    catSeeds: stored.catSeeds || [],
    slugs: stored.slugs || {},
    intensity: stored.intensity || {},
  });

  cache = catalog;
  cacheAt = Date.now();
  return catalog;
}

export async function saveCatalog(catalog) {
  const next = enrichCollections(clone(catalog));
  await storeSet(CATALOG_KEY, next);
  invalidateCatalogCache();
  return next;
}

export async function saveProduct(product, { isNew = false } = {}) {
  const catalog = await getCatalog();
  const normalized = normalizeProduct(product, product.id);
  if (isNew && catalog.products[normalized.id]) {
    throw new Error("Товар с таким ID уже есть");
  }
  if (!isNew && !catalog.products[normalized.id]) {
    throw new Error("Товар не найден");
  }

  catalog.products[normalized.id] = normalized;
  if (!catalog.photos[normalized.id]) catalog.photos[normalized.id] = {};

  const list = normalized.group === "seed" ? "catSeeds" : "catNuts";
  if (!catalog[list].includes(normalized.id)) catalog[list].push(normalized.id);

  if (normalized.hit && !catalog.hits.includes(normalized.id)) catalog.hits.push(normalized.id);
  if (!normalized.hit) catalog.hits = catalog.hits.filter((x) => x !== normalized.id);

  if (product.intensity || product.slug) {
    if (product.intensity) catalog.intensity[normalized.id] = String(product.intensity).slice(0, 40);
    if (product.slug) catalog.slugs[normalized.id] = String(product.slug).slice(0, 80);
  }

  return saveCatalog(catalog);
}

export async function deleteProduct(id) {
  const catalog = await getCatalog();
  const pid = String(id || "").trim();
  if (!catalog.products[pid]) throw new Error("Товар не найден");
  delete catalog.products[pid];
  delete catalog.photos[pid];
  catalog.hits = catalog.hits.filter((x) => x !== pid);
  catalog.catNuts = catalog.catNuts.filter((x) => x !== pid);
  catalog.catSeeds = catalog.catSeeds.filter((x) => x !== pid);
  for (const c of Object.values(catalog.collections)) {
    if (c?.items) c.items = c.items.filter((x) => x !== pid);
  }
  delete catalog.intensity[pid];
  delete catalog.slugs[pid];
  return saveCatalog(catalog);
}

export async function saveProductPhotos(id, photos) {
  const catalog = await getCatalog();
  const pid = String(id || "").trim();
  if (!catalog.products[pid]) throw new Error("Товар не найден");
  const next = catalog.photos[pid] || {};
  for (const size of [250, 500, 1000]) {
    const url = photos?.[size];
    if (url === null || url === "") delete next[size];
    else if (url) next[size] = String(url).trim();
  }
  catalog.photos[pid] = next;
  return saveCatalog(catalog);
}

export async function saveCollection(cid, data) {
  const catalog = await getCatalog();
  const id = String(cid || data.id || "").trim();
  if (!/^col-[a-z0-9-]+$/.test(id)) throw new Error("ID набора: col- и латиница");
  if (!String(data.name || "").trim()) throw new Error("Название набора обязательно");
  const price = Number(data.price);
  if (!price || price <= 0) throw new Error("Цена набора должна быть больше 0");
  const items = (data.items || []).filter((x) => catalog.products[x]);
  if (!items.length) throw new Error("Выберите хотя бы один вкус");

  catalog.collections[id] = {
    name: String(data.name).trim().slice(0, 80),
    items,
    price: Math.round(price),
    premium: Boolean(data.premium),
  };
  return saveCatalog(catalog);
}

export function catalogPayload(catalog) {
  return {
    products: catalog.products,
    photos: catalog.photos,
    collections: catalog.collections,
    hits: catalog.hits,
    catNuts: catalog.catNuts,
    catSeeds: catalog.catSeeds,
    slugs: catalog.slugs,
    intensity: catalog.intensity,
    jarWeight: JAR_WEIGHT,
  };
}

export function itemInfoFromCatalog(catalog, key) {
  const k = String(key);
  if (k.startsWith("col-")) {
    const c = catalog.collections[k];
    return c
      ? {
          label: "Набор «" + c.name + "»",
          sub: c.jars + " банок × 250 г",
          price: c.price,
          isSet: true,
        }
      : null;
  }
  const [id, size] = k.split("|");
  const p = catalog.products[id];
  if (!p || p.hidden || !p.prices?.[size]) return null;
  return {
    label: p.name,
    sub: size + " г",
    price: p.prices[size],
    id,
    size: Number(size),
  };
}

export async function itemInfo(key) {
  const catalog = await getCatalog();
  return itemInfoFromCatalog(catalog, key);
}

export async function goodsTotal(items) {
  const catalog = await getCatalog();
  let sum = 0;
  for (const it of items || []) {
    const info = itemInfoFromCatalog(catalog, it.key);
    if (!info) throw new Error("Неизвестный товар: " + it.key);
    sum += info.price * Math.max(1, Math.min(50, parseInt(it.qty) || 1));
  }
  return sum;
}

export async function orderWeight(items) {
  const catalog = await getCatalog();
  let w = 0.25;
  for (const it of items || []) {
    const qty = Math.max(1, parseInt(it.qty) || 1);
    const k = String(it.key);
    if (k.startsWith("col-")) {
      const c = catalog.collections[k];
      if (c) w += c.jars * (JAR_WEIGHT[250] || 0.42) * qty;
    } else {
      const size = parseInt(k.split("|")[1]) || 250;
      w += (JAR_WEIGHT[size] || JAR_WEIGHT[250]) * qty;
    }
  }
  return Math.round(w * 100) / 100;
}

export async function isKnownProduct(id) {
  const catalog = await getCatalog();
  return Boolean(catalog.products[id] || catalog.collections[id]);
}

export async function productLabel(id) {
  const catalog = await getCatalog();
  if (catalog.collections[id]) return catalog.collections[id].name;
  if (catalog.products[id]) return catalog.products[id].name;
  return "";
}

/** Fallback для старых импортов — только если KV недоступен локально. */
export function legacyItemInfo(key) {
  return itemInfoStatic(key);
}

export function legacyGoodsTotal(items) {
  return goodsTotalStatic(items);
}

export function legacyOrderWeight(items) {
  return orderWeightStatic(items);
}
