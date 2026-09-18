import { optionBase, isMakhachkala } from "./util.js";

/** Яндекс Доставка — цена только из официального API. */

export const id = "yandex_courier";

async function fetchQuote(ctx) {
  const token = process.env.YANDEX_DELIVERY_TOKEN;
  const platformId = process.env.YANDEX_DELIVERY_PLATFORM_ID;
  if (!token || !platformId) return null;

  try {
    const res = await fetch("https://b2b.taxi.yandex.net/b2b/cargo/integration/v2/offers/calculate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept-Language": "ru",
      },
      body: JSON.stringify({
        route_points: [
          {
            id: 1,
            coordinates: [47.5047, 42.9831],
            fullname: "TURTI, Махачкала",
          },
          {
            id: 2,
            coordinates: ctx.coords || [47.5047, 42.9831],
            fullname: ctx.city,
          },
        ],
        items: [{ quantity: 1, weight: ctx.weightKg, size: { length: 0.25, width: 0.2, height: 0.15 } }],
        requirements: { taxi_class: "courier" },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const offer = data?.offers?.[0];
    if (!offer?.price) return null;
    return {
      cost: Math.ceil(Number(offer.price)),
      days: offer.delivery_interval?.description || "в день заказа",
    };
  } catch {
    return null;
  }
}

export async function getOptions(ctx) {
  if (!isMakhachkala(ctx.city)) return [];

  const quote = await fetchQuote(ctx);
  if (quote) {
    return [
      optionBase("yandex_courier", "Яндекс Доставка курьером", "yandex", {
        days: quote.days,
        cost: quote.cost,
        estimated: false,
      }),
    ];
  }

  return [
    optionBase("yandex_courier", "Яндекс Доставка курьером", "yandex", {
      days: "1–2 дня",
      quoteOnRequest: true,
      note: "Стоимость уточнит менеджер",
    }),
  ];
}
