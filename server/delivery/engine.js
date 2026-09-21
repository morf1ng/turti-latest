import {
  zoneForCity,
  ZONES,
  DELIVERY_METHODS,
  fallbackDelivery,
} from "../../js/catalog.js";
import { orderWeight, goodsTotal } from "../catalog-store.js";
import { isMakhachkala, optionBase } from "./util.js";
import * as pickup from "./pickup.js";
import * as ozon from "./ozon.js";
import * as cdek from "./cdek.js";
import * as post from "./post.js";

/** Доступные способы на экране оформления */
const ALLOWED = new Set(["pickup", "ozon", "pvz", "post"]);

const REMOTE_ADAPTERS = [ozon, cdek, post];

function displayOrder(city) {
  return isMakhachkala(city)
    ? ["pickup", "ozon", "pvz", "post"]
    : ["ozon", "pvz", "post"];
}

function fallbackOption(method, ctx) {
  const meta = DELIVERY_METHODS[method] || {};
  const fb = fallbackDelivery(ctx.city, method, ctx.weightKg, ctx.goods);
  return optionBase(method, meta.label || fb.label, meta.provider || fb.provider, {
    days: meta.days || fb.days,
    cost: fb.cost,
    estimated: fb.estimated ?? true,
    needsMap: Boolean(meta.map),
    note: meta.note || (method === "post" ? "до отделения" : ""),
  });
}

function normalizeOption(option, ctx) {
  if (!option || option.unavailable) return null;
  if (option.quoteOnRequest || option.cost == null) {
    return fallbackOption(option.method, ctx);
  }
  return option;
}

function mergeOptions(apiOptions, ctx) {
  const byMethod = new Map();
  for (const raw of apiOptions) {
    if (!ALLOWED.has(raw.method)) continue;
    const o = normalizeOption(raw, ctx);
    if (o) byMethod.set(o.method, o);
  }
  for (const method of displayOrder(ctx.city)) {
    if (!byMethod.has(method)) {
      byMethod.set(method, fallbackOption(method, ctx));
    }
  }
  return displayOrder(ctx.city).map((m) => byMethod.get(m)).filter(Boolean);
}

export async function resolveDelivery(body) {
  const items = body.items || [];
  const city = String(body.city || "").trim();
  if (!city) return { ok: false, error: "Укажите город" };

  const ctx = {
    city,
    cityCode: body.cityCode || null,
    postIndex: body.postIndex || body.postal || null,
    postal: body.postal || body.postIndex || null,
    weightKg: await orderWeight(items),
    goods: await goodsTotal(items),
    payMethod: body.payMethod || "online",
  };

  let apiOptions = [];

  if (isMakhachkala(city)) {
    apiOptions.push(...(await pickup.getOptions(ctx)));
  }

  for (const adapter of REMOTE_ADAPTERS) {
    const opts = await adapter.getOptions(ctx);
    apiOptions.push(...opts);
  }

  const options = mergeOptions(apiOptions, ctx);
  const zone = zoneForCity(city);
  const zoneName = ZONES[zone]?.name || "";

  if (!options.length) {
    const tg = process.env.TELEGRAM_PUBLIC_URL || "https://t.me/turti_shop";
    return {
      ok: true,
      options: [],
      zone,
      zoneName,
      anyEstimated: false,
      message: `Не нашли удобный способ доставки? Напишите лично TURTI в Telegram: ${tg}`,
      telegramUrl: tg,
    };
  }

  return {
    ok: true,
    options,
    zone,
    zoneName,
    cityCode: ctx.cityCode,
    anyEstimated: options.some((o) => o.estimated),
  };
}

export async function resolvePvz(provider, city, cityCode, postIndex) {
  if (provider === "ozon") return ozon.getPoints(city);
  if (provider === "cdek") return cdek.getPoints(city, cityCode);
  if (provider === "post") return post.getPoints(city, postIndex);
  return [];
}

export function findOption(options, method) {
  return (options || []).find((o) => o.method === method) || null;
}
