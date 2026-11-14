import { knownPaletteId } from "@/data/palettes"
import { REGISTRY } from "./registry"

/**
 * Pano'nun yerleşimi — sıra, bölge ve genişlik BURADA, bileşenlerde değil;
 * kişinin düzeni (`useWidgetLayout`) bu listeden türer, widget'lar aynı kalır.
 *
 * ÜÇ BÖLGE (`zone`), tek düzenleme kipi:
 * - `left` — ana bölümün SOL SÜTUNU, Anasayfa'nın karşılama kolonu: genişliği
 *   onunki (0.74fr), satırları hava kartının (232px) ve soru kutusunun boyunda.
 * - `main` — ana bölümün sağ ızgarası (1 → 2 → 3 sütun): brifing² · sıradaki
 *   toplantı / ritim² · yardım küresi. Yeni widget buraya da eklenebilir.
 * - `more` — "Diğer widget'lar" (1 → 2 → 4 sütun; 3 sütun yok — son satırda
 *   tek kart kalıyordu). Varsayılan 2 ve 4 sütunda boşluksuz (birim testi).
 * Her satır sabit boyda: yan yana kartlar kendiliğinden hizalı. Hiçbir widget
 * simetri için gizlenmez; denge genişlikle kurulur.
 */
const HALF = "@[34rem]/myspace:col-span-2"
export const ZONES = ["left", "main", "more"]

const DEFAULT_ORDER = [
  ["tyro-welcome", "left"],
  ["ask", "left"],
  ["brief", "main", true],
  ["next-meeting", "main"],
  ["rhythm", "main", true],
  ["help", "main"],
  ["pending-mail", "more"],
  ["planner", "more"],
  ["tyro-fx", "more"],
  ["team-today", "more", true],
  ["holiday", "more"],
  ["travel", "more"],
  ["market", "more", true],
  ["focus", "more", true],
  ["outcomes", "more", true],
  ["focus-window", "more"],
  ["tyro-translate", "more", true],
]

/**
 * Pano'nun bütün widget'ları: başlık (kısa açıklama `widgets.catalog.<id>`,
 * Widget ekle menüsü), eklenince alacağı genişlik ve — varsa — gideceği bölge. Kayıt
 * defterinin kendisi (`registry.js`); kart yalnız `title`, `wide`, `zone`, `looks`,
 * `ownPalette` alanlarını okur — ayrı kopya ilk pakete bayt eklerdi.
 */
export const CATALOG = REGISTRY

/** Adı değişen widget'lar: eski kimlik → yeni (kayıtlı düzen ve görünümler okunurken). */
export const RENAMED = { "radio-list": "radio" }

/**
 * Birleşen kartlar (sadeleştirme): katalogdan kalkan kimlik → içine katıldığı kart. Kayıtlı düzende
 * ve header'da yeni karta döner; o kart zaten duruyorsa eskisi düşer (bilgisi orada). Haftam,
 * Toplantı ritminin küçük hâli oldu; Bugüne al, Bugünün odağının öneri tepsisi; TYRO öneriyor,
 * yardım küresinin öneri yüzü (kürenin görünüm seçeneği yok: eski kartın görünümü düşer). Ticket
 * Talepler'in liste kartı halkalı sürümüne katıldı.
 */
export const MERGED = { week: "rhythm", suggest: "focus", nudge: "help", tibot: "tibot-rings" }

/**
 * Panodan kalkıp yalnız header'da yaşayan kartlar (`board: false`) → kayıtlı düzende yerine geçen
 * kart; o zaten duruyorsa eskisi düşer (kalkan kartlar da: kimliği katalogda olmasa bile). Tyrofy'ın
 * istasyon listeli ilk kartı Tyrofy Disk'e döner. Header'daki Tyrofy aynı kimlikle sürdüğü için `MERGED`e yazılmaz (header da onu okur).
 */
export const BOARD_RETIRED = {
  radio: "tyro-radio-disc",
  // Sol üstteki karşılama kartları tek karta indi (ürün sahibi): hava kartı (yalnız header'da), eski
  // Karşılama (palet kartı) ve Master kart yerinde Karşılama kartına döner.
  weather: "tyro-welcome",
  "weather-plain": "tyro-welcome",
  intro: "tyro-welcome",
  "tyro-master": "tyro-welcome",
}

/** Panoya girebilen widget (katalog ve ekleme listesi). */
export const onBoard = (id) => Boolean(CATALOG[id]) && CATALOG[id].board !== false

/**
 * İkiz kartlar — aynı kartın iki hâli; katalogda tek satır, öteki hâl kartın ayarıdır (••• menüsü
 * ve düzenleme şeridi). Hava: selamlamalı (`weather`) · selamlamasız (`weather-plain`). Ayar
 * değişince yuvadaki kimlik değişir (`swapMember`); `on`: bu hâlde ayar açık mı.
 */
export const TWINS = {
  weather: { to: "weather-plain", label: "widgets.weather.greeting", on: true },
  "weather-plain": { to: "weather", label: "widgets.weather.greeting", on: false },
}

/**
 * Görünüm seçenekleri (Düzenle › Görünüm), ilki varsayılan: kartların çoğu Standart (temayı
 * izler) · Açık · Koyu (temadan bağımsız) · Cam · Renkli (paletin degradesi); Karşılama renkli ·
 * cam · sade; hava kartlarında yok.
 */
export const STANDARD_LOOKS = ["standard", "light", "dark", "glass", "palette"]
export const looksOf = (id) =>
  CATALOG[id]?.looks === false ? [] : (CATALOG[id]?.looks ?? STANDARD_LOOKS)

/**
 * Kişiye açık mı: kayıttaki `access` (Keşfet seçkisi Keşfet'e, To-Do özeti To-Do'ya, İzin
 * bakiyem ve Taleplerim Self Servis'e, tyroRM nabzı tyroRM yetkisi olana).
 */
export const widgetAvailable = (id, pageAccess) => {
  const need = REGISTRY[id]?.access
  return !need || Boolean(pageAccess?.[need])
}

/**
 * Geçerli görünüm mü: seçeneklerden biri, ya da biri + widget'ın kendi rengi (`<görünüm>:<palet>`,
 * bilinen palet; ör. `glass:green-garden`).
 */
export function validLook(id, value) {
  if (typeof value !== "string") return false
  const [base, palette, ...rest] = value.split(":")
  if (rest.length || !looksOf(id).includes(base)) return false
  return palette === undefined || knownPaletteId(palette) === palette
}

/** Bölge ve genişlik → ızgara sınıfı: sol sütunda kart sütunun genişliğinde. */
export const spanOf = (zone, wide) => (zone !== "left" && wide ? HALF : "")

const toLayout = (order) => order.map(([id, zone, wide]) => ({ id, zone, wide: Boolean(wide) }))

/** Varsayılan düzen `[{ id, zone, wide }]` — bölge içinde sıra ızgaradaki sıradır. */
export const DEFAULT_LAYOUT = toLayout(DEFAULT_ORDER)

// Anasayfa'nın varsayılanı. 2+1+1 kalıbı (tek ızgara, `boardGrid.css`; ürün sahibinin dizilişi): üstte karşılama + Toplantı
// ritmin + Sıradaki toplantı, altta TYRO brifingi (geniş) + Bugünün görevleri + TYRO kartı (sağ
// altta, sıradaki toplantının altında). Soru kutusu kayıtta, çizilmez (yüzen sohbet çubuğu).
export const HOME_LAYOUT = toLayout([
  ["tyro-welcome", "left"],
  ["ask", "left"],
  ["rhythm", "main"],
  ["next-meeting", "main"],
  ["brief", "main", true],
  ["focus", "main"],
  ["help", "main"],
])

/**
 * Panolar — aynı düzenleme, farklı kayıt ve bölgeler. Pano: üç bölge, yeni widget
 * "Diğer"e. Anasayfa: "Diğer" YOK — her şey ana bölümde (asistan ayracının üstünde),
 * yeni widget ana bölümün sonuna. `tour`: Anasayfa turunun hedefleri yuvalarda.
 */
export const BOARDS = {
  pano: {
    id: "pano",
    key: "tyro-widgets-layout-v1",
    version: 7,
    zones: ZONES,
    defaults: DEFAULT_LAYOUT,
    addZone: "more",
    labels: { bar: "widgets.editBar" },
  },
  home: {
    id: "home",
    key: "tyro-home-layout-v1",
    version: 4,
    zones: ["left", "main"],
    defaults: HOME_LAYOUT,
    addZone: "main",
    labels: { bar: "widgets.editBarHome" },
    // Soru kutusu kart olarak çizilmez (sayfanın altındaki yüzen çubuk; turun "Sor" adımı onu
    // gösterir, `myspace/shelf/HomeCommand`).
    tour: {
      "tyro-welcome": "welcome",
    },
  },
}
