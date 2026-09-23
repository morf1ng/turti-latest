/** Загрузка фото отзывов в Vercel Blob. */

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_ALLOWED = new Set(["video/quicktime", "video/mp4", "video/webm", "video/x-msvideo"]);
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_VIDEO_BYTES = 500 * 1024 * 1024;

export function validateUpload(file) {
  if (!file) return { ok: false, error: "Файл не передан" };
  if (!ALLOWED.has(file.type)) {
    return { ok: false, error: "Допустимы только JPEG, PNG и WebP." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Файл больше 5 МБ." };
  }
  return { ok: true };
}

export function validateVideoUpload(file) {
  if (!file) return { ok: false, error: "Файл не передан" };
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || file.originalFilename || "").toLowerCase();
  const byExt = name.endsWith(".mov") || name.endsWith(".mp4") || name.endsWith(".webm");
  if (!VIDEO_ALLOWED.has(type) && !byExt) {
    return { ok: false, error: "Допустимы MOV, MP4 и WebM." };
  }
  if (file.size > MAX_VIDEO_BYTES) {
    return { ok: false, error: "Видео больше 500 МБ." };
  }
  return { ok: true };
}

function blobReadWriteToken() {
  return String(process.env.BLOB_READ_WRITE_TOKEN || "").trim();
}

function isPemLikeToken(token) {
  return /BEGIN\s+(PUBLIC|PRIVATE)\s+KEY/i.test(token) || /[\r\n]/.test(token);
}

function isValidReadWriteToken(token) {
  return Boolean(token) && /^vercel_blob_/i.test(token);
}

/** OIDC на Vercel: BLOB_STORE_ID + VERCEL_OIDC_TOKEN (подставляется на деплое). */
function oidcConfigured() {
  const storeId = String(process.env.BLOB_STORE_ID || "").trim();
  if (!storeId) return false;
  if (process.env.VERCEL_OIDC_TOKEN) return true;
  return Boolean(process.env.VERCEL);
}

export function blobTokenReady() {
  const token = blobReadWriteToken();

  if (token && isPemLikeToken(token)) {
    return {
      ok: false,
      error: "BLOB_READ_WRITE_TOKEN — не ключ SSH/PGP. Удалите переменную и подключите Blob через Storage.",
    };
  }

  if (oidcConfigured()) {
    return { ok: true, auth: "oidc" };
  }

  if (isValidReadWriteToken(token)) {
    return { ok: true, auth: "token", token };
  }

  if (token) {
    return {
      ok: false,
      error:
        "BLOB_READ_WRITE_TOKEN неверный. Удалите его в Settings → Environment Variables. Storage → Blob → Connect to Project → Redeploy.",
    };
  }

  return {
    ok: false,
    error: "Blob не подключён. Vercel → Storage → Blob → Connect to Project → Redeploy.",
  };
}

function blobErrorMessage(err) {
  const msg = String(err && (err.message || err) || "");
  if (/access denied|valid token|unauthorized|401|403/i.test(msg)) {
    return "Токен Blob не принят. Vercel → Storage → Blob → Connect to Project (удалите старый BLOB_READ_WRITE_TOKEN вручную) → Redeploy.";
  }
  return msg || "Файл не загрузился в Blob.";
}

export async function uploadBlob(filename, buffer, contentType, folder = "reviews") {
  const ready = blobTokenReady();
  if (!ready.ok) return ready;
  try {
    const { put } = await import("@vercel/blob");
    const safe = String(filename || "photo.jpg").replace(/[^\w.\-]+/g, "-");
    const putOpts = { access: "public", contentType };
    if (ready.auth === "token") putOpts.token = ready.token;
    const blob = await put(`${folder}/${Date.now()}-${safe}`, buffer, putOpts);
    return { ok: true, url: blob.url };
  } catch (e) {
    return { ok: false, error: blobErrorMessage(e) };
  }
}
