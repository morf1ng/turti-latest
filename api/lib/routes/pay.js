import { ok, fail, methodNotAllowed, readJson } from "../http.js";
import { checkRateLimit } from "../spam.js";
import { validateAndBuildOrder } from "../validate-order.js";
import { saveOrder } from "../orders.js";
import { createPayment, yookassaConfigured } from "../yookassa.js";

export async function handle(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  if (!yookassaConfigured()) {
    return fail(res, 503, "Онлайн-оплата пока не подключена.", { code: "PAY_NOT_CONNECTED" });
  }

  const rl = await checkRateLimit(req, "order");
  if (!rl.ok) return fail(res, 429, rl.error);

  try {
    const body = await readJson(req);
    body.payMethod = "online";

    const built = await validateAndBuildOrder(body);
    if (!built.ok) return fail(res, 400, built.error, built);

    const order = built.order;
    order.status = "pending_payment";
    await saveOrder(order);

    const site = process.env.SITE_URL || "";
    const payment = await createPayment({
      order,
      returnUrl: `${site}/?order=${order.id}&paid=check`,
    });

    order.paymentId = payment.id;
    order.paymentUrl = payment.confirmation?.confirmation_url;
    await saveOrder(order);

    ok(res, {
      orderId: order.id,
      paymentUrl: order.paymentUrl,
      goods: order.goodsTotal,
      delivery: order.deliveryCost,
      total: order.total,
      deliveryLabel: order.deliveryLabel,
    });
  } catch (e) {
    fail(res, 500, e.message || "Не удалось создать платёж");
  }
}
