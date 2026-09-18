import { optionBase, isMakhachkala } from "./util.js";

export const id = "turti_manual";

export async function getOptions(ctx) {
  if (!isMakhachkala(ctx.city)) return [];
  if (process.env.TURTI_MANUAL_DELIVERY === "0") return [];
  return [
    optionBase("turti_manual", "Доставка TURTI вручную", "turti", {
      days: "по договорённости",
      quoteOnRequest: true,
      note: "Стоимость уточнит менеджер",
    }),
  ];
}
