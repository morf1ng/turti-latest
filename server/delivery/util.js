/** Общие утилиты модуля доставки. */

export function normCity(city) {
  return String(city || "")
    .toLowerCase()
    .trim()
    .replace(/^(г|с|пос|аул|ст-ца|ст)\.?\s+/i, "")
    .replace(/\s+/g, " ");
}

export function isMakhachkala(city) {
  const c = normCity(city);
  return c.includes("махачкала") || c === "махачкала";
}

export function optionBase(method, label, provider, extra = {}) {
  return {
    method,
    label,
    provider,
    days: extra.days || "",
    note: extra.note || "",
    cost: extra.cost ?? null,
    estimated: Boolean(extra.estimated),
    quoteOnRequest: Boolean(extra.quoteOnRequest),
    needsMap: Boolean(extra.needsMap),
    unavailable: Boolean(extra.unavailable),
  };
}

export function freeDelivery(goods) {
  const threshold = Number(process.env.FREE_DELIVERY_THRESHOLD || 3000);
  return goods >= threshold;
}
