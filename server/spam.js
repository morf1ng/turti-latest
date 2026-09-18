import { storeIncr } from "./kv.js";
import { clientIp } from "./http.js";

const LIMITS = {
  reviews: { max: 8, window: 3600 },
  upload: { max: 30, window: 3600 },
  order: { max: 15, window: 3600 },
};

export async function checkRateLimit(req, bucket) {
  const cfg = LIMITS[bucket];
  if (!cfg) return { ok: true };
  const ip = clientIp(req);
  const key = `rl:${bucket}:${ip}`;
  const n = await storeIncr(key, cfg.window);
  if (n > cfg.max) {
    return { ok: false, error: "Слишком много запросов. Попробуйте позже." };
  }
  return { ok: true };
}

export function checkHoneypot(body) {
  if (body?.website) return { ok: false, error: "Не удалось отправить." };
  return { ok: true };
}

export function checkFormTiming(body, minMs = 2500) {
  const elapsed = Number(body?.elapsedMs);
  if (elapsed > 0 && elapsed < minMs) {
    return { ok: false, error: "Подождите пару секунд и отправьте снова." };
  }
  return { ok: true };
}
