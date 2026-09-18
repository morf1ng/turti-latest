/** Загрузка фото отзывов в Vercel Blob. */

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 5 * 1024 * 1024;

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

export async function uploadBlob(filename, buffer, contentType) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return { ok: false, error: "Хранилище файлов не настроено (BLOB_READ_WRITE_TOKEN)." };
  }
  const { put } = await import("@vercel/blob");
  const blob = await put(`reviews/${Date.now()}-${filename}`, buffer, {
    access: "public",
    contentType,
    token,
  });
  return { ok: true, url: blob.url };
}
