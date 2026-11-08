/** Avans formunun ortak sınıfları: öneri çipi ve metin düğmesi. */
export const CHIP =
  "inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-border bg-background px-3 text-[0.8125rem] font-medium tabular-nums transition hover:border-brand/45 hover:bg-brand/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"

// Dokunmatikte vuruş alanı görünmez bir kenarla büyür (metnin akışı bozulmaz).
export const TEXT_BUTTON =
  "relative rounded font-semibold text-brand-ink transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-3.5"

/** Seçici açılınca hücre kardeşlerinin üstüne çıkar (`SlotGrid` ile aynı). */
export const CELL = "relative min-w-0 has-[[data-morph-open]]:z-30"

// Karoların ortak boyu: ödeme ve belge karosu dar sütunda iki satır (16 px etiket, 3 px, 28 px
// düğmeler, 2 px çerçeve + rem iç boşluk) — öteki karolar da onunla aynı boyda. Düğmeler piksel:
// alçak ekranda kök yazı küçülse de ≥ 24 px. Dokunmatikte karonun kendi 64 px'i.
export const TILE_H = "min-h-[calc(0.75rem+49px)]"

// ⓘ düğmesi dokunmatikte görünmez bir kenarla 44 px vuruş alanı alır (görünüşü aynı).
export const TIP_HIT = "relative pointer-coarse:after:absolute pointer-coarse:after:-inset-3"

/** Karonun adı ve durumu: etiket + değer okunur, hata cümlesine bağlanır. */
export const tileAria = (id, err) => ({
  "aria-labelledby": `${id}-label ${id}-value`,
  "aria-invalid": err ? true : undefined,
  "aria-describedby": err ? `${id}-error` : undefined,
})
