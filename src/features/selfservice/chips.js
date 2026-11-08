/**
 * Self Servis'in sade filtre düğmeleri (durum filtresi, filtre çekmecesi) — tek giysi: çerçevesiz
 * yazı; seçili olan hafif zeminli ve koyu, ötekiler soluk. Boy ortak ölçüden (`h-control`: araç
 * çubuğu, dokunmatikte 44 px — `docs/design-tokens.md`).
 */
export const CHIP =
  "inline-flex h-control shrink-0 items-center gap-1.5 rounded-full px-3 text-callout transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
export const CHIP_ON = "bg-foreground/[0.07] font-semibold text-foreground"
export const CHIP_OFF = "font-medium text-foreground/65 hover:text-foreground"

/**
 * Çerçevesiz araç düğmesi (Yenile, Dışa aktar, Rapor): çubukta sessiz durur, üzerine gelince
 * belirir. Yalnız ikonluysa `ICON` ile kare. Boy ve yazı ortak ölçüden (araç çubuğu).
 */
export const GHOST =
  "inline-flex h-control shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-callout text-foreground/75 transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-icon"
export const ICON = "min-w-control px-0"
