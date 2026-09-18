import { ok, fail, methodNotAllowed } from "../http.js";
import { storeGet, storeSet } from "../kv.js";

export async function handle(req, res) {
  if (req.method !== "GET" && req.method !== "POST") return methodNotAllowed(res, ["GET", "POST"]);

  const secret = process.env.CRON_SECRET;
  if (secret) {
    const got = req.headers["authorization"]?.replace(/^Bearer\s+/i, "") || req.query.secret;
    if (got !== secret) return fail(res, 401, "Forbidden");
  }

  const queue = (await storeGet("push:queue")) || [];
  const now = Date.now();
  let sent = 0;

  for (const item of queue) {
    if (item.status !== "pending") continue;
    if (new Date(item.dueAt).getTime() > now) continue;
    item.status = "due";
    sent++;
  }

  await storeSet("push:queue", queue);
  ok(res, { processed: sent, note: "VAPID push отправка — подключите web-push при необходимости." });
}
