/** Masraf kalem kartlarının ortak sınıfları (telefon ve dar pencere); klavye ve kaydırma `lineFocus`. */

/** Kartın ince kenarı; bölümler arası çizgi biraz daha soluk. */
export const EDGE = "border-black/[0.08] dark:border-white/[0.1]"
export const RULE = "border-black/[0.06] dark:border-white/[0.08]"

/** Açık kalemin kartı: beyaz yüzey, ince kenar, yumuşak gölge (izin formunun etki kartıyla aynı). */
export const CARD_SHADOW = "shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-16px_rgb(0_0_0/0.12)]"

// Metin düğmesi (Kopyala · Sil · Ayrıntı): dokunmatikte görünmez bir kenarla 44 px'e büyür.
export const TEXT_BTN =
  "relative inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-[0.8125rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-45 pointer-coarse:after:absolute pointer-coarse:after:-inset-y-1.5 pointer-coarse:after:inset-x-0 [&_svg]:size-4"

/** Satır içi yazı alanı (tutar, açıklama, ayrıntılar): dinlenirken çizgisiz; durumları `lineList.css`. */
export const INPUT =
  "xl-input no-ios-zoom h-10 w-full min-w-0 rounded-[0.625rem] px-3 text-end text-[0.875rem] text-foreground outline-none transition-[background-color,box-shadow] placeholder:text-muted-foreground/75 pointer-coarse:h-11"

/** Kapalı kalemin numara rozeti (`NumberBadge`): biraz küçük, sakin zeminli. */
export const BADGE_REST = "bg-foreground/[0.06] text-foreground/75"
export const BADGE_SMALL = "size-[1.375rem]"
