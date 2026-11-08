import { CATALOG } from "@/features/widgets/layout"
import { cn } from "@/lib/utils"
import { headerOf } from "@/features/widgets/registry"

// Header'ın öteki ikon düğmeleriyle aynı ölçü (36 px, dokunmatikte görünmez payla 44 px);
// açıkken macOS'un menü çubuğundaki gibi vurgu kapsülü. Yan pay 6 px ve ikonlar bitişik: tepsi
// menü çubuğu gibi sıkı (düzenlerken aralık 12 px, `EditTray`). İkon boyu ikonun kendisinde (`size-5`):
// düğmenin bütün SVG'lerini boyutlayan kural kürenin kulaklığını ve hava simgesinin bulutunu
// küçültüp kaydırıyordu.
export const TRAY_BTN =
  "relative inline-flex h-9 min-w-9 shrink-0 items-center justify-center gap-1 rounded-xl px-1.5 text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 aria-expanded:bg-accent pointer-coarse:after:absolute pointer-coarse:after:-inset-1"

// Yüzün yaklaşık genişliği (px, kayıtta `header.width`): tepsi topluyken açılınca sığar mı tahmini
// (`useTrayFits`; açıkken ölçülür). Canlı bilgisi olanlar ikondan geniş; radyo çalarken kapsül.
/**
 * Yüzün tahmini genişliği, seçilen yüzle (`faceOptions`): yalnız simge 40; gecikenler ve
 * okunmamışlar 64; piyasada kur başına ~84 px (simge + değer + ok); havada aralık ("22° / 14°"); kapsül kenar payı +12.
 */
const SHOW_WIDTH = { icon: 40, late: 64, unread: 64 }

export function faceWidth(id, face, chip) {
  const pad = chip && chip !== "standard" ? 12 : 0
  if (SHOW_WIDTH[face?.show]) return SHOW_WIDTH[face.show] + pad
  // Piyasa: grafik ikonu yok; kur başına simge + değer + ok (~84 px), düğmenin payı 12.
  if (id === "market" && face?.show !== "icon") return 12 + 84 * (face?.codes?.length ?? 1) + pad
  if (id === "weather" && face?.show === "range") return 104 + pad
  return (headerOf(id).width ?? 40) + pad
}

/** Panodaki satırın boyu (15rem); geniş widget'ların penceresi de geniş. */
export const panelWidth = (id) =>
  CATALOG[id]?.wide ? "w-[min(34rem,calc(100vw-1.5rem))]" : "w-[min(22.5rem,calc(100vw-1.5rem))]"

// Pencere kartın kendisi: zemin, kenar ve köşe kartta; burada yalnız yüzen gölge.
export const FLOATING =
  "gap-0 rounded-[1.75rem] bg-transparent p-0 text-foreground shadow-[0_28px_70px_-24px_rgb(15_23_42/0.45)] ring-0 dark:shadow-[0_28px_70px_-20px_rgb(0_0_0/0.8)]"

// Tyrofy'ın sahnesi kendi gölgesini ve halesini taşır; pencerenin köşeli gölgesi kartın büyük
// köşesinin dışında görünürdü. Boyu Anasayfa'nın mini kartı kadar (16rem × 15rem, oranı
// `stage.css`te): daha büyüğü pencerede fazla yer kaplıyordu.
const STAGE = "w-64 gap-0 rounded-[2.5rem] bg-transparent p-0 text-foreground shadow-none ring-0"

/** Tek widget'ın penceresinin sınıfı (tepsi ve çentik ortak): yüzen gölge + en. */
export function panelClass(id) {
  if (id === "radio") return STAGE
  return cn(FLOATING, id === "market" ? "w-[min(24rem,calc(100vw-1.5rem))]" : panelWidth(id))
}

// Düzenleme panellerinin dili (header tepsisi ve çentiğin yuva seçicisi): Apple'ın gruplu listesi —
// yumuşak zemin, ince ayraçlar; bölüm başlığı ve yuvarlak denetim düğmesi.
export const GROUP =
  "overflow-hidden rounded-2xl bg-foreground/[0.035] ring-1 ring-foreground/[0.06] divide-y divide-foreground/[0.06]"
export const HEAD = "px-3 pb-1.5 text-[0.75rem] font-medium text-muted-foreground"
export const CTL =
  "grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:size-11"
