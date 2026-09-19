import { ok, fail, methodNotAllowed, readJson } from "../http.js";
import { requireAdmin } from "../auth.js";
import {
  getCatalog,
  saveProduct,
  deleteProduct,
  saveProductPhotos,
  saveCollection,
  catalogPayload,
} from "../catalog-store.js";

export async function handle(req, res) {
  if (req.method === "GET") {
    try {
      const catalog = await getCatalog();
      return ok(res, { catalog: catalogPayload(catalog) });
    } catch (e) {
      return fail(res, 500, e.message || "Не удалось загрузить каталог");
    }
  }

  if (req.method !== "POST") return methodNotAllowed(res, ["GET", "POST"]);

  const auth = requireAdmin(req, res);
  if (!auth.ok) return fail(res, auth.status, auth.error, { hint: auth.hint });

  try {
    const body = await readJson(req);
    const action = body.action;

    if (action === "save-product") {
      const saved = await saveProduct(body.product || body, { isNew: Boolean(body.isNew) });
      if (body.photos) await saveProductPhotos(body.product?.id || body.id, body.photos);
      return ok(res, { catalog: catalogPayload(saved) });
    }

    if (action === "delete-product") {
      const saved = await deleteProduct(body.id);
      return ok(res, { catalog: catalogPayload(saved) });
    }

    if (action === "save-photos") {
      const saved = await saveProductPhotos(body.id, body.photos);
      return ok(res, { catalog: catalogPayload(saved) });
    }

    if (action === "save-collection") {
      const saved = await saveCollection(body.id, body.collection || body);
      return ok(res, { catalog: catalogPayload(saved) });
    }

    return fail(res, 400, "Неизвестное действие");
  } catch (e) {
    return fail(res, 400, e.message || "Ошибка сохранения");
  }
}
