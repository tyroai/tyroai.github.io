import { useId } from "react"
import "./dome.css"

// Kubbe: yarım daire (yarıçap 196), üstünde kenar parçacıkları için pay.
export const W = 400
export const H = 236
export const R = 196
export const CX = 200
export const CY = 226

/** Tohumlu rastgele (mulberry32): kenar parçacıkları her çizimde aynı. */
function rng(seed) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Kubbenin kenarında dağılan kareler (üç saydamlık kademesi, her biri tek yol). */
function rimPaths() {
  const rand = rng(7)
  const tiers = ["", "", ""]
  for (let i = 0; i < 640; i += 1) {
    const angle = Math.PI * (1.02 + rand() * 0.96)
    // Kenara yakın yoğun, dışarı doğru seyrek; solda biraz daha dağınık (referanstaki gibi).
    const spread = 20 + 10 * Math.max(0, -Math.cos(angle))
    const off = rand() * rand() * spread - 5
    const size = 1.3 + rand() * 2.4
    const x = CX + (R + off) * Math.cos(angle) - size / 2
    const y = CY + (R + off) * Math.sin(angle) - size / 2
    if (y > CY - 8) continue
    const tier = off > 9 ? 2 : off > 2 ? 1 : 0
    tiers[tier] +=
      `M${x.toFixed(1)} ${y.toFixed(1)}h${size.toFixed(1)}v${size.toFixed(1)}h-${size.toFixed(1)}z`
  }
  return tiers
}
const RIM = rimPaths()

/**
 * KUBBE ÇERÇEVESİ — akışların üstündeki yarım küre (referanstaki küre): yukarıdan aşağı açılan
 * gökyüzü/deniz tonu, kenarında dağılan parçacıklar, dibinde zemine karışan solma. İçerik
 * (`children`) kubbeye kırpılır. Renkler `.af`in değişkenlerinden (`flow.css`). Yalnız süs:
 * okuyucuya gizli. `defs`: içeriğin kendi degrade tanımları.
 */
export function DomeFrame({ defs, children }) {
  const id = useId()
  return (
    <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" className="af-dome">
      <defs>
        <clipPath id={`${id}c`}>
          <circle cx={CX} cy={CY} r={R} />
        </clipPath>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" className="af-dome-top" />
          <stop offset="0.55" className="af-dome-mid" />
          <stop offset="1" className="af-dome-end" />
        </linearGradient>
        <radialGradient id={`${id}h`} cx="0.5" cy="1" r="0.5">
          <stop offset="0" className="af-dome-haze" />
          <stop offset="1" className="af-dome-haze" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.6" stopColor="#fff" />
          <stop offset="0.97" stopColor="#000" />
        </linearGradient>
        <mask id={`${id}m`}>
          <rect width={W} height={H} fill={`url(#${id}f)`} />
        </mask>
        {defs}
      </defs>
      <g mask={`url(#${id}m)`}>
        <path d={RIM[0]} className="af-rim" opacity="0.75" />
        <path d={RIM[1]} className="af-rim" opacity="0.45" />
        <path d={RIM[2]} className="af-rim" opacity="0.22" />
        <circle cx={CX} cy={CY} r={R} fill={`url(#${id}g)`} />
        <circle cx={CX} cy={CY} r={R} fill={`url(#${id}h)`} />
        <g clipPath={`url(#${id}c)`}>{children}</g>
      </g>
    </svg>
  )
}
