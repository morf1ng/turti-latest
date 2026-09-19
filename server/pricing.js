import { codFee, FREE_DELIVERY_THRESHOLD } from "../js/catalog.js";
import {
  getCatalog,
  itemInfoFromCatalog,
  goodsTotal as goodsTotalAsync,
  orderWeight as orderWeightAsync,
} from "./catalog-store.js";

export { codFee, FREE_DELIVERY_THRESHOLD };

/** Разбор позиции на productId / collectionId для отзывов и проверок. */
export function productKeyFromItem(key) {
  const k = String(key || "");
  if (k.startsWith("col-")) return k;
  return k.split("|")[0] || "";
}

export async function buildLines(items) {
  const catalog = await getCatalog();
  const lines = [];
  for (const it of items || []) {
    const info = itemInfoFromCatalog(catalog, it.key);
    if (!info) throw new Error("Неизвестный товар: " + it.key);
    const qty = Math.max(1, Math.min(50, parseInt(it.qty) || 1));
    lines.push({
      key: it.key,
      label: info.label,
      sub: info.sub,
      qty,
      price: info.price,
      sum: info.price * qty,
      productId: productKeyFromItem(it.key),
    });
  }
  return lines;
}

export async function calcTotals({ items, deliveryCost = 0, payMethod = "online" }) {
  const lines = await buildLines(items);
  const goods = await goodsTotalAsync(items);
  const weight = await orderWeightAsync(items);
  const delivery = deliveryCost == null ? 0 : Math.max(0, Number(deliveryCost) || 0);
  const fee = payMethod === "cod" ? codFee(goods) : 0;
  const total = goods + delivery + fee;
  return { lines, goods, weight, delivery, fee, total };
}

export async function itemInfo(key) {
  const catalog = await getCatalog();
  return itemInfoFromCatalog(catalog, key);
}

export async function goodsTotal(items) {
  return goodsTotalAsync(items);
}

export async function orderWeight(items) {
  return orderWeightAsync(items);
}

export function orderContainsProduct(order, productId) {
  const pid = String(productId || "");
  if (!pid) return false;
  for (const line of order.lines || []) {
    if (line.productId === pid) return true;
    if (line.key === pid) return true;
  }
  return false;
}
