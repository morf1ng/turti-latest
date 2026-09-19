import { handleUpload } from "@vercel/blob/client";
import { ok, fail, methodNotAllowed, readJson } from "../http.js";
import { adminKeyFrom } from "../auth.js";
import { setStoryVideo } from "../story-video.js";

const VIDEO_TYPES = new Set([
  "video/quicktime",
  "video/mp4",
  "video/webm",
  "video/x-msvideo",
]);

function requireAdminUpload(req) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    return { ok: false, status: 503, error: "ADMIN_KEY не задан", hint: "Добавьте переменную на Vercel." };
  }
  if (adminKeyFrom(req) !== expected) {
    return { ok: false, status: 401, error: "Доступ запрещён" };
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, status: 503, error: "BLOB_READ_WRITE_TOKEN не задан", hint: "Подключите Blob в Vercel → Storage." };
  }
  return { ok: true };
}

export async function handle(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const auth = requireAdminUpload(req);
  if (!auth.ok) return fail(res, auth.status, auth.error, { hint: auth.hint });

  try {
    const body = await readJson(req);
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, _clientPayload, multipart) => {
        const type = String(multipart?.contentType || "").toLowerCase();
        if (type && !VIDEO_TYPES.has(type)) {
          throw new Error("Допустимы MOV, MP4 и WebM.");
        }
        return {
          allowedContentTypes: [...VIDEO_TYPES],
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        await setStoryVideo({
          url: blob.url,
          contentType: blob.contentType || "",
          name: blob.pathname || "",
        });
      },
    });
    return ok(res, result);
  } catch (e) {
    return fail(res, 400, e.message || "Не удалось загрузить видео");
  }
}
