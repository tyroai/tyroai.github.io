import { useId } from "react"

/**
 * Beyaz kartın sağ üstündeki raptiye (ürün sahibi: "raptiye ile tutturulmuş gibi gerçekçi, çok büyük
 * olmasın"): yandan, hafif eğik klasik pano raptiyesi — üstte geniş kapak, ince boyun, altta yaka ve
 * karta giren metal iğne. Silindir gölgesi paletin degradesinden (kenarlar koyu, ortada parlama);
 * karta sağ alta düşen yumuşak gölge. Süs (`aria-hidden`), kartla birlikte eğilir. Kimlikler
 * `useId` ile: aynı sahne gizli bir kopyada da çizilebilir.
 */
export function ScenePin() {
  const id = useId().replace(/:/g, "")
  const body = `url(#${id}b)`
  const top = `url(#${id}t)`
  return (
    <svg aria-hidden="true" viewBox="0 0 24 34" className="orb-pin">
      <defs>
        {/* Silindirin yatay ışığı: koyu kenar · parlak şerit · koyu kenar. */}
        <linearGradient id={`${id}b`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="var(--brand-from)" />
          <stop offset="0.3" stopColor="var(--brand-via)" />
          <stop offset="0.42" stopColor="#fff" stopOpacity="0.85" />
          <stop offset="0.55" stopColor="var(--brand-via)" />
          <stop offset="1" stopColor="var(--brand-from)" />
        </linearGradient>
        <radialGradient id={`${id}t`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="0.35" stopColor="var(--brand-to)" />
          <stop offset="1" stopColor="var(--brand-via)" />
        </radialGradient>
        <linearGradient id={`${id}n`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#6b7280" />
          <stop offset="0.5" stopColor="#e5e7eb" />
          <stop offset="1" stopColor="#6b7280" />
        </linearGradient>
        <radialGradient id={`${id}s`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#000" stopOpacity="0.35" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Karta düşen gölge: ışık sol üstten. */}
      <ellipse cx="16.5" cy="30" rx="6.5" ry="2.6" fill={`url(#${id}s)`} />
      <g transform="rotate(16 12 30)">
        {/* İğne: yakadan karta. */}
        <path d="M11.4 22.5h1.2l-0.3 8.5h-0.6z" fill={`url(#${id}n)`} />
        {/* Yaka: alt disk. */}
        <path d="M5.5 20.2a6.5 2 0 0 0 13 0v1.4a6.5 2 0 0 1-13 0z" fill={body} />
        <ellipse cx="12" cy="20.2" rx="6.5" ry="2" fill={top} />
        {/* Boyun: ortası hafif içe çekik. */}
        <path d="M9.2 9.5c0.7 3.4 0.7 6.6 0 10.4h5.6c-0.7-3.8-0.7-7 0-10.4z" fill={body} />
        {/* Kapak: üst disk ve kalınlığı. */}
        <path d="M4.5 6.2a7.5 2.4 0 0 0 15 0v3a7.5 2.4 0 0 1-15 0z" fill={body} />
        <ellipse cx="12" cy="6.2" rx="7.5" ry="2.4" fill={top} />
        <ellipse cx="9.8" cy="5.6" rx="2.6" ry="0.8" fill="#fff" fillOpacity="0.7" />
      </g>
    </svg>
  )
}
