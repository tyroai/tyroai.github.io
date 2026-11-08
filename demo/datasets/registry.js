// Veri seti kayıt defteri: bir ANA set ve altı sektör seti. Ad, unvan ve şirket hepsinde aynıdır
// (demo/persona.js); yalnız müşteriler, ürünler, takvim, posta, görevler ve akış değişir.
export const DATASETS = [
  {
    id: "ana",
    icon: "layers",
    label: { tr: "Ana veri seti", en: "Main dataset" },
    desc: { tr: "Karma, genel B2B satış çalışma alanı", en: "Mixed, general B2B sales workspace" },
  },
  {
    id: "beyaz-esya",
    icon: "washing",
    label: { tr: "Beyaz Eşya", en: "Home Appliances" },
    desc: { tr: "Bayi ve zincir mağaza satışı, kampanya dönemleri", en: "Dealer and retail-chain sales, campaign seasons" },
  },
  {
    id: "teknoloji",
    icon: "cpu",
    label: { tr: "Teknoloji", en: "Technology" },
    desc: { tr: "Kurumsal yazılım ve donanım satışı", en: "Enterprise software and hardware sales" },
  },
  {
    id: "tarim",
    icon: "wheat",
    label: { tr: "Tarım", en: "Agriculture" },
    desc: { tr: "Tohum, gübre ve hasat dönemi satışları", en: "Seed, fertiliser and harvest-season sales" },
  },
  {
    id: "otomotiv",
    icon: "car",
    label: { tr: "Otomotiv", en: "Automotive" },
    desc: { tr: "Yedek parça, yetkili servis ve filo satışı", en: "Spare parts, service networks and fleet sales" },
  },
  {
    id: "gida-icecek",
    icon: "food",
    label: { tr: "Gıda & İçecek", en: "Food & Beverage" },
    desc: { tr: "Market zincirleri, HoReCa ve ihracat", en: "Retail chains, HoReCa and export" },
  },
  {
    id: "saglik",
    icon: "health",
    label: { tr: "Sağlık & İlaç", en: "Healthcare & Pharma" },
    desc: { tr: "Hastane, eczane ve ilaç dağıtım kanalı", en: "Hospital, pharmacy and distribution channels" },
  },
]

export const DEFAULT_ID = "ana"
const KEY = "demo-dataset"
const valid = (id) => DATASETS.some((d) => d.id === id)

/** Adres (`?set=tarim`) önce, sonra son seçim, yoksa ana set. */
export function pickDatasetId() {
  try {
    const q = new URLSearchParams(window.location.search).get("set")
    if (valid(q)) {
      window.localStorage.setItem(KEY, q)
      return q
    }
  } catch {
    /* depo yok: varsayılana düş */
  }
  try {
    const saved = window.localStorage.getItem(KEY)
    if (valid(saved)) return saved
  } catch {
    /* depo yok */
  }
  return DEFAULT_ID
}

const loaders = import.meta.glob("./sets/*.js")

export async function loadDataset(id) {
  const load = loaders[`./sets/${id}.js`] ?? loaders[`./sets/${DEFAULT_ID}.js`]
  return (await load()).default
}

// Veri setine bağlı her şey (önbellekler, sohbet dökümü, favoriler) silinir; tercihler (tema, palet,
// dil) kalır. Set değişince sayfa baştan yüklenir: en sağlam yol.
const KEEP = /^(tyro-(theme|palette|locale|locale-v2|word-color)|demo-)/

export function switchDataset(id) {
  if (!valid(id)) return
  try {
    window.sessionStorage.clear()
    for (const k of Object.keys(window.localStorage)) if (!KEEP.test(k)) window.localStorage.removeItem(k)
    window.localStorage.setItem(KEY, id)
  } catch {
    /* depo yok: adres parametresi yeter */
  }
  const url = new URL(window.location.href)
  url.searchParams.set("set", id)
  window.location.assign(url.toString())
}
