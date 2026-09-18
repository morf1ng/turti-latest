/** ЮKassa: создание платежа и возвраты. Ключи только на сервере. */

const API = "https://api.yookassa.ru/v3";

function creds() {
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secret = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secret) return null;
  return Buffer.from(`${shopId}:${secret}`).toString("base64");
}

export function yookassaConfigured() {
  return Boolean(creds());
}

function headers(idempotenceKey) {
  const auth = creds();
  if (!auth) throw new Error("ЮKassa не настроена");
  return {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
    "Idempotence-Key": idempotenceKey,
  };
}

export async function createPayment({ order, returnUrl }) {
  const site = process.env.SITE_URL || "";
  const amount = Number(order.total);
  if (!amount || amount < 1) throw new Error("Сумма заказа некорректна");

  const items = (order.lines || []).map((line) => ({
    description: `${line.label} ${line.sub}`.slice(0, 128),
    quantity: String(line.qty),
    amount: { value: line.price.toFixed(2), currency: "RUB" },
    vat_code: Number(process.env.YOOKASSA_VAT_CODE || 1),
    payment_mode: "full_payment",
    payment_subject: "commodity",
  }));

  if (order.deliveryCost != null && order.deliveryCost > 0) {
    items.push({
      description: order.deliveryLabel || "Доставка",
      quantity: "1",
      amount: { value: Number(order.deliveryCost).toFixed(2), currency: "RUB" },
      vat_code: Number(process.env.YOOKASSA_VAT_CODE || 1),
      payment_mode: "full_payment",
      payment_subject: "service",
    });
  }

  const body = {
    amount: { value: amount.toFixed(2), currency: "RUB" },
    capture: true,
    confirmation: {
      type: "redirect",
      return_url: returnUrl || `${site}/?order=${order.id}&paid=check`,
    },
    description: `Заказ ${order.id} TURTI`.slice(0, 128),
    metadata: { orderId: order.id },
    receipt: {
      customer: {
        phone: order.phone,
        email: order.email || undefined,
      },
      items,
    },
    payment_method_data: undefined,
  };

  const res = await fetch(`${API}/payments`, {
    method: "POST",
    headers: headers(`pay-${order.id}`),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.description || data?.type || "Ошибка ЮKassa");
  }
  return data;
}

export async function getPayment(paymentId) {
  const res = await fetch(`${API}/payments/${paymentId}`, {
    headers: headers(`get-${paymentId}`),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.description || "Платёж не найден");
  return data;
}

export async function createRefund({ paymentId, amount, orderId }) {
  const body = {
    payment_id: paymentId,
    amount: { value: Number(amount).toFixed(2), currency: "RUB" },
    description: `Возврат по заказу ${orderId}`.slice(0, 250),
  };
  const res = await fetch(`${API}/refunds`, {
    method: "POST",
    headers: headers(`refund-${orderId}-${amount}`),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.description || "Возврат не выполнен");
  return data;
}
