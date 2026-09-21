import { optionBase, freeDelivery } from "./util.js";

let tokenCache = { value: null, exp: 0 };

async function getToken() {
  const account = process.env.CDEK_ACCOUNT;
  const password = process.env.CDEK_PASSWORD;
  if (!account || !password) return null;

  if (tokenCache.value && Date.now() < tokenCache.exp) return tokenCache.value;

  const base = process.env.CDEK_TEST === "1" ? "https://api.edu.cdek.ru/v2" : "https://api.cdek.ru/v2";
  const res = await fetch(`${base}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: account,
      client_secret: password,
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  tokenCache = {
    value: data.access_token,
    exp: Date.now() + (data.expires_in - 60) * 1000,
  };
  return data.access_token;
}

function apiBase() {
  return process.env.CDEK_TEST === "1" ? "https://api.edu.cdek.ru/v2" : "https://api.cdek.ru/v2";
}

async function calcTariff(token, { toCode, weightKg, tariffCode }) {
  const fromCode = Number(process.env.CDEK_FROM_CODE || 1074);
  const res = await fetch(`${apiBase()}/calculator/tariff`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: 1,
      tariff_code: tariffCode,
      from_location: { code: fromCode },
      to_location: { code: toCode },
      packages: [{ weight: Math.max(100, Math.ceil(weightKg * 1000)) }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.total_sum) return null;
  return {
    cost: Math.ceil(data.total_sum),
    days: data.period_min && data.period_max
      ? `${data.period_min}–${data.period_max} дн.`
      : "2–7 дней",
  };
}

export async function getOptions(ctx) {
  const token = await getToken();
  if (!token || !ctx.cityCode) return [];

  const free = freeDelivery(ctx.goods);
  const pvz = await calcTariff(token, { toCode: ctx.cityCode, weightKg: ctx.weightKg, tariffCode: 136 });
  if (!pvz) return [];

  return [
    optionBase("pvz", "СДЭК — пункт выдачи", "cdek", {
      days: pvz.days,
      cost: free ? 0 : pvz.cost,
      estimated: false,
      needsMap: true,
    }),
  ];
}

export async function getPoints(city, cityCode) {
  const token = await getToken();
  if (!token) return [];

  const params = new URLSearchParams({
    type: "PVZ",
    country_code: "RU",
    is_handout: "true",
    size: "500",
  });
  if (cityCode) params.set("city_code", String(cityCode));
  else params.set("city", city);

  const res = await fetch(`${apiBase()}/deliverypoints?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((p) => ({
    code: p.code,
    name: p.name || p.location?.address || "",
    address: [p.location?.city, p.location?.address].filter(Boolean).join(", "),
    lat: p.location?.latitude,
    lon: p.location?.longitude,
    worktime: p.work_time || "",
    provider: "cdek",
    isPostamat: p.type === "POSTAMAT",
  })).filter((p) => p.lat && p.lon);
}
