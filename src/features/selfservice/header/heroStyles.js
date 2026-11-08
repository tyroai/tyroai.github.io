/**
 * Gradyan kartın (`SelfHero`) cam hapları — To-Do karşılama kartının hapıyla aynı tarif: beyaz
 * mürekkepte markanın koyulaştırılmış tonu (yazı her palette okunur), koyu mürekkepte yarı
 * saydam beyaz. Kart `group/herocard` + `data-ink` taşır (`useGradientInk`).
 */
export const FROST =
  "bg-[color-mix(in_oklch,color-mix(in_oklch,var(--brand-from),black_40%),transparent_55%)] ring-1 ring-white/30 backdrop-blur-sm transition hover:bg-[color-mix(in_oklch,color-mix(in_oklch,var(--brand-from),black_40%),transparent_40%)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 group-data-[ink=dark]/herocard:bg-white/45 group-data-[ink=dark]/herocard:ring-white/60 group-data-[ink=dark]/herocard:hover:bg-white/60"

/** Aynı cam, üstüne gelince değişmeyen zemin (telefonun kişi şeridi: hücreler kendisi tepki verir). */
export const FROST_BASE =
  "bg-[color-mix(in_oklch,color-mix(in_oklch,var(--brand-from),black_40%),transparent_55%)] ring-1 ring-white/30 backdrop-blur-sm group-data-[ink=dark]/herocard:bg-white/45 group-data-[ink=dark]/herocard:ring-white/60"

/** Kartın içindeki beyaz tepsi (To-Do'nun durum tepsisi): düz kart, yumuşak gölge. */
export const TRAY =
  "relative min-w-0 self-center rounded-[1.375rem] bg-card p-1.5 text-card-foreground shadow-[0_14px_32px_-18px_rgb(0_0_0/0.5)] ring-1 ring-black/[0.05] dark:ring-white/10"

/** Kartın kabuğu: büyük yuvarlak köşe ve altına marka renginde yumuşak gölge. */
export const HERO =
  "group/herocard relative isolate min-w-0 overflow-hidden rounded-[1.75rem] p-4 text-[color:var(--hero-ink)] shadow-[0_18px_40px_-24px_var(--brand-via)] @[40rem]/ss:p-5"

/** Karttaki soluk yazı: mürekkebin %80'i (gradyanın üstünde AA). */
export const SOFT_INK = "text-[color:color-mix(in_oklch,var(--hero-ink)_82%,transparent)]"
