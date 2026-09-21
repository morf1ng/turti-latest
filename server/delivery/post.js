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

function formatSchedule(data) {
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  const labels = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
  const parts = [];
  for (let i = 0; i < days.length; i++) {
    const v = data[`schedule_${days[i]}`];
    if (v) parts.push(`${labels[i]} ${v}`);
  }
  return parts.join(", ");
}

export function postMapAvailable() {
  return Boolean(process.env.DADATA_TOKEN);
}

/** Отделения Почты — через DaData (нужен DADATA_TOKEN на сервере). */
export async function getPoints(city, postIndex) {
  const token = process.env.DADATA_TOKEN;
  if (!token) return [];

  const query = postIndex ? String(postIndex) : `${city}, Россия`;
  try {
    const res = await fetch(
      "https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/postal_unit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          query,
          count: 50,
          locations: [{ country: "Россия" }],
        }),
      }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.suggestions || [])
      .map((s) => ({
        code: String(s.data?.postal_code || ""),
        name: s.value || "",
        address: s.data?.address_str || s.unrestricted_value || s.value || "",
        lat: parseFloat(s.data?.geo_lat),
        lon: parseFloat(s.data?.geo_lon),
        worktime: formatSchedule(s.data || {}),
        provider: "post",
        isPostamat: false,
      }))
      .filter((p) => p.code && p.lat && p.lon);
  } catch {
    return [];
  }
}

export async function getOptions(ctx) {
  const quote = await calcPost(ctx);
  const free = freeDelivery(ctx.goods);
  const hasIndex = /^\d{6}$/.test(String(ctx.postIndex || ctx.postal || ""));

  const mapReady = postMapAvailable();

  if (quote) {
    return [
      optionBase("post", "Почта России", "post", {
        days: quote.days,
        cost: free ? 0 : quote.cost,
        estimated: false,
        needsMap: mapReady,
        note: mapReady ? "до отделения" : "укажите индекс отделения",
      }),
    ];
  }

  /* без индекса — ориентир по зоне, точную сумму даст индекс или выбор отделения */
  return [
    optionBase("post", "Почта России", "post", {
      days: "5–14 дней",
      cost: free ? 0 : null,
      estimated: !hasIndex,
      needsMap: mapReady,
      note: mapReady ? "до отделения" : "укажите индекс отделения",
    }),
  ];
}
