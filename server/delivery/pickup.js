import { optionBase, isMakhachkala } from "./util.js";

export const id = "pickup";

export async function getOptions(ctx) {
  if (!isMakhachkala(ctx.city)) return [];
  return [
    optionBase("pickup", "Самовывоз в Махачкале", "self", {
      days: "в день заказа",
      cost: 0,
      estimated: false,
      note: "ул. ___ — адрес сообщим после заказа",
    }),
  ];
}
