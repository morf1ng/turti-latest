import { optionBase, freeDelivery } from "./util.js";

let tokenCache = { value: null, exp: 0 };

async function getToken() {
  const clientId = process.env.OZON_CLIENT_ID;
  const clientSecret = process.env.OZON_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  if (tokenCache.value && Date.now() < tokenCache.exp) return tokenCache.value;

  const res = await fetch("https://api-seller.ozon.ru/api/v2/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Client-Id": clientId },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
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

async function ozonFetch(path, body) {
  const token = await getToken();
  const clientId = process.env.OZON_CLIENT_ID;
  if (!token || !clientId) return null;

  const res = await fetch(`https://api-seller.ozon.ru${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Client-Id": clientId,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getOptions(ctx) {
  const data = await ozonFetch("/v1/delivery/checkout", {
    buyer: { city: ctx.city },
    packages: [
      {
        weight_g: Math.max(100, Math.ceil(ctx.weightKg * 1000)),
        length_mm: 250,
        width_mm: 200,
        height_mm: 150,
      },
    ],
  });

  const variants = data?.variants || data?.delivery_methods || [];
  if (!variants.length) return [];

  const best = variants[0];
  const cost = Math.ceil(Number(best.price || best.delivery_price || 0));
  const free = freeDelivery(ctx.goods);

  return [
    optionBase("ozon", "Ozon — пункт выдачи", "ozon", {
      days: best.delivery_time || best.time || "2–7 дней",
      cost: free ? 0 : cost,
      estimated: false,
      needsMap: true,
    }),
  ];
}

export async function getPoints(city) {
  const data = await ozonFetch("/v1/delivery/point/list", {
    filter: { city, provider: "ozon" },
    limit: 500,
  });
  const points = data?.points || data?.result || [];
  return points
    .map((p) => ({
      code: String(p.id || p.code || ""),
      name: p.name || "",
      address: p.address || p.address_str || "",
      lat: p.coordinates?.lat ?? p.lat,
      lon: p.coordinates?.lon ?? p.lon,
      worktime: p.working_hours || p.schedule || "",
      provider: "ozon",
      isPostamat: Boolean(p.is_postamat),
    }))
    .filter((p) => p.code && p.lat && p.lon);
}
