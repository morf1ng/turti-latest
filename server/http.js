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

function readRawBody(req) {
  if (req._rawBody != null) return Promise.resolve(req._rawBody);
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      req._rawBody = Buffer.concat(chunks).toString("utf8");
      resolve(req._rawBody);
    });
    req.on("error", reject);
  });
}

export async function readJson(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }
  const ct = String(req.headers["content-type"] || "");
  if (ct.includes("multipart/form-data")) return {};
  const raw = typeof req.body === "string" ? req.body : await readRawBody(req);
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
