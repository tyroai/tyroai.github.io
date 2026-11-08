/**
 * Bölge havasının üretim bölgeleri: ülke (`cc`, adı `Intl.DisplayNames`'ten), bölgeyi temsil
 * eden tek nokta [enlem, boylam] (NASA POWER ızgarası ~50 km: bölgenin ortası, tarlanın kendisi
 * değil), MET günleri için saat dilimi ve başlıca ürünler (`widgets.region.crop.*`). Adlar
 * `widgets.region.name.<id>` (dört sözlük). Normaller `data/regionNormals.js`: bölge
 * eklenince `node scripts/region-normals.mjs` (birim testi eksik normali yakalar).
 */
export const REGIONS = [
  { id: "konya", cc: "TR", at: [37.87, 32.48], tz: "Europe/Istanbul", crops: ["wheat", "barley"] },
  {
    id: "trakya",
    cc: "TR",
    at: [41.4, 27.35],
    tz: "Europe/Istanbul",
    crops: ["sunflower", "wheat"],
  },
  { id: "cukurova", cc: "TR", at: [36.98, 35.32], tz: "Europe/Istanbul", crops: ["corn", "wheat"] },
  { id: "harran", cc: "TR", at: [36.86, 39.03], tz: "Europe/Istanbul", crops: ["wheat", "lentil"] },
  {
    id: "krasnodar",
    cc: "RU",
    at: [45.04, 38.98],
    tz: "Europe/Moscow",
    crops: ["wheat", "sunflower"],
  },
  {
    id: "rostov",
    cc: "RU",
    at: [47.23, 39.72],
    tz: "Europe/Moscow",
    crops: ["wheat", "sunflower"],
  },
  {
    id: "volga",
    cc: "RU",
    at: [51.53, 46.03],
    tz: "Europe/Saratov",
    crops: ["wheat", "sunflower"],
  },
  {
    id: "odesa",
    cc: "UA",
    at: [46.48, 30.73],
    tz: "Europe/Kyiv",
    crops: ["wheat", "corn", "sunflower"],
  },
  {
    id: "baragan",
    cc: "RO",
    at: [44.56, 27.37],
    tz: "Europe/Bucharest",
    crops: ["wheat", "corn", "sunflower"],
  },
  { id: "kostanay", cc: "KZ", at: [53.21, 63.63], tz: "Asia/Qostanay", crops: ["wheat"] },
  {
    id: "saskatchewan",
    cc: "CA",
    at: [51.5, -105.5],
    tz: "America/Regina",
    crops: ["lentil", "pea", "wheat"],
  },
  { id: "kansas", cc: "US", at: [38.5, -98.5], tz: "America/Chicago", crops: ["wheat"] },
  { id: "illinois", cc: "US", at: [40.0, -89.0], tz: "America/Chicago", crops: ["corn", "soy"] },
  { id: "matogrosso", cc: "BR", at: [-13.0, -56.0], tz: "America/Cuiaba", crops: ["soy", "corn"] },
  {
    id: "pampa",
    cc: "AR",
    at: [-36.0, -61.0],
    tz: "America/Argentina/Buenos_Aires",
    crops: ["wheat", "soy", "corn"],
  },
  { id: "nsw", cc: "AU", at: [-33.0, 147.0], tz: "Australia/Sydney", crops: ["wheat", "barley"] },
]

export const DEFAULT_REGIONS = ["konya", "trakya", "krasnodar"]
export const MAX_REGIONS = 3

export const regionById = (id) => REGIONS.find((r) => r.id === id) ?? null
