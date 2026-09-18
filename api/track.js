import { ok, fail, methodNotAllowed } from "./lib/http.js";
import { getOrder } from "./lib/orders.js";
import { normalizePhone } from "./lib/phone.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const id = String(req.query.id || "").trim();
  const phone = normalizePhone(req.query.phone || "");

  if (!id) return fail(res, 400, "Укажите номер заказа");

  const order = await getOrder(id);
  if (!order) return fail(res, 404, "Заказ не найден");

  if (phone && order.phoneNorm && order.phoneNorm !== phone) {
    return fail(res, 403, "Телефон не совпадает с заказом");
  }

  let trackingUrl = order.trackingUrl || "";
  if (!trackingUrl && order.trackingNumber) {
    const n = encodeURIComponent(order.trackingNumber);
    if (order.deliveryProvider === "cdek") trackingUrl = `https://www.cdek.ru/ru/tracking?order_id=${n}`;
    else if (order.deliveryProvider === "ozon") trackingUrl = `https://www.ozon.ru/my/orderdetails/?tracking=${n}`;
    else if (order.deliveryProvider === "post") trackingUrl = `https://www.pochta.ru/tracking#${n}`;
  }

  ok(res, {
    orderId: order.id,
    status: order.status,
    paid: order.paid,
    total: order.total,
    deliveryLabel: order.deliveryLabel,
    city: order.city,
    address: order.address || order.pvzCode,
    trackingNumber: order.trackingNumber || "",
    trackingUrl,
    shipmentStatus: order.shipmentStatus || "",
    lines: (order.lines || []).map((l) => ({
      label: l.label,
      sub: l.sub,
      qty: l.qty,
    })),
  });
}
