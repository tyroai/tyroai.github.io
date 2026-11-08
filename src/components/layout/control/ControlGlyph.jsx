/**
 * Denetim Merkezi'nin simgesi: iki anahtar üst üste (macOS'un simgesi gibi; üstteki açık,
 * alttaki kapalı). Hugeicons'ta birebiri yok: çizgi kalınlığı ve 24'lük ızgara yanındaki çanla
 * aynı (1,8), iki kapsül ve düğmeleri merkeze göre simetrik.
 */
export function ControlGlyph({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <rect x="3" y="4" width="18" height="7" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17.5" cy="7.5" r="1.75" fill="currentColor" />
      <rect x="3" y="13" width="18" height="7" rx="3.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6.5" cy="16.5" r="1.75" fill="currentColor" />
    </svg>
  )
}

/**
 * Görünüm (açık/koyu) simgesi: yarısı dolu daire, macOS'un Koyu Görünüm simgesi gibi. Ay Odak
 * modunun simgesi; ikisi karışmasın. Hugeicons'ın çizgi kalınlığında.
 */
export function AppearanceGlyph({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={className}>
      <circle cx="12" cy="12" r="8.75" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3.25a8.75 8.75 0 0 0 0 17.5Z" fill="currentColor" />
    </svg>
  )
}
