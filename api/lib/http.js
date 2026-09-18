/** JSON-ответы для serverless-функций Vercel. */

export function json(res, status, body) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(status).json(body);
}

export function ok(res, body = { ok: true }) {
  json(res, 200, { ok: true, ...body });
}

export function fail(res, status, error, extra = {}) {
  json(res, status, { ok: false, error, ...extra });
}

export function methodNotAllowed(res, allowed) {
  res.setHeader("Allow", allowed.join(", "));
  fail(res, 405, "Метод не поддерживается");
}

export async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  const raw = req.body || "";
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error("Некорректный JSON");
  }
}

export function clientIp(req) {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.headers["x-real-ip"] ||
    "unknown"
  );
}
