import { ok, fail, methodNotAllowed } from "../http.js";
import { getOrder, markOrderPaid, markPaymentFailed } from "../orders.js";
import { normalizePhone } from "../phone.js";
import { getPayment, yookassaConfigured } from "../yookassa.js";
import { notifyTelegram, formatOrderMessage } from "../telegram.js";

async function syncPaymentStatus(order) {
  if (!order || order.paid || !order.paymentId || !yookassaConfigured()) return order;

  try {
    const payment = await getPayment(order.paymentId);
    if (payment.status === "succeeded") {
      const paidAmount = Number(payment.amount?.value);
      if (Math.abs(paidAmount - Number(order.total)) <= 0.01) {
        const updated = await markOrderPaid(order.id, payment.id, paidAmount);
        if (updated) await notifyTelegram(formatOrderMessage(updated));
        return updated;
      }
      await markPaymentFailed(order.id);
      order.status = "payment_failed";
      return order;
    }
    if (payment.status === "canceled") {
      await markPaymentFailed(order.id);
      order.status = "payment_failed";
    }
  } catch {
    /* webhook мог ещё не успеть — оставляем текущий статус */
  }
  return order;
}

export async function handle(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const id = String(req.query.id || "").trim();
  const phone = normalizePhone(req.query.phone || "");
  const verify = req.query.verify === "1" || req.query.paid === "check";

  if (!id) return fail(res, 400, "Укажите номер заказа");

  let order = await getOrder(id);
  if (!order) return fail(res, 404, "Заказ не найден");

  if (phone && order.phoneNorm && order.phoneNorm !== phone) {
    return fail(res, 403, "Телефон не совпадает с заказом");
  }

  if (verify) {
    order = await syncPaymentStatus(order);
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
    paymentPending: !order.paid && Boolean(order.paymentId) && order.status !== "payment_failed",
    paymentFailed: order.status === "payment_failed",
    total: order.total,
    goods: order.goodsTotal,
    delivery: order.deliveryCost,
    codFee: order.codFee,
    deliveryLabel: order.deliveryLabel,
    deliveryEstimated: order.deliveryEstimated,
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
