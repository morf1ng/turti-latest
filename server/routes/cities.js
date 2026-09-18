import { ok, fail, methodNotAllowed } from "../http.js";
import { ZONES } from "../../js/catalog.js";

async function dadataSuggest(q) {
  const token = process.env.DADATA_TOKEN;
  if (!token) return null;
  const res = await fetch("https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${token}`,
    },
    body: JSON.stringify({
      query: q,
      count: 8,
      from_bound: { value: "city" },
      to_bound: { value: "settlement" },
      locations: [{ country: "Россия" }],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (data.suggestions || []).map((s) => ({
    city: s.data.city || s.data.settlement || s.value.split(",")[0],
    label: s.value,
    code: s.data.city_kladr_id ? parseInt(s.data.city_kladr_id.slice(0, 11), 10) % 100000 : null,
    postal: s.data.postal_code || "",
  }));
}

async function cdekCities(q) {
  const account = process.env.CDEK_ACCOUNT;
  const password = process.env.CDEK_PASSWORD;
  if (!account || !password) return null;

  const base = process.env.CDEK_TEST === "1" ? "https://api.edu.cdek.ru/v2" : "https://api.cdek.ru/v2";
  const tokRes = await fetch(`${base}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: account,
      client_secret: password,
    }),
  });
  if (!tokRes.ok) return null;
  const tok = await tokRes.json();

  const res = await fetch(`${base}/location/cities?country_codes=RU&city=${encodeURIComponent(q)}&size=10`, {
    headers: { Authorization: `Bearer ${tok.access_token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return (Array.isArray(data) ? data : []).map((c) => ({
    city: c.city,
    label: `${c.city}${c.region ? ", " + c.region : ""}`,
    code: c.code,
    postal: "",
  }));
}

function fallbackCities(q) {
  const ql = q.toLowerCase();
  const found = new Set();
  const items = [];
  for (const z of Object.values(ZONES)) {
    for (const c of z.cities) {
      if (c.includes(ql) || ql.includes(c)) {
        const city = c.charAt(0).toUpperCase() + c.slice(1);
        if (!found.has(city)) {
          found.add(city);
          items.push({ city, label: city, code: null, postal: "" });
        }
      }
    }
  }
  if (!items.length && ql.length >= 2) {
    items.push({ city: q, label: q, code: null, postal: "" });
  }
  return items.slice(0, 8);
}

export async function handle(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const q = String(req.query.q || "").trim();
  if (q.length < 2) return ok(res, { items: [] });

  let items = (await dadataSuggest(q)) || (await cdekCities(q)) || fallbackCities(q);
  ok(res, { items });
}
