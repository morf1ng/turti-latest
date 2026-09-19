/** Загрузка фото и видео в Vercel Blob. */

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm"]);
const IMAGE_MAX = 5 * 1024 * 1024;
const VIDEO_MAX = 100 * 1024 * 1024;

function guessVideoType(filename, type) {
  const name = String(filename || "").toLowerCase();
  if (type && type !== "application/octet-stream") return type;
  if (name.endsWith(".mov")) return "video/quicktime";
  if (name.endsWith(".mp4")) return "video/mp4";
  if (name.endsWith(".webm")) return "video/webm";
  return type || "";
}

export function validateUpload(file) {
  if (!file) return { ok: false, error: "Файл не передан" };
  if (!IMAGE_TYPES.has(file.type)) {
    return { ok: false, error: "Допустимы только JPEG, PNG и WebP." };
  }
  if (file.size > IMAGE_MAX) {
    return { ok: false, error: "Файл больше 5 МБ." };
  }
  return { ok: true };
}

export function validateVideoUpload(file) {
  if (!file) return { ok: false, error: "Файл не передан" };
  const type = guessVideoType(file.name, file.type);
  if (!VIDEO_TYPES.has(type)) {
    return { ok: false, error: "Допустимы MOV, MP4 и WebM." };
  }
  if (file.size > VIDEO_MAX) {
    return { ok: false, error: "Видео больше 100 МБ." };
  }
  return { ok: true, type };
}

export async function uploadBlob(filename, buffer, contentType, folder = "reviews") {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return { ok: false, error: "Хранилище файлов не настроено (BLOB_READ_WRITE_TOKEN)." };
  }
  const { put } = await import("@vercel/blob");
  const safe = String(filename || "file").replace(/[^\w.\-]+/g, "_");
  const blob = await put(`${folder}/${Date.now()}-${safe}`, buffer, {
    access: "public",
    contentType,
    token,
  });
  return { ok: true, url: blob.url };
}
