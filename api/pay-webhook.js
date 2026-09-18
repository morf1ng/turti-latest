import { ok, fail, methodNotAllowed, readJson } from "./lib/http.js";
import { storeGet, storeSet } from "./lib/kv.js";
import { getOrder, markOrderPaid, markPaymentFailed } from "./lib/orders.js";
import { getPayment } from "./lib/yookassa.js";
import { notifyTelegram, formatOrderMessage } from "./lib/telegram.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    const body = await readJson(req);
    const event = body.event;
    const obj = body.object;
    if (!obj?.id) return ok(res, { received: true });

    const idemKey = `pay:wh:${obj.id}:${event}`;
    if (await storeGet(idemKey)) return ok(res, { duplicate: true });

    const payment = await getPayment(obj.id);
    const orderId = payment.metadata?.orderId;
    if (!orderId) return ok(res, { ignored: true });

    const order = await getOrder(orderId);
    if (!order) return ok(res, { ignored: true });

    if (event === "payment.succeeded" && payment.status === "succeeded") {
      const paidAmount = Number(payment.amount?.value);
      if (Math.abs(paidAmount - Number(order.total)) > 0.01) {
        await markPaymentFailed(orderId);
        await storeSet(idemKey, "amount_mismatch");
        return fail(res, 400, "Сумма платежа не совпадает");
      }
      const updated = await markOrderPaid(orderId, payment.id, paidAmount);
      if (updated) await notifyTelegram(formatOrderMessage(updated));
    } else if (event === "payment.canceled") {
      await markPaymentFailed(orderId);
    }

    await storeSet(idemKey, event || "done");
    ok(res, { received: true });
  } catch (e) {
    fail(res, 500, e.message || "Webhook error");
  }
}
