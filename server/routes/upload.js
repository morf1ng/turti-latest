import { ok, fail, methodNotAllowed } from "../http.js";
import { checkRateLimit } from "../spam.js";
import { requireAdmin } from "../auth.js";
import { validateUpload, uploadBlob } from "../blob.js";
import { IncomingForm } from "formidable";

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ maxFileSize: 5 * 1024 * 1024, multiples: false });
    form.parse(req, (err, _fields, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

export async function handle(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const folder = String(req.query.folder || "reviews");
  const isProduct = folder === "products";
  if (isProduct) {
    const auth = requireAdmin(req, res);
    if (!auth.ok) return fail(res, auth.status, auth.error, { hint: auth.hint });
  } else {
    const rl = await checkRateLimit(req, "upload");
    if (!rl.ok) return fail(res, 429, rl.error);
  }

  try {
    const files = await parseForm(req);
    const raw = files.file;
    const file = Array.isArray(raw) ? raw[0] : raw;
    if (!file) return fail(res, 400, "Файл не передан");

    const check = validateUpload({ type: file.mimetype, size: file.size });
    if (!check.ok) return fail(res, 400, check.error);

    const fs = await import("fs/promises");
    const buffer = await fs.readFile(file.filepath || file.path);
    const uploaded = await uploadBlob(
      file.originalFilename || file.name || "photo.jpg",
      buffer,
      file.mimetype,
      isProduct ? "products" : "reviews"
    );
    if (!uploaded.ok) return fail(res, 503, uploaded.error);

    ok(res, { url: uploaded.url });
  } catch (e) {
    fail(res, 500, e.message || "Файл не загрузился");
  }
}
