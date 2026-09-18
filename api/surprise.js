import { ok, fail, methodNotAllowed } from "./lib/http.js";
import { storeGet } from "./lib/kv.js";
import { phoneHash } from "./lib/phone.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const phone = String(req.query.phone || "").replace(/\D/g, "");
  if (phone.length < 10) return ok(res, { has: false });

  const hash = phoneHash(phone);
  const list = (await storeGet("surprises:active")) || [];
  const hit = list.find((s) => s.phoneHash === hash && !s.used);

  if (!hit) return ok(res, { has: false });

  ok(res, {
    has: true,
    id: hit.id,
    title: hit.label || "Секретный комплимент TURTI",
  });
}
