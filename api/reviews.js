import { ok, fail, methodNotAllowed, readJson } from "./lib/http.js";
import { checkRateLimit, checkHoneypot, checkFormTiming } from "./lib/spam.js";
import { normalizePhone } from "./lib/phone.js";
import {
  listApprovedForProduct,
  reviewStats,
  publicReview,
  canLeaveReview,
  createReview,
  saveReview,
  markReviewDuplicate,
  listReviews,
} from "./lib/reviews-store.js";
import { PRODUCTS, COLLECTIONS } from "../js/catalog.js";

function validProductId(id) {
  if (!id) return true;
  return Boolean(PRODUCTS[id] || COLLECTIONS[id]);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    const productId = String(req.query.product || "").trim();
    if (productId && !validProductId(productId)) {
      return fail(res, 400, "Неизвестный товар");
    }
    const items = productId ? await listApprovedForProduct(productId) : [];
    const all = productId ? items : (await listReviews(100)).filter((r) => r.status === "approved" && r.showOnSite);
    const publicItems = (productId ? items : all).map(publicReview);
    const stats = reviewStats(publicItems);
    return ok(res, {
      items: publicItems,
      stats,
      message: publicItems.length ? undefined : "Отзывов пока нет — станьте первым.",
    });
  }

  if (req.method !== "POST") return methodNotAllowed(res, ["GET", "POST"]);

  const rl = await checkRateLimit(req, "reviews");
  if (!rl.ok) return fail(res, 429, rl.error);

  try {
    const body = await readJson(req);
    const hp = checkHoneypot(body);
    if (!hp.ok) return fail(res, 400, hp.error);
    const tm = checkFormTiming(body);
    if (!tm.ok) return fail(res, 400, tm.error);

    const productId = String(body.productId || "").trim();
    if (!productId) return fail(res, 400, "Выберите товар или набор");
    if (!validProductId(productId)) return fail(res, 400, "Неизвестный товар");

    const text = String(body.text || "").trim();
    if (text.length < 10) return fail(res, 400, "Отзыв слишком короткий");
    const rating = parseInt(body.rating);
    if (rating < 1 || rating > 5) return fail(res, 400, "Поставьте оценку от 1 до 5");

    const phoneNorm = normalizePhone(body.phone);
    const eligible = await canLeaveReview({ phoneNorm, productId });
    if (!eligible.ok) return fail(res, 403, eligible.error);

    const media = (body.media || [])
      .filter((m) => m && m.type === "image" && m.url)
      .slice(0, 3)
      .map((m) => ({ type: "image", url: m.url }));

    const review = createReview({ ...body, media }, phoneNorm);
    await saveReview(review);
    await markReviewDuplicate(phoneNorm, productId, review.id);

    ok(res, { id: review.id, message: "Отзыв отправлен на проверку." });
  } catch (e) {
    fail(res, 500, e.message || "Не удалось сохранить отзыв");
  }
}
