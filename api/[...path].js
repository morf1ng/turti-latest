/**
 * Единая serverless-функция для всех API-маршрутов.
 * На Hobby-плане Vercel — лимит 12 функций; один роутер вместо 14 файлов.
 */
import { fail } from "./lib/http.js";

const ROUTES = {
  admin: () => import("./lib/routes/admin.js").then((m) => m.handle),
  cities: () => import("./lib/routes/cities.js").then((m) => m.handle),
  "cron-reminders": () => import("./lib/routes/cron-reminders.js").then((m) => m.handle),
  delivery: () => import("./lib/routes/delivery.js").then((m) => m.handle),
  order: () => import("./lib/routes/order.js").then((m) => m.handle),
  pay: () => import("./lib/routes/pay.js").then((m) => m.handle),
  "pay-webhook": () => import("./lib/routes/pay-webhook.js").then((m) => m.handle),
  "push-test": () => import("./lib/routes/push-test.js").then((m) => m.handle),
  "push-unsubscribe": () => import("./lib/routes/push-unsubscribe.js").then((m) => m.handle),
  pvz: () => import("./lib/routes/pvz.js").then((m) => m.handle),
  reviews: () => import("./lib/routes/reviews.js").then((m) => m.handle),
  surprise: () => import("./lib/routes/surprise.js").then((m) => m.handle),
  track: () => import("./lib/routes/track.js").then((m) => m.handle),
  upload: () => import("./lib/routes/upload.js").then((m) => m.handle),
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
