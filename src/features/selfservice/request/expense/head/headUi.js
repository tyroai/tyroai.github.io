/** Masraf başlığının ortak görünümü (marka mürekkebi, marka etiketi). */

// Marka mürekkebi yazıya biraz yaklaştırılır: açık amber, sky, sunset paletlerinde mürekkep
// paletin orta tonu, %10 marka zemininde 4,5:1'in altında kalıyordu. Bu karışım 17 paletin
// hepsinde, iki temada da ≥ 5,1:1 (ölçüldü); renk tonu aynı kalır.
export const INK = "text-[color-mix(in_oklab,var(--brand-ink)_65%,var(--foreground))]"

// "Başkası adına": tek marka tonu (zemin %10, yazı marka mürekkebi).
export const PILL = `inline-flex h-[1.125rem] shrink-0 items-center whitespace-nowrap rounded-full bg-brand/[0.1] px-1.5 text-[0.75rem] font-semibold leading-none tracking-[0.01em] ${INK}`
