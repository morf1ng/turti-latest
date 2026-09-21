/* ═══════════════════════════════════════════════════════════════════════
   TURTI — ЕДИНЫЙ ИСТОЧНИК ДАННЫХ

   Этот файл читают И браузер, И сервер. Цены и товары существуют
   ровно в одном месте — рассинхрона между витриной и расчётом заказа
   быть не может по построению.

   Коммерческие данные (цены, составы, наборы, порог бесплатной доставки)
   меняет только владелец. Код их не трогает.
   ═══════════════════════════════════════════════════════════════════════ */

export const BRAND = {
  name: "TURTI",
  tagline: "Дагестанский урбеч с водяной мельницы",
  sub: "Медленный каменный помол на водяной мельнице",
  waNumber: "79282197962",
  cityFrom: "Махачкала",
  cityFromCode: 1074            // код Махачкалы в справочнике СДЭК
};

/* ─── КОММЕРЧЕСКИЕ ПАРАМЕТРЫ — правит только владелец ─── */
export const FREE_DELIVERY_THRESHOLD = 3000;   // ₽
export const COD_FEE_PERCENT = 2;              // наложенный платёж, % от суммы
export const WHOLESALE_MIN_KG = 10;            // минимальный опт, кг — на утверждении

export const PRODUCTS = {
  "flax-black": { name: "Чёрный лён", color: "#33302A", group: "seed", ing: "чёрный лён", plus: "Насыщенный вкус · Заметная горчинка · Густая текстура", desc: "Насыщенный семенной вкус с заметной горчинкой и густой, слегка зернистой текстурой.", eat: "С мёдом, в кашу или смузи.", prices: { 250: 200, 500: 270, 1000: 480 } },
  "flax-seeds": { name: "Чёрный лён с семечками", color: "#4A4136", group: "seed", ing: "чёрный лён и семечки подсолнечника", plus: "Округлый семенной вкус · Ореховая нота", desc: "Льняная основа с мягкой ореховой нотой семечек — вкус округлее, чем у чистого чёрного льна.", eat: "С тостами, творогом или кашей.", prices: { 250: 240, 500: 380, 1000: 700 } },
  "flax-white": { name: "Белый лён", color: "#E2D3B3", group: "seed", ing: "белый лён", plus: "Деликатный вкус · Светлая густая паста", desc: "Более мягкий и деликатный, чем чёрный лён, с лёгкой ореховой нотой.", eat: "В йогурт, кашу или смузи.", prices: { 250: 240, 500: 380, 1000: 700 } },
  "flax-mix": { name: "Ассорти со льном", color: "#7A6B4F", group: "seed", ing: "лён и орехи", plus: "Семенной вкус · Мягкая ореховая нота", desc: "Вкус льна дополнен орехами: густая паста с более мягким и сбалансированным характером.", eat: "С хлебом, фруктами или в кашу.", prices: { 250: 340, 500: 530, 1000: 1000 } },
  "peanut": { name: "Арахисовый", color: "#B87A3D", group: "nut", ing: "арахис", plus: "Выраженный арахисовый вкус · Кремовая текстура", desc: "Насыщенный аромат арахиса и густая кремовая текстура — понятный вкус для первого знакомства.", eat: "С тостами, бананом, в кашу или смузи.", prices: { 250: 340, 500: 530, 1000: 1000 }, hit: true },
  "pistachio": { name: "Фисташковый", color: "#6B8C5C", group: "nut", ing: "фисташка", plus: "Яркий аромат фисташки · Нежная маслянистая текстура", desc: "Чистый фисташковый вкус с лёгкой естественной сладостью и нежной текстурой.", eat: "С круассаном, фруктами или в десерты.", prices: { 250: 950, 500: 1830, 1000: 3600 }, hit: true, badge: "Премиум" },
  "almond": { name: "Миндальный", color: "#DDB97C", group: "nut", ing: "миндаль", plus: "Деликатный аромат · Лёгкая естественная сладость", desc: "Мягкий миндальный вкус и кремовая текстура без приторности.", eat: "С тостами, яблоком, в кашу или кофе.", prices: { 250: 450, 500: 830, 1000: 1600 }, hit: true, badge: "Хит №1" },
  "cashew": { name: "Кешью", color: "#C9A96E", group: "nut", ing: "кешью", plus: "Мягкий сливочно-ореховый вкус · Нежная текстура", desc: "Деликатный сливочно-ореховый вкус и особенно нежная текстура.", eat: "С фруктами, блинами или в десерты.", prices: { 250: 450, 500: 830, 1000: 1600 }, hit: true },
  "almond-cashew": { name: "Миндаль с кешью", color: "#D4B084", group: "nut", ing: "миндаль и кешью", plus: "Миндальный аромат · Мягкость кешью", desc: "Миндальный аромат соединяется с мягкой сливочной текстурой кешью.", eat: "С тостами, сырниками или фруктами.", prices: { 250: 450, 500: 830, 1000: 1600 } },
  "three-nuts": { name: "Три ореха", color: "#A9885C", group: "nut", ing: "миндаль, кешью и арахис", plus: "Три ореха · Округлый насыщенный вкус", desc: "Миндаль, кешью и арахис создают насыщенный, но сбалансированный ореховый вкус.", eat: "На хлеб, в кашу или к фруктам.", prices: { 250: 450, 500: 830, 1000: 1600 } },
  "hazelnut": { name: "Фундук", color: "#8A5A2B", group: "nut", ing: "фундук", plus: "Выразительный аромат · Плотная маслянистая текстура", desc: "Насыщенный вкус фундука с долгим ореховым послевкусием.", eat: "С блинами, кофе или в десерты.", prices: { 250: 450, 500: 780, 1000: 1500 } },
  "hazelnut-cocoa": { name: "Фундук Какао-бобы", color: "#4A2810", group: "nut", ing: "фундук и какао-бобы", plus: "Фундук · Какао · Благородная горчинка", desc: "Глубокий орехово-какао вкус с естественной горчинкой; без приторности в варианте без сахара.", eat: "На тосты, с блинами, бананом или тёплой кашей.", prices: { 250: 540, 500: 980, 1000: 1900 }, hit: true, badge: "Хит продаж" },
  "almond-cocoa": { name: "Миндаль Какао-бобы", color: "#65402C", group: "nut", ing: "миндаль и какао-бобы", plus: "Мягкий миндаль · Насыщенное какао", desc: "Деликатный миндаль смягчает выразительный вкус какао-бобов.", eat: "На тосты, с блинами, фруктами или в кашу.", prices: { 250: 620, 500: 1030, 1000: 1900 } },
  "walnut": { name: "Грецкий орех", color: "#8B7355", group: "nut", ing: "грецкий орех", plus: "Характерный аромат · Лёгкая терпкость", desc: "Выразительный вкус грецкого ореха с лёгкой терпкостью и мягкой горчинкой.", eat: "С мёдом, в кашу или к фруктам.", prices: { 250: 430, 500: 730, 1000: 1400 } },
  "sesame": { name: "Кунжут", color: "#E8DCC0", group: "seed", ing: "кунжут", plus: "Тахини-текстура · Ореховый вкус · Лёгкая горчинка", desc: "Густая кунжутная паста с характерным ореховым вкусом и лёгкой горчинкой.", eat: "В соусы, хумус, выпечку или с мёдом.", prices: { 250: 350, 500: 530, 1000: 1000 } },
  "hemp": { name: "Конопля", color: "#5F7048", group: "seed", ing: "семена конопли", plus: "Мягкий ореховый вкус · Тонкая травяная нота", desc: "Мягкий семенно-ореховый вкус с деликатной травяной нотой.", eat: "В кашу, смузи, соус или на тост.", prices: { 250: 350, 500: 530, 1000: 1000 } },
  "thistle": { name: "Расторопша", color: "#9C9A6E", group: "seed", ing: "семена расторопши", plus: "Травяной характер · Выраженная горчинка", desc: "Яркий семенной вкус с травяной нотой и заметной горчинкой.", eat: "С мёдом, в кашу или смузи.", prices: { 250: 400, 500: 580, 1000: 1100 } }
};
export const COLLECTIONS = {
      "col-intro":  { name: "Первое знакомство", items: ["almond","peanut","hazelnut-cocoa"], price: 1190 },
      "col-nuts":   { name: "Ореховая коллекция",items: ["almond","peanut","cashew","three-nuts"], price: 1490 },
      "col-fav-v2": { name: "Любимые вкусы", items: ["almond","almond-cocoa","cashew"], price: 1390 },
      "col-nature-v2": { name: "Сила природы", items: ["flax-black","flax-white","sesame","hemp","thistle"], price: 1290 },
      "col-full-v2": { name: "Коллекция TURTI", items: ["hazelnut-cocoa","almond","almond-cocoa","cashew","peanut"], price: 2090 },
    };

/* автоподсчёт выгоды набора из реальных цен банок */
for (const c of Object.values(COLLECTIONS)) {
  c.oldPrice = c.items.reduce((s, id) => s + PRODUCTS[id].prices[250], 0);
  c.save = c.oldPrice - c.price;
  c.jars = c.items.length;
}

export const HITS = ["hazelnut-cocoa","almond","peanut","pistachio","cashew"];
export const CAT_NUTS = ["hazelnut-cocoa","almond-cocoa","pistachio","almond","cashew","peanut","hazelnut","walnut","almond-cashew","three-nuts"];
export const CAT_SEEDS = ["sesame","hemp","flax-black","flax-seeds","flax-white","flax-mix","thistle"];
export const SLUGS = {"flax-black":"urbech-chernyi-len","flax-seeds":"urbech-chernyi-len-semechki","flax-white":"urbech-belyi-len","flax-mix":"urbech-assorti-len","peanut":"urbech-arahis","pistachio":"urbech-fistashka","almond":"urbech-mindal","cashew":"urbech-keshyu","almond-cashew":"urbech-mindal-keshyu","three-nuts":"urbech-tri-oreha","hazelnut":"urbech-funduk","hazelnut-cocoa":"urbech-funduk-kakao","almond-cocoa":"urbech-mindal-kakao","walnut":"urbech-greckiy-oreh","sesame":"urbech-kunzhut","hemp":"urbech-konoplya","thistle":"urbech-rastoropsha"};
export const INTENSITY = {"almond":"Мягкий","cashew":"Мягкий","flax-white":"Мягкий","almond-cashew":"Мягкий","pistachio":"Средний","three-nuts":"Средний","peanut":"Средний","hemp":"Средний","flax-seeds":"Средний","flax-mix":"Средний","sesame":"Средний","hazelnut":"Насыщенный","hazelnut-cocoa":"Насыщенный","almond-cocoa":"Насыщенный","walnut":"Насыщенный","flax-black":"Насыщенный","thistle":"Насыщенный"};

/* Пищевая ценность на 100 г: [ккал, белки, жиры, углеводы]
   ⚠️ ПРЕДВАРИТЕЛЬНЫЕ значения. Заменить на данные протокола испытаний. */
export const NUTRI = {};

/* Фотографии банок. Только реально существующие файлы —
   пустые слоты покупателю не показываются. */
export const PHOTOS = {
      "almond":         { 250:"images/almond-250.webp", 500:"images/almond-500.webp", 1000:"images/almond-1000.webp" },
      "hazelnut-cocoa": { 250:"images/hazelnut-cocoa.webp", 500:"images/hazelnut-cocoa.webp", 1000:"images/hazelnut-cocoa.webp" },
      "peanut":         { 250:"images/peanut.webp", 500:"images/peanut.webp", 1000:"images/peanut.webp" },
      "pistachio":      { 250:"images/pistachio-250.png", 500:"images/pistachio-500.png", 1000:"images/pistachio-1000.png" },
    };

/* ═══════════════════════════ ДОСТАВКА ═══════════════════════════ */

export const JAR_WEIGHT = { 250: 0.42, 500: 0.78, 1000: 1.40 }; // кг брутто
export const BOX_WEIGHT = 0.25;                                  // коробка + наполнитель
export const PARCEL_DIMS = { length: 25, width: 20, height: 15 }; // см, для расчёта у перевозчика

export const DELIVERY_METHODS = {
  pickup:  { label: "Самовывоз в Махачкале",  days: "в день заказа", onlyZone: "z1", provider: "self" },
  pvz:     { label: "СДЭК — пункт выдачи",    days: "2–7 дней",  provider: "cdek", map: true },
  courier: { label: "СДЭК — курьер до двери", days: "2–7 дней",  provider: "cdek" },
  ozon:    { label: "Ozon — пункт выдачи",    days: "2–7 дней",  provider: "ozon", map: true, requiresKeys: true },
  post:    { label: "Почта России",           days: "5–14 дней", provider: "post", map: true, note: "до отделения" }
};

export const PAYMENT_METHODS = {
  online: { label: "Картой или СБП на сайте", note: "сразу, чек на почту" },
  cod:    { label: "При получении",           note: "заплатите в пункте выдачи" }
};

export const ORDER_STATUS = ["new","awaiting_payment","paid","processing","shipped","delivered","cancelled"];

export const ZONES = {
      z1: { name: "Дагестан",                cities: ["махачкала","каспийск","дербент","хасавюрт","буйнакск","кизляр","избербаш","кизилюрт","ботлих","дагестанские огни"] },
      z2: { name: "Северный Кавказ и Юг",    cities: ["грозный","назрань","магас","владикавказ","нальчик","черкесск","ставрополь","пятигорск","кисловодск","краснодар","ростов-на-дону","ростов","сочи","астрахань","волгоград","элиста","майкоп","новороссийск","анапа","геленджик","волжский","таганрог","армавир","невинномысск"] },
      z3: { name: "Центр и Поволжье",        cities: ["москва","санкт-петербург","спб","питер","воронеж","казань","самара","саратов","нижний новгород","уфа","пермь","тула","рязань","ярославль","липецк","белгород","тольятти","ижевск","киров","пенза","ульяновск","оренбург","калуга","тверь","курск","тамбов","брянск","смоленск","орёл","орел","владимир","иваново","чебоксары","йошкар-ола","саранск","калининград","псков","новгород","вологда","архангельск","мурманск","сыктывкар","набережные челны","стерлитамак","балаково","энгельс","дзержинск","подольск","химки","мытищи","балашиха","красногорск","люберцы"] },
      z4: { name: "Урал и Западная Сибирь",  cities: ["екатеринбург","челябинск","тюмень","омск","новосибирск","барнаул","кемерово","новокузнецк","томск","курган","магнитогорск","сургут","нижневартовск","нижний тагил","златоуст","бийск","рубцовск","тобольск","ханты-мансийск","салехард","ноябрьск","новый уренгой","каменск-уральский","первоуральск"] },
      z5: { name: "Восточная Сибирь",        cities: ["красноярск","иркутск","улан-удэ","чита","абакан","норильск","братск","ангарск","кызыл","минусинск","ачинск","усолье-сибирское"] },
      z6: { name: "Дальний Восток",          cities: ["владивосток","хабаровск","якутск","благовещенск","комсомольск-на-амуре","петропавловск-камчатский","магадан","южно-сахалинск","находка","уссурийск","артём","артем","биробиджан","анадырь"] }
    };

/* ⚠️ РЕЗЕРВНЫЕ ТАРИФЫ — не настоящие цены перевозчиков.
   Используются ТОЛЬКО когда API недоступен, и всегда помечаются
   для покупателя как ориентировочные. После договора со СДЭК
   реальная цена приходит из /api/delivery. */
export const FALLBACK_TARIFF = {
  z1: { pvz:{base:150,perKg:50},  courier:{base:250,perKg:50},  post:{base:200,perKg:60},  ozon:{base:160,perKg:50}  },
  z2: { pvz:{base:250,perKg:60},  courier:{base:390,perKg:70},  post:{base:280,perKg:70},  ozon:{base:260,perKg:60}  },
  z3: { pvz:{base:320,perKg:70},  courier:{base:480,perKg:90},  post:{base:330,perKg:80},  ozon:{base:330,perKg:70}  },
  z4: { pvz:{base:390,perKg:90},  courier:{base:570,perKg:110}, post:{base:380,perKg:95},  ozon:{base:400,perKg:90}  },
  z5: { pvz:{base:480,perKg:120}, courier:{base:690,perKg:140}, post:{base:450,perKg:120}, ozon:{base:490,perKg:120} },
  z6: { pvz:{base:590,perKg:160}, courier:{base:850,perKg:190}, post:{base:550,perKg:150}, ozon:{base:600,perKg:160} },
  def:{ pvz:{base:390,perKg:90},  courier:{base:570,perKg:110}, post:{base:380,perKg:95},  ozon:{base:400,perKg:90}  }
};

/* ═══════════════════════════ ФУНКЦИИ ═══════════════════════════ */

export const money = v => new Intl.NumberFormat("ru-RU").format(Math.round(v)) + " ₽";

/** Позиция корзины по ключу: "almond|250" или "col-intro" */
export function itemInfo(key) {
  const k = String(key);
  if (k.startsWith("col-")) {
    const c = COLLECTIONS[k];
    return c ? { label: "Набор «" + c.name + "»", sub: c.jars + " банок × 250 г", price: c.price, isSet: true } : null;
  }
  const [id, size] = k.split("|");
  const p = PRODUCTS[id];
  if (!p || !p.prices[size]) return null;
  return { label: p.name, sub: size + " г", price: p.prices[size], id, size: Number(size) };
}

/** Вес посылки в кг по списку позиций [{key, qty}] */
export function orderWeight(items) {
  let w = BOX_WEIGHT;
  for (const it of items || []) {
    const qty = Math.max(1, parseInt(it.qty) || 1);
    const k = String(it.key);
    if (k.startsWith("col-")) {
      const c = COLLECTIONS[k];
      if (c) w += c.jars * JAR_WEIGHT[250] * qty;
    } else {
      const size = parseInt(k.split("|")[1]) || 250;
      w += (JAR_WEIGHT[size] || JAR_WEIGHT[250]) * qty;
    }
  }
  return Math.round(w * 100) / 100;
}

/** Сумма товаров. ЕДИНСТВЕННЫЙ разрешённый способ считать деньги. */
export function goodsTotal(items) {
  let sum = 0;
  for (const it of items || []) {
    const info = itemInfo(it.key);
    if (!info) throw new Error("Неизвестный товар: " + it.key);
    sum += info.price * Math.max(1, Math.min(50, parseInt(it.qty) || 1));
  }
  return sum;
}

export function zoneForCity(city) {
  const c = String(city || "").toLowerCase().trim().replace(/^(г|с|пос|аул)\.?\s*/, "");
  if (!c) return "def";
  for (const [z, data] of Object.entries(ZONES)) {
    if (data.cities.some(n => c.includes(n) || n.includes(c))) return z;
  }
  return "def";
}

/** Резервный расчёт. estimated:true означает «показать как ориентировочную». */
export function fallbackDelivery(city, method, weightKg, goods) {
  const zone = zoneForCity(city);
  const m = DELIVERY_METHODS[method];
  const out = {
    method,
    label: m ? m.label : "Доставка",
    days: m ? m.days : "",
    zone,
    zoneName: zone === "def" ? "" : ZONES[zone].name,
    estimated: true,
    provider: m ? m.provider : "unknown"
  };
  if (method === "pickup") return { ...out, cost: 0, estimated: false, free: true };
  if (goods >= FREE_DELIVERY_THRESHOLD) return { ...out, cost: 0, free: true, estimated: false };
  const t = (FALLBACK_TARIFF[zone] || FALLBACK_TARIFF.def)[method];
  if (!t) return { ...out, cost: null, unavailable: true };
  const extra = Math.max(0, Math.ceil(weightKg) - 1);
  return { ...out, cost: t.base + extra * t.perKg };
}

export function codFee(goods) {
  return Math.ceil(goods * COD_FEE_PERCENT / 100);
}
