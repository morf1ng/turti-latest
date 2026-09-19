/** Создание отправлений через API otpravka.pochta.ru (нужен договор с Почтой). */

const API = "https://otpravka-api.pochta.ru/1.0";

export function postShipConfigured() {
  return Boolean(
    process.env.POST_ACCESS_TOKEN &&
      process.env.POST_USER_KEY &&
      process.env.POST_FROM_INDEX
  );
}

function headers() {
  return {
    Authorization: `AccessToken ${process.env.POST_ACCESS_TOKEN}`,
    "X-User-Authorization": `Basic ${process.env.POST_USER_KEY}`,
    "Content-Type": "application/json;charset=UTF-8",
    Accept: "application/json;charset=UTF-8",
  };
}

async function apiFetch(path, { method = "GET", body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: headers(),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const msg = data?.message || data?.error || text || res.statusText;
    throw new Error(msg || "Ошибка API Почты России");
  }
  return data;
}

function splitName(full) {
  const parts = String(full || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length >= 2) {
    return { surname: parts[0], givenName: parts.slice(1).join(" ") };
  }
  return { surname: parts[0] || "Получатель", givenName: "—" };
}

function phoneForPost(phoneNorm) {
  const d = String(phoneNorm || "").replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("7")) return d;
  if (d.length === 10) return "7" + d;
  return d || undefined;
}

function parseAddressLine(address) {
  const a = String(address || "").trim();
  if (!a) return { street: "доставка до отделения", house: "1" };
  const m = a.match(/^(.+?)[,\s]+(?:д\.?|дом)?\s*(\d+\S*)$/i);
  if (m) return { street: m[1].trim(), house: m[2] };
  return { street: a, house: "1" };
}

function formatPostErrors(data) {
  const errors = data?.errors;
  if (!Array.isArray(errors) || !errors.length) return "";
  return errors
    .flatMap((e) => (e["error-codes"] || []).map((x) => x.description || x.code))
    .filter(Boolean)
    .join("; ");
}

async function normalizeAddress(order, indexTo) {
  const original = [indexTo, order.city, order.address].filter(Boolean).join(", ").trim();
  if (!original) return null;

  const cleaned = await apiFetch("/clean/address", {
    method: "POST",
    body: [{ id: "1", "original-address": original }],
  });
  const c = Array.isArray(cleaned) ? cleaned[0] : cleaned;
  if (!c?.["index-to"]) return null;

  return {
    "index-to": Number(c["index-to"]) || Number(indexTo),
    "place-to": c["place-to"] || order.city || "",
    "region-to": c["region-to"] || order.city || "",
    "street-to": c["street-to"] || "доставка до отделения",
    "house-to": c["house-to"] || "1",
    "room-to": c["room-to"] || undefined,
  };
}

async function findBarcode(orderId) {
  try {
    const found = await apiFetch(`/backlog/search?query=${encodeURIComponent(orderId)}`);
    const list = found?.orders || (Array.isArray(found) ? found : []);
    const match = list.find((o) => o["order-num"] === orderId) || list[0];
    return match?.barcode || match?.["track-number"] || "";
  } catch {
    return "";
  }
}

/** Создать заказ в сервисе «Отправка» (otpravka.pochta.ru). */
export async function createPostShipment(order) {
  if (!postShipConfigured()) {
    return {
      ok: false,
      error: "API Почты не настроен: нужны POST_ACCESS_TOKEN, POST_USER_KEY и POST_FROM_INDEX",
    };
  }
  if (order.deliveryProvider !== "post") {
    return { ok: false, error: "Заказ оформлен не через Почту России" };
  }

  const indexTo = String(order.postIndex || "").replace(/\D/g, "");
  if (!/^\d{6}$/.test(indexTo)) {
    return { ok: false, error: "Нет индекса получателя (6 цифр)" };
  }

  const { surname, givenName } = splitName(order.name);
  const fallback = parseAddressLine(order.address);
  let addr = {
    "index-to": Number(indexTo),
    "place-to": order.city || "",
    "region-to": order.city || "",
    "street-to": fallback.street,
    "house-to": fallback.house,
  };

  try {
    const normalized = await normalizeAddress(order, indexTo);
    if (normalized) addr = normalized;
  } catch {
    /* адрес нормализовать не удалось — отправляем как есть */
  }

  const mass = Math.max(100, Math.ceil((order.weightKg || 0.5) * 1000));
  const payload = {
    "order-num": order.id,
    "address-type-to": "DEFAULT",
    "mail-type": "ONLINE_PARCEL",
    "mail-category": "ORDINARY",
    "mail-direct": 643,
    mass,
    "transport-type": "SURFACE",
    surname,
    "given-name": givenName,
    "tel-address": phoneForPost(order.phoneNorm || order.phone),
    ...addr,
  };

  if (order.payMethod === "cod" && Number(order.total) > 0) {
    const kopecks = Math.round(Number(order.total) * 100);
    payload["mail-category"] = "WITH_DECLARED_VALUE";
    payload["insr-value"] = kopecks;
    payload.payment = kopecks;
    payload["payment-method"] = "CASH_ON_DELIVERY";
  }

  const created = await apiFetch("/user/backlog", { method: "PUT", body: [payload] });
  const apiError = formatPostErrors(created);
  if (apiError) return { ok: false, error: apiError };

  const postOrderId = created?.["result-ids"]?.[0] ?? created?.["result-id"] ?? "";
  const barcode = await findBarcode(order.id);

  return {
    ok: true,
    postOrderId,
    barcode,
    note: barcode
      ? ""
      : "Заказ создан в «Отправке». Трек-номер появится после оформления партии в otpravka.pochta.ru",
  };
}
