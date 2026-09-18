import { ok, fail, methodNotAllowed } from "./lib/http.js";
import { requireAdmin } from "./lib/auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const auth = requireAdmin(req, res);
  if (!auth.ok) return fail(res, auth.status, auth.error);

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return fail(res, 503, "VAPID ключи не заданы");
  }

  ok(res, { ok: true, message: "Тестовый push: подключите подписку через QR-модуль." });
}
