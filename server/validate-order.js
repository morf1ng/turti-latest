import { normalizePhone } from "./phone.js";
import { resolveDelivery, findOption } from "./delivery/engine.js";
import { createOrderDraft } from "./orders.js";
import { calcTotals } from "./pricing.js";

export async function validateAndBuildOrder(body) {
  const items = body.items;
  if (!Array.isArray(items) || !items.length) {
    return { ok: false, error: "Корзина пуста" };
  }
  if (!body.consent) {
    return { ok: false, error: "Нужно согласие с офертой" };
  }

  const phoneNorm = normalizePhone(body.phone);
  if (phoneNorm.length < 11) {
    return { ok: false, error: "Укажите корректный телефон" };
  }
  if (!String(body.name || "").trim()) {
    return { ok: false, error: "Укажите имя" };
  }
  if (!String(body.city || "").trim()) {
    return { ok: false, error: "Укажите город" };
  }

  const delivery = await resolveDelivery(body);
  if (!delivery.ok) return delivery;

  const method = body.method;
  const option = findOption(delivery.options, method);
  if (!option) {
    return {
      ok: false,
      error: delivery.message || "Выберите способ доставки",
      telegramUrl: delivery.telegramUrl,
    };
  }

  const needsMap = Boolean(option.needsMap);
  if (needsMap && !body.pvzCode) {
    return { ok: false, error: "Выберите пункт выдачи на карте" };
  }
  if (method === "post" && !/^\d{6}$/.test(String(body.postIndex || "").trim())) {
    return { ok: false, error: "Для Почты России нужен индекс из 6 цифр" };
  }
  if (!needsMap && method !== "pickup" && method !== "post" && !String(body.address || "").trim()) {
    return { ok: false, error: "Укажите адрес доставки" };
  }

  const builtTotals = await calcTotals({
    items,
    deliveryCost: option?.quoteOnRequest ? 0 : option?.cost ?? 0,
    payMethod: body.payMethod === "cod" ? "cod" : "online",
  });

  const order = await createOrderDraft(
    { ...body, phoneNorm },
    option,
    builtTotals
  );
  order.zone = delivery.zone;
  order.zoneName = delivery.zoneName;

  return { ok: true, order, delivery, option };
}
