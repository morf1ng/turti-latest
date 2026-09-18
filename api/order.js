import { ok, fail, methodNotAllowed, readJson } from "./lib/http.js";
import { checkRateLimit } from "./lib/spam.js";
import { validateAndBuildOrder } from "./lib/validate-order.js";
import { saveOrder } from "./lib/orders.js";
import { notifyTelegram, formatOrderMessage } from "./lib/telegram.js";
import { yookassaConfigured } from "./lib/yookassa.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const rl = await checkRateLimit(req, "order");
  if (!rl.ok) return fail(res, 429, rl.error);

  try {
    const body = await readJson(req);

    if (body.payMethod === "online" && yookassaConfigured()) {
      return fail(res, 400, "Для оплаты на сайте используйте кнопку «Оплатить заказ».", {
        code: "USE_PAY_ENDPOINT",
      });
    }

    const built = await validateAndBuildOrder(body);
    if (!built.ok) return fail(res, 400, built.error, built);

    const order = built.order;
    if (order.payMethod === "online") {
      order.status = "awaiting_payment";
    }
    await saveOrder(order);
    await notifyTelegram(formatOrderMessage(order));

    ok(res, {
      orderId: order.id,
      goods: order.goodsTotal,
      delivery: order.deliveryCost,
      codFee: order.codFee,
      total: order.total,
      deliveryLabel: order.deliveryLabel,
      deliveryEstimated: order.deliveryEstimated,
      deliveryQuoteOnRequest: order.deliveryQuoteOnRequest,
      paid: order.paid,
    });
  } catch (e) {
    fail(res, 500, e.message || "Не удалось оформить заказ");
  }
}
