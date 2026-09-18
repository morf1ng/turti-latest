/** Уведомления о заказах в Telegram. */

export async function notifyTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4000),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch {
    /* не блокируем заказ */
  }
}

export function formatOrderMessage(order) {
  const lines = (order.lines || [])
    .map((l) => `• ${l.label} ${l.sub} × ${l.qty}`)
    .join("\n");
  return (
    `<b>Заказ ${order.id}</b> ${order.paid ? "✅ оплачен" : "⏳ ожидает оплаты"}\n` +
    `${lines}\n` +
    `Итого: <b>${order.total} ₽</b>\n` +
    `${order.name}, ${order.phone}\n` +
    `${order.city} · ${order.deliveryLabel || order.method}\n` +
    (order.address ? order.address + "\n" : "")
  );
}
