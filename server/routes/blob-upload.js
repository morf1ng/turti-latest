import { handleUpload } from "@vercel/blob/client";
import { ok, fail, methodNotAllowed, readJson } from "../http.js";
import { adminKeyFrom } from "../auth.js";
import { blobTokenReady } from "../blob.js";
import { setStoryVideo } from "../story-video.js";

const VIDEO_TYPES = new Set([
  "video/quicktime",
  "video/mp4",
  "video/webm",
  "video/x-msvideo",
]);

function publicBlobToken() {
  const photos = String(process.env.PHOTOS_READ_WRITE_TOKEN || "").trim();
  if (/^vercel_blob_/i.test(photos)) return photos;
  return "";
}

function requireAdminUpload(req) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    return { ok: false, status: 503, error: "ADMIN_KEY не задан", hint: "Добавьте переменную на Vercel." };
  }
  if (adminKeyFrom(req) !== expected) {
    return { ok: false, status: 401, error: "Доступ запрещён" };
  }
  if (!publicBlobToken() && !blobTokenReady().ok) {
    return { ok: false, status: 503, error: "Blob не подключён", hint: "Подключите Blob в Vercel → Storage." };
  }
  return { ok: true };
}

function storyCallbackUrl(req) {
  const prod = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || "").trim();
  if (process.env.VERCEL_ENV === "production" && prod) {
    return `https://${prod}/api/blob-upload`;
  }
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  if (!host) return undefined;
  return `https://${host}/api/blob-upload`;
}

function safeStoryPath(raw) {
  const name = String(raw || "story.mov").split("/").pop().replace(/[^\w.\-]+/g, "-").slice(0, 80);
  return "site/story/" + Date.now() + "-" + (name || "story.mov");
}

export async function handle(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  let body;
  try {
    body = await readJson(req);
  } catch (e) {
    return fail(res, 400, e.message || "Некорректный JSON");
  }

  const isCallback = body && body.type === "blob.upload-completed";
  if (!isCallback) {
    const auth = requireAdminUpload(req);
    if (!auth.ok) return fail(res, auth.status, auth.error, { hint: auth.hint });
    if (body && body.type === "blob.generate-client-token" && body.payload) {
      body.payload.pathname = safeStoryPath(body.payload.pathname);
      body.payload.callbackUrl = body.payload.callbackUrl || "";
    }
  } else if (!publicBlobToken()) {
    return fail(res, 503, "Blob не подключён");
  }

  const token = publicBlobToken();
  if (!token) {
    return fail(res, 503, "Для видео нужен ключ публичного хранилища. Vercel → Storage → Blob → Connect to Project.");
  }

  try {
    const result = await handleUpload({
      body,
      request: req,
      token,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        let type = "";
        try {
          type = String(JSON.parse(clientPayload || "{}").contentType || "").toLowerCase();
        } catch { /* тип проверит само хранилище */ }
        if (type && !VIDEO_TYPES.has(type)) {
          throw new Error("Допустимы MOV, MP4 и WebM.");
        }
        return {
          allowedContentTypes: [...VIDEO_TYPES],
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: true,
          callbackUrl: storyCallbackUrl(req),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        if (!blob || !blob.url) return;
        await setStoryVideo({
          url: blob.url,
          contentType: blob.contentType || "",
          name: blob.pathname || "",
        });
      },
    });
    return ok(res, {
      ...result,
      pathname: body && body.payload ? body.payload.pathname : undefined,
    });
  } catch (e) {
    const msg = String(e && e.message || "");
    if (/No token found|BLOB_READ_WRITE_TOKEN|Invalid `token`/i.test(msg)) {
      return fail(res, 503, "Для видео нужен токен хранилища. Vercel → Storage → Blob → Connect to Project → Redeploy.");
    }
    return fail(res, 400, msg || "Не удалось загрузить видео");
  }
}
