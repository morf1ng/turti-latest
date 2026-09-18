/** Нормализация телефона для поиска заказов и отзывов. */

export function normalizePhone(raw) {
  const d = String(raw || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length === 11 && d.startsWith("8")) return "7" + d.slice(1);
  if (d.length === 10) return "7" + d;
  return d;
}

export function phoneTail(raw) {
  const n = normalizePhone(raw);
  return n.length >= 4 ? n.slice(-4) : "";
}

export function phoneHash(raw) {
  const n = normalizePhone(raw);
  if (!n) return "";
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return "p" + h.toString(36);
}
