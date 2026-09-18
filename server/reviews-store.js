import { storeGet, storeSet, storeListPush, storeDel } from "./kv.js";
import { phoneHash, phoneTail } from "./phone.js";
import { PRODUCTS, COLLECTIONS } from "../js/catalog.js";
import { findPaidOrdersByPhone } from "./orders.js";
import { orderContainsProduct } from "./pricing.js";

const LIST_KEY = "reviews:list";

export function newReviewId() {
  return "R" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 4).toUpperCase();
}

export function productLabel(productId) {
  if (!productId) return "";
  if (productId.startsWith("col-")) {
    const c = COLLECTIONS[productId];
    return c ? "Набор «" + c.name + "»" : productId;
  }
  const p = PRODUCTS[productId];
  return p ? p.name : productId;
}

export async function saveReview(review) {
  await storeSet(`review:${review.id}`, review);
  await storeListPush(LIST_KEY, review.id);
  return review;
}

export async function getReview(id) {
  return storeGet(`review:${id}`);
}

export async function listReviews(limit = 300) {
  const ids = (await storeGet(LIST_KEY)) || [];
  const out = [];
  for (const id of ids.slice(0, limit)) {
    const r = await getReview(id);
    if (r) out.push(r);
  }
  return out;
}

export async function listApprovedForProduct(productId) {
  const all = await listReviews(500);
  return all
    .filter((r) => r.status === "approved" && r.showOnSite && r.productId === productId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function reviewStats(items) {
  const rated = items.filter((r) => r.rating >= 1 && r.rating <= 5);
  if (!rated.length) return { average: 0, count: 0 };
  const sum = rated.reduce((s, r) => s + r.rating, 0);
  return {
    average: Math.round((sum / rated.length) * 10) / 10,
    count: rated.length,
  };
}

export function publicReview(r) {
  const mediaPublic = process.env.MEDIA_PUBLIC !== "0";
  return {
    id: r.id,
    name: r.name || "Покупатель",
    text: r.text,
    rating: r.rating,
    date: r.createdAt,
    flavor: r.flavor || productLabel(r.productId),
    productId: r.productId,
    media: mediaPublic ? (r.media || []).filter((m) => m.type === "image") : [],
    verified: Boolean(r.verified),
  };
}

export async function canLeaveReview({ phoneNorm, productId }) {
  if (!phoneNorm || !productId) {
    return { ok: false, error: "Укажите телефон и товар — отзыв доступен после оплаченного заказа." };
  }
  const dupKey = `review:dup:${phoneHash(phoneNorm)}:${productId}`;
  if (await storeGet(dupKey)) {
    return { ok: false, error: "Вы уже оставляли отзыв на этот товар." };
  }
  const paid = await findPaidOrdersByPhone(phoneNorm);
  const hasProduct = paid.some((o) => orderContainsProduct(o, productId));
  if (!hasProduct) {
    return {
      ok: false,
      error: "Отзыв можно оставить только после оплаты заказа с этим товаром. Укажите тот же телефон, что при оформлении.",
    };
  }
  return { ok: true };
}

export async function markReviewDuplicate(phoneNorm, productId, reviewId) {
  const dupKey = `review:dup:${phoneHash(phoneNorm)}:${productId}`;
  await storeSet(dupKey, reviewId);
}

export async function deleteReview(id) {
  const r = await getReview(id);
  if (!r) return false;
  await storeDel(`review:${id}`);
  const ids = (await storeGet(LIST_KEY)) || [];
  await storeSet(
    LIST_KEY,
    ids.filter((x) => x !== id)
  );
  if (r.phoneNorm && r.productId) {
    await storeDel(`review:dup:${phoneHash(r.phoneNorm)}:${r.productId}`);
  }
  return true;
}

export async function updateReview(id, patch) {
  const r = await getReview(id);
  if (!r) return null;
  Object.assign(r, patch, { updatedAt: new Date().toISOString() });
  await storeSet(`review:${id}`, r);
  return r;
}

export function createReview(body, phoneNorm) {
  const productId = String(body.productId || "").trim();
  return {
    id: newReviewId(),
    status: "pending",
    createdAt: new Date().toISOString(),
    name: String(body.name || "Покупатель").trim().slice(0, 60) || "Покупатель",
    text: String(body.text || "").trim().slice(0, 2000),
    rating: Math.min(5, Math.max(1, parseInt(body.rating) || 0)) || 0,
    productId,
    flavor: productLabel(productId),
    phoneNorm,
    phoneTail: phoneTail(body.phone),
    showOnSite: body.showOnSite !== false,
    verified: true,
    media: Array.isArray(body.media) ? body.media.slice(0, 3) : [],
    qr_token: body.qr_token || "",
    isGift: Boolean(body.isGift),
  };
}
