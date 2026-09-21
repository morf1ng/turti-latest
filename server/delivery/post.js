import { optionBase, freeDelivery } from "./util.js";

/** Почта России — тариф через публичный калькулятор tariff.pochta.ru */

async function calcPost(ctx) {
  const from = process.env.POST_FROM_INDEX;
  const to = ctx.postIndex || ctx.postal;
  if (!from || !to || !/^\d{6}$/.test(String(to))) return null;

  try {
    const url =
      `https://tariff.pochta.ru/v2/calculate/tariff/delivery` +
      `?json&object=27030&from=${from}&to=${to}&weight=${Math.max(100, Math.ceil(ctx.weightKg * 1000))}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const rub = data?.paynds || data?.pay || data?.total;
    if (!rub) return null;
    return {
      cost: Math.ceil(Number(rub) / 100),
      days: data?.delivery?.min && data?.delivery?.max
        ? `${data.delivery.min}–${data.delivery.max} дн.`
        : "5–14 дней",
    };
  } catch {
    return null;
  }
}

export async function getOptions(ctx) {
  const quote = await calcPost(ctx);
  if (!quote) return [];

  const free = freeDelivery(ctx.goods);
  return [
    optionBase("post", "Почта России", "post", {
      days: quote.days,
      cost: free ? 0 : quote.cost,
      estimated: false,
      note: "до отделения",
    }),
  ];
}
