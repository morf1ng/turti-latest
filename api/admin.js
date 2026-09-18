import { ok, fail, methodNotAllowed, readJson } from "./lib/http.js";
import { requireAdmin } from "./lib/auth.js";
import { listOrders, getOrder, saveOrder } from "./lib/orders.js";
import {
  listReviews,
  getReview,
  updateReview,
  deleteReview,
} from "./lib/reviews-store.js";
import { createRefund, yookassaConfigured } from "./lib/yookassa.js";
import { storeGet, storeSet } from "./lib/kv.js";

function trackingUrlFor(provider, num) {
  if (!num) return "";
  const n = encodeURIComponent(num);
  if (provider === "cdek") return `https://www.cdek.ru/ru/tracking?order_id=${n}`;
  if (provider === "ozon") return `https://www.ozon.ru/my/orderdetails/?tracking=${n}`;
  if (provider === "post") return `https://www.pochta.ru/tracking#${n}`;
  return "";
}

function countsReviews(list) {
  return {
    pending: list.filter((r) => r.status === "pending").length,
    approved: list.filter((r) => r.status === "approved").length,
    rejected: list.filter((r) => r.status === "rejected").length,
  };
}

export default async function handler(req, res) {
  const auth = requireAdmin(req, res);
  if (!auth.ok) return fail(res, auth.status, auth.error, { hint: auth.hint });

  if (req.method === "GET") {
    const section = String(req.query.section || "stats");

    if (section === "stats") {
      const orders = await listOrders(50);
      const reviews = await listReviews(50);
      return ok(res, {
        orders: orders.length,
        reviewsPending: reviews.filter((r) => r.status === "pending").length,
      });
    }

    if (section === "orders") {
      const items = await listOrders(200);
      return ok(res, { items });
    }

    if (section === "reviews") {
      const items = await listReviews(300);
      return ok(res, { items, counts: countsReviews(items) });
    }

    if (section === "feedback") {
      const items = (await storeGet("feedback:list")) || [];
      return ok(res, { items });
    }

    if (section === "surprises") {
      const active = (await storeGet("surprises:active")) || [];
      const used = (await storeGet("surprises:used")) || [];
      return ok(res, { active, used });
    }

    if (section === "qr") {
      const items = (await storeGet("qr:stats")) || [];
      const total = (await storeGet("qr:total")) || {};
      return ok(res, { items, total });
    }

    if (section === "push") {
      const items = (await storeGet("push:queue")) || [];
      return ok(res, {
        items,
        configured: Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
      });
    }

    return fail(res, 400, "Неизвестный раздел");
  }

  if (req.method !== "POST") return methodNotAllowed(res, ["GET", "POST"]);

  try {
    const body = await readJson(req);
    const action = body.action;

    if (action === "review-approve") {
      const r = await updateReview(body.id, { status: "approved" });
      if (!r) return fail(res, 404, "Отзыв не найден");
      return ok(res, { id: r.id, status: r.status });
    }

    if (action === "review-reject") {
      const r = await updateReview(body.id, { status: "rejected" });
      if (!r) return fail(res, 404, "Отзыв не найден");
      return ok(res, { id: r.id, status: r.status });
    }

    if (action === "review-delete") {
      const done = await deleteReview(body.id);
      if (!done) return fail(res, 404, "Отзыв не найден");
      return ok(res, { deleted: body.id });
    }

    if (action === "order-status") {
      const order = await getOrder(body.id);
      if (!order) return fail(res, 404, "Заказ не найден");
      if (body.status) order.status = body.status;
      if (body.tracking != null) {
        order.trackingNumber = String(body.tracking).trim();
        order.trackingUrl = trackingUrlFor(order.deliveryProvider, order.trackingNumber);
      }
      if (body.trackingUrl != null) order.trackingUrl = String(body.trackingUrl).trim();
      if (body.shipmentStatus != null) order.shipmentStatus = String(body.shipmentStatus).trim();
      if (body.labelNumber != null) order.labelNumber = String(body.labelNumber).trim();
      await saveOrder(order);
      return ok(res, { id: order.id });
    }

    if (action === "order-refund") {
      if (!yookassaConfigured()) return fail(res, 503, "ЮKassa не настроена");
      const order = await getOrder(body.id);
      if (!order || !order.paid || !order.paymentId) {
        return fail(res, 400, "Возврат возможен только для оплаченного заказа");
      }
      const amount = body.amount != null ? Number(body.amount) : Number(order.total);
      if (!amount || amount <= 0 || amount > Number(order.total)) {
        return fail(res, 400, "Некорректная сумма возврата");
      }
      const refund = await createRefund({
        paymentId: order.paymentId,
        amount,
        orderId: order.id,
      });
      order.refunds = order.refunds || [];
      order.refunds.push({
        id: refund.id,
        amount,
        status: refund.status,
        at: new Date().toISOString(),
      });
      if (amount >= Number(order.total)) order.status = "cancelled";
      await saveOrder(order);
      return ok(res, { refundId: refund.id, status: refund.status });
    }

    if (action === "surprise-use") {
      const active = (await storeGet("surprises:active")) || [];
      const used = (await storeGet("surprises:used")) || [];
      const idx = active.findIndex((s) => s.id === body.id);
      if (idx === -1) return fail(res, 404, "Комплимент не найден");
      const item = active.splice(idx, 1)[0];
      item.used = true;
      item.usedAt = new Date().toISOString();
      item.used_order_id = body.orderId || item.used_order_id || "";
      used.unshift(item);
      await storeSet("surprises:active", active);
      await storeSet("surprises:used", used);
      return ok(res, { id: item.id });
    }

    return fail(res, 400, "Неизвестное действие");
  } catch (e) {
    fail(res, 500, e.message || "Ошибка");
  }
}
