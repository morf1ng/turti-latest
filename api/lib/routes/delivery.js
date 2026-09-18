import { ok, fail, methodNotAllowed, readJson } from "../http.js";
import { resolveDelivery } from "../delivery/engine.js";

export async function handle(req, res) {
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
