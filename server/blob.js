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

export async function uploadBlob(filename, buffer, contentType, folder = "reviews") {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return { ok: false, error: "Хранилище файлов не настроено (BLOB_READ_WRITE_TOKEN)." };
  }
  const { put } = await import("@vercel/blob");
  const safe = String(filename || "photo.jpg").replace(/[^\w.\-]+/g, "-");
  const blob = await put(`${folder}/${Date.now()}-${safe}`, buffer, {
    access: "public",
    contentType,
    token,
  });
  return { ok: true, url: blob.url };
}
