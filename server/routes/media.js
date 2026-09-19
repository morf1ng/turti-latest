import { ok, fail, methodNotAllowed } from "../http.js";
import { requireAdmin } from "../auth.js";
import { validateVideoUpload, uploadBlob } from "../blob.js";
import { storeGet, storeSet } from "../kv.js";
import { IncomingForm } from "formidable";

const MEDIA_KEY = "site:media";

function parseForm(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const form = new IncomingForm({ maxFileSize: maxBytes, multiples: false });
    form.parse(req, (err, _fields, files) => {
      if (err) reject(err);
      else resolve(files);
    });
  });
}

export async function handle(req, res) {
  if (req.method === "GET") {
    const data = (await storeGet(MEDIA_KEY)) || {};
    return ok(res, {
      storyVideo: data.storyVideo || "",
      storyVideoUpdatedAt: data.storyVideoUpdatedAt || "",
      storyVideoName: data.storyVideoName || "",
    });
  }

  if (req.method === "POST") {
    const auth = requireAdmin(req, res);
    if (!auth.ok) return fail(res, auth.status, auth.error, { hint: auth.hint });

    try {
      const files = await parseForm(req, 100 * 1024 * 1024);
      const raw = files.file;
      const file = Array.isArray(raw) ? raw[0] : raw;
      if (!file) return fail(res, 400, "Файл не передан");

      const name = file.originalFilename || file.name || "video.mov";
      const check = validateVideoUpload({
        name,
        type: file.mimetype,
        size: file.size,
      });
      if (!check.ok) return fail(res, 400, check.error);

      const fs = await import("fs/promises");
      const buffer = await fs.readFile(file.filepath || file.path);
      const uploaded = await uploadBlob(name, buffer, check.type, "site/story");
      if (!uploaded.ok) return fail(res, 503, uploaded.error);

      const prev = (await storeGet(MEDIA_KEY)) || {};
      const next = {
        ...prev,
        storyVideo: uploaded.url,
        storyVideoUpdatedAt: new Date().toISOString(),
        storyVideoName: name,
        storyVideoType: check.type,
      };
      await storeSet(MEDIA_KEY, next);

      return ok(res, {
        storyVideo: next.storyVideo,
        storyVideoUpdatedAt: next.storyVideoUpdatedAt,
        storyVideoName: next.storyVideoName,
      });
    } catch (e) {
      return fail(res, 500, e.message || "Видео не загрузилось");
    }
  }

  if (req.method === "DELETE") {
    const auth = requireAdmin(req, res);
    if (!auth.ok) return fail(res, auth.status, auth.error, { hint: auth.hint });

    const prev = (await storeGet(MEDIA_KEY)) || {};
    await storeSet(MEDIA_KEY, {
      ...prev,
      storyVideo: "",
      storyVideoUpdatedAt: new Date().toISOString(),
      storyVideoName: "",
      storyVideoType: "",
    });
    return ok(res, { removed: true });
  }

  return methodNotAllowed(res, ["GET", "POST", "DELETE"]);
}
