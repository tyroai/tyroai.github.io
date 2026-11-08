/**
 * "Avans özeti" panelinin bölüm ölçüleri. Panel formun kabına göre iki boyda: dar pencerede ve
 * telefonda girişlerin altında sıkı kart, geniş pencerede (form ≥ 52rem) sağda yapışık sütun —
 * izin formunun etki kartıyla aynı iç boşluk ve başlık boyu. Kart, çip ve kırmızı çip masraf
 * özetinden (`expense/summary/summaryUi`): üç formun özeti aynı görünsün.
 */

/** Kartın bir bölümü: üstte ince çizgi. */
export const SECTION =
  "border-t border-black/[0.06] px-4 py-3 dark:border-white/[0.08] @[52rem]/form:px-5"

/** Bölüm adı: sıkı kartta etiket boyu, yan sütunda kart başlığı boyu. */
export const TITLE =
  "flex items-center gap-2 text-[0.8125rem] font-semibold leading-snug @[52rem]/form:text-[0.9375rem]"

// Sıkı kartın "Ayrıntı" düğmesi (yalnız dar pencerede): tam genişlik, en az 44 px.
export const TOGGLE =
  "flex min-h-11 w-full items-center gap-3 border-t border-black/[0.06] px-4 text-start text-[0.8125rem] transition hover:bg-foreground/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 dark:border-white/[0.08] @[52rem]/form:hidden"

// "Eksikler" çipi: hep hafif kırmızı (eksik = kırmızı); gönderme denendikten sonra çerçevesi
// koyulaşır. Alana götürür; dokunmatikte 44 px. Küçük yazıda koyu ton (`-ink`).
export const MISSING_CHIP =
  "inline-flex h-[max(1.75rem,24px)] max-w-full items-center rounded-full border border-danger/20 bg-danger/[0.08] px-2.5 text-[0.75rem] font-medium text-danger-ink transition hover:border-danger/40 hover:bg-danger/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11 pointer-coarse:px-3.5"
export const MISSING_CHIP_TRIED = "border-danger/45 bg-danger/[0.1]"

/** Durum yazısı: tamam yeşil, eksik (denendikten sonra) kırmızı, uyarı sarı. */
export const OK_INK = "text-success-ink"
export const NEED_INK = "text-danger-ink"
