import { ok, fail, methodNotAllowed, readJson } from "./lib/http.js";
import { resolveDelivery } from "./lib/delivery/engine.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  try {
    const body = await readJson(req);
    const result = await resolveDelivery(body);
    if (!result.ok) return fail(res, 400, result.error);
    ok(res, result);
  } catch (e) {
    fail(res, 500, e.message || "Ошибка расчёта доставки");
  }
}
