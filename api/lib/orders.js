import { storeGet, storeSet, storeListPush } from "./kv.js";
import { buildLines, calcTotals } from "./pricing.js";

const LIST_KEY = "orders:list";

export function newOrderId() {
  return "T" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
}

export async function saveOrder(order) {
  await storeSet(`order:${order.id}`, order);
  await storeListPush(LIST_KEY, order.id);
  return order;
}

export async function getOrder(id) {
  return storeGet(`order:${id}`);
}

export async function listOrders(limit = 200) {
  const ids = (await storeGet(LIST_KEY)) || [];
  const orders = [];
  for (const id of ids.slice(0, limit)) {
    const o = await getOrder(id);
    if (o) orders.push(o);
  }
  return orders;
}

export async function findPaidOrdersByPhone(phoneNorm) {
  const orders = await listOrders(500);
  return orders.filter(
    (o) => o.phoneNorm === phoneNorm && o.paid && o.status !== "cancelled"
  );
}

export function createOrderDraft(payload, deliveryOption) {
  const id = newOrderId();
  const payMethod = payload.payMethod === "cod" ? "cod" : "online";
  const deliveryCost = deliveryOption?.quoteOnRequest ? 0 : deliveryOption?.cost ?? 0;
  const totals = calcTotals({
    items: payload.items,
    deliveryCost,
    payMethod,
  });

  return {
    id,
    status: payMethod === "online" ? "pending_payment" : "awaiting_payment",
    createdAt: new Date().toISOString(),
    name: String(payload.name || "").trim().slice(0, 100),
    phone: String(payload.phone || "").trim().slice(0, 30),
    phoneNorm: payload.phoneNorm,
    email: String(payload.email || "").trim().slice(0, 100),
    city: String(payload.city || "").trim().slice(0, 120),
    cityCode: payload.cityCode || null,
    address: String(payload.address || "").trim().slice(0, 300),
    pvzCode: String(payload.pvzCode || "").trim().slice(0, 80),
    postIndex: String(payload.postIndex || "").trim().slice(0, 10),
    method: deliveryOption?.method || payload.method,
    deliveryLabel: deliveryOption?.label || "",
    deliveryProvider: deliveryOption?.provider || "",
    deliveryCost: deliveryOption?.quoteOnRequest ? null : deliveryCost,
    deliveryDays: deliveryOption?.days || "",
    deliveryEstimated: Boolean(deliveryOption?.estimated),
    deliveryQuoteOnRequest: Boolean(deliveryOption?.quoteOnRequest),
    lines: totals.lines,
    goodsTotal: totals.goods,
    weightKg: totals.weight,
    codFee: totals.fee,
    total: deliveryOption?.quoteOnRequest ? totals.goods + totals.fee : totals.total,
    payMethod,
    paid: false,
    paidAt: null,
    paymentId: null,
    trackingNumber: "",
    trackingUrl: "",
    labelNumber: "",
    shipmentStatus: "",
    surpriseId: payload.surpriseId || "",
    landing: payload.landing || "",
    utm: payload.utm || null,
    refunds: [],
  };
}

export async function markOrderPaid(orderId, paymentId, amount) {
  const order = await getOrder(orderId);
  if (!order) return null;
  if (order.paid) return order;
  order.paid = true;
  order.paidAt = new Date().toISOString();
  order.status = "paid";
  order.paymentId = paymentId;
  if (amount != null) order.paidAmount = amount;
  await saveOrder(order);
  return order;
}

export async function markPaymentFailed(orderId) {
  const order = await getOrder(orderId);
  if (!order || order.paid) return order;
  order.status = "payment_failed";
  await saveOrder(order);
  return order;
}
