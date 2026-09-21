import { ok, fail, methodNotAllowed } from "../http.js";
import { resolvePvz } from "../delivery/engine.js";

export async function handle(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const provider = String(req.query.provider || "cdek");
  const city = String(req.query.city || "").trim();
  const cityCode = req.query.cityCode ? Number(req.query.cityCode) : null;
  const postIndex = String(req.query.postIndex || "").trim() || null;

  if (!city) return fail(res, 400, "Укажите город");

  try {
    const points = await resolvePvz(provider, city, cityCode, postIndex);
    if (!points.length) {
      return fail(res, 404, "В этом населённом пункте пунктов выдачи не нашлось.");
    }
    ok(res, { points });
  } catch (e) {
    fail(res, 500, e.message || "Не удалось загрузить пункты выдачи");
  }
}
