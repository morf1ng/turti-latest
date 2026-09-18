/**
 * Единая serverless-функция для всех API-маршрутов.
 * На Hobby-плане Vercel — лимит 12 функций; один роутер вместо 14 файлов.
 */
import { fail } from "../server/http.js";

const ROUTES = {
  admin: () => import("../server/routes/admin.js").then((m) => m.handle),
  cities: () => import("../server/routes/cities.js").then((m) => m.handle),
  "cron-reminders": () => import("../server/routes/cron-reminders.js").then((m) => m.handle),
  delivery: () => import("../server/routes/delivery.js").then((m) => m.handle),
  order: () => import("../server/routes/order.js").then((m) => m.handle),
  pay: () => import("../server/routes/pay.js").then((m) => m.handle),
  "pay-webhook": () => import("../server/routes/pay-webhook.js").then((m) => m.handle),
  "push-test": () => import("../server/routes/push-test.js").then((m) => m.handle),
  "push-unsubscribe": () => import("../server/routes/push-unsubscribe.js").then((m) => m.handle),
  pvz: () => import("../server/routes/pvz.js").then((m) => m.handle),
  reviews: () => import("../server/routes/reviews.js").then((m) => m.handle),
  surprise: () => import("../server/routes/surprise.js").then((m) => m.handle),
  track: () => import("../server/routes/track.js").then((m) => m.handle),
  upload: () => import("../server/routes/upload.js").then((m) => m.handle),
};

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  const parts = req.query.path;
  const route = Array.isArray(parts) ? parts.join("/") : String(parts || "");
  const load = ROUTES[route];
  if (!load) return fail(res, 404, "API route not found");
  const handle = await load();
  return handle(req, res);
}
