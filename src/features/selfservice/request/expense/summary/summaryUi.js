import { cn } from "@/lib/utils"

/**
 * Masraf özeti panelinin ortak görünümü. İki yerleşim: yan panel (`side`: izin formunun etki
 * kartıyla aynı ölçüler, alt alta) ve sıkı özet (kalemlerin üstünde; ayrıntısı açılır). Sıkı
 * özetin içi kendi kabının enine göre: telefonda alt alta, şeritte (`@[36rem]/summary`) yan yana.
 */

export const CARD =
  "overflow-hidden rounded-2xl border border-black/[0.08] bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-16px_rgb(0_0_0/0.12)] dark:border-white/[0.1]"

/** Hücre: yan panelde etki kartının iç boşluğu, sıkı özette daha dar. */
export const cell = (side) => (side ? "min-w-0 px-5 py-3.5" : "min-w-0 px-4 py-3")

export const RULE = "border-black/[0.06] dark:border-white/[0.08]"

/** Bölüm adı: yan panelde kart başlığı boyu (15 px), sıkı özette etiket boyu. */
export const title = (side) =>
  cn(
    "flex items-center gap-2 font-semibold leading-snug",
    side ? "text-[0.9375rem]" : "text-[0.8125rem]",
  )

export const NOTE = "text-[0.75rem] leading-snug text-muted-foreground"

// Alana götüren çip: en az 24 px (alçak ekranda kök yazı küçülse de), dokunmatikte 44 px.
export const CHIP =
  "inline-flex h-[max(1.75rem,24px)] max-w-full items-center rounded-full border border-border bg-background px-2.5 text-[0.75rem] font-medium text-foreground transition hover:border-brand/45 hover:bg-brand/[0.05] hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11 pointer-coarse:px-3.5"

// Eksik alanın çipi (formların "eksik" dili): hafif kırmızı zemin ve çerçeve, kırmızı yazı.
export const CHIP_NEED =
  "border-danger/20 bg-danger/[0.08] text-danger-ink hover:border-danger/40 hover:bg-danger/[0.12] hover:text-danger-ink"

// Gönderme denemesinden sonra hatası görünen alanın çipi: net kırmızı çerçeve.
export const CHIP_ERROR =
  "border-danger/55 bg-danger/[0.1] text-danger-ink hover:border-danger/75 hover:bg-danger/[0.14] hover:text-danger-ink"

/** Bölüm başlığının yanındaki sayı rozeti; `tone`: durumun zemin ve yazı sınıfları. */
export const COUNT =
  "grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[0.6875rem] font-semibold tabular-nums"

// Kalem numarası çipi ("Fişsiz: 3"): yuvarlak, dokunmatikte 44 px.
export const NUM_CHIP =
  "grid h-[max(1.5rem,24px)] min-w-[max(1.5rem,24px)] place-items-center rounded-full border border-border bg-background px-1.5 text-[0.75rem] font-semibold tabular-nums text-foreground/85 transition hover:border-brand/45 hover:bg-brand/[0.05] hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11 pointer-coarse:min-w-11"

// Metin düğmesi; dokunmatikte vuruş alanı görünmez bir kenarla büyür.
export const TXT_BTN =
  "relative inline-flex min-h-6 items-center gap-1 rounded text-[0.8125rem] font-semibold text-brand-ink transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:after:absolute pointer-coarse:after:-inset-x-2 pointer-coarse:after:-inset-y-2.5"

// Kategori dağılımının tonları (marka rengi, koyudan açığa); kalan kategoriler nötr.
export const TONES = ["bg-brand-fill-deep", "bg-brand/60", "bg-brand/35", "bg-brand/20"]
export const REST_TONE = "bg-foreground/20"

// Yan panel kendi içinde kayınca üstte/altta yumuşak gölge: devamı olduğu görünsün (kaplama
// katmanları içerikle kayar, gölgeler sabit; yalnız taşınca görünür). İnce kaydırma çubuğu.
export const SIDE_SCROLL =
  "max-h-(--summary-max) overflow-y-auto overscroll-contain [scrollbar-width:thin] [--fade:rgb(0_0_0/0.1)] dark:[--fade:rgb(0_0_0/0.5)] [background:linear-gradient(var(--card)_30%,transparent)_top/100%_2.5rem_no-repeat_local,linear-gradient(transparent,var(--card)_70%)_bottom/100%_2.5rem_no-repeat_local,radial-gradient(farthest-side_at_50%_0,var(--fade),transparent)_top/100%_0.75rem_no-repeat_scroll,radial-gradient(farthest-side_at_50%_100%,var(--fade),transparent)_bottom/100%_0.75rem_no-repeat_scroll,var(--card)]"
