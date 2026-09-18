/** Проверка ключа админки. Без ADMIN_KEY серверные данные закрыты. */

export function adminKeyFrom(req) {
  return req.headers["x-admin-key"] || req.headers["authorization"]?.replace(/^Bearer\s+/i, "") || "";
}

export function requireAdmin(req, res) {
  const expected = process.env.ADMIN_KEY;
  if (!expected) {
    return { ok: false, status: 503, error: "ADMIN_KEY не задан", hint: "Добавьте переменную на Vercel." };
  }
  if (adminKeyFrom(req) !== expected) {
    return { ok: false, status: 401, error: "Доступ запрещён" };
  }
  return { ok: true };
}
