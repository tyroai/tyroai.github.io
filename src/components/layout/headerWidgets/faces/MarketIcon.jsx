import { useId } from "react"

/*
 * Piyasa yüzünün kur simgeleri (header'da değerin solunda, 18 px): döviz renkli madeni para ve
 * sembolü ($ yeşil, € mavi …), gram ve has altın külçe, gümüş gümüş külçe, sikke altınları
 * yıldızlı sikke, bilezik altın halka (özgün SVG; renkler sabit, kurun kimliği — açık ve koyu temada
 * aynı). BIST 100 Borsa İstanbul'un yuvarlak logosu (ürün sahibinin verdiği görsel,
 * `public/tyro-market/bist.webp`, şeffaf zemin).
 */

// Dövizin sembolü ve paranın rengi (açık → koyu); `ink` açık zeminde koyu yazı.
const FX = {
  usd: ["$", "#34b26c", "#167a43"],
  eur: ["€", "#4775e6", "#1f43a8"],
  gbp: ["£", "#8b5cf6", "#5b2fb8"],
  chf: ["Fr", "#e5484d", "#b4232a"],
  jpy: ["¥", "#f05252", "#b91c1c"],
  cny: ["¥", "#e5484d", "#a61b1b"],
  rub: ["₽", "#4b6bfb", "#2b3fb0"],
  cad: ["$", "#ef4444", "#b91c1c"],
  aed: ["Dh", "#14b8a6", "#0f766e"],
  sar: ["SR", "#22a356", "#166534"],
  kzt: ["₸", "#38bdf8", "#0369a1"],
  iqd: ["ID", "#f59e0b", "#b45309"],
  syp: ["S£", "#64748b", "#334155"],
  ron: ["lei", "#fcd34d", "#d4a20c", "#4a3600"],
  ngn: ["₦", "#22c55e", "#15803d"],
  ghs: ["₵", "#eab308", "#a16207"],
  ves: ["Bs", "#f97316", "#c2410c"],
}
const GOLD = { hi: "#fff0a8", mid: "#f6c94e", lo: "#c98b12", edge: "#9c6505" }
const SILVER = { hi: "#ffffff", mid: "#dfe3e9", lo: "#9aa3af", edge: "#717a87" }
const BARS = new Set(["gram", "has"])
const BIST_LOGO = `${import.meta.env?.BASE_URL ?? "/"}tyro-market/bist.webp`
const COINS = new Set(["quarter", "half", "full", "republic"])

/** Kurun simgesi: `row` Piyasa satırı (`id`, `kind`). */
export function MarketIcon({ row }) {
  const uid = useId().replace(/:/g, "")
  if (row.kind === "index")
    return (
      <img src={BIST_LOGO} alt="" aria-hidden="true" decoding="async" className="market-icon" />
    )
  if (row.id === "silver") return <Bar uid={uid} c={SILVER} />
  if (BARS.has(row.id)) return <Bar uid={uid} c={GOLD} />
  if (row.id === "bracelet") return <Bangle uid={uid} />
  if (COINS.has(row.id) || row.kind === "gold") return <GoldCoin uid={uid} />
  const [sym, hi, lo, ink] = FX[row.id] ?? [row.id.slice(0, 2).toUpperCase(), "#7c8796", "#475160"]
  return <Coin uid={uid} sym={sym} hi={hi} lo={lo} ink={ink ?? "#fff"} />
}

function Svg({ children }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="market-icon">
      {children}
    </svg>
  )
}

/** Madeni para: üstten ışık alan degrade, iç kenar çizgisi, kabartma sembol. */
function Coin({ uid, sym, hi, lo, ink }) {
  const g = `mc-${uid}`
  const size = sym.length > 2 ? 6 : sym.length > 1 ? 7.4 : 11
  return (
    <Svg>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={hi} />
          <stop offset="1" stopColor={lo} />
        </linearGradient>
      </defs>
      <circle cx="10" cy="10" r="9" fill={`url(#${g})`} />
      <circle
        cx="10"
        cy="10"
        r="7.3"
        fill="none"
        stroke="rgb(255 255 255 / 0.38)"
        strokeWidth="0.8"
      />
      <text
        x="10"
        y="10"
        dy="0.36em"
        textAnchor="middle"
        fontSize={size}
        fontWeight="800"
        fill={ink}
        style={{ fontFamily: "inherit" }}
      >
        {sym}
      </text>
    </Svg>
  )
}

/** Külçe: önden ve üstten görünen iki yüz, üst kenarda parıltı. */
function Bar({ uid, c }) {
  const front = `mb-f-${uid}`
  const top = `mb-t-${uid}`
  return (
    <Svg>
      <defs>
        <linearGradient id={front} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.mid} />
          <stop offset="1" stopColor={c.lo} />
        </linearGradient>
        <linearGradient id={top} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c.hi} />
          <stop offset="1" stopColor={c.mid} />
        </linearGradient>
      </defs>
      <path
        d="M2.3 15.6 L17.7 15.6 L15.7 8.4 L4.3 8.4 Z"
        fill={`url(#${front})`}
        stroke={c.edge}
        strokeWidth="0.55"
        strokeLinejoin="round"
      />
      <path
        d="M4.3 8.4 L15.7 8.4 L14.2 5.2 L5.8 5.2 Z"
        fill={`url(#${top})`}
        stroke={c.edge}
        strokeWidth="0.55"
        strokeLinejoin="round"
      />
      <path
        d="M5.2 10 L14.8 10"
        stroke="rgb(255 255 255 / 0.6)"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
    </Svg>
  )
}

// Beş köşeli yıldız (sikkenin kabartması), merkez (10, 10).
const STAR = Array.from({ length: 10 }, (_, i) => {
  const r = i % 2 ? 1.35 : 3.1
  const a = (Math.PI / 5) * i - Math.PI / 2
  return `${(10 + r * Math.cos(a)).toFixed(2)},${(10 + r * Math.sin(a)).toFixed(2)}`
}).join(" ")

/** Sikke altını: altın degrade, iç halka, kabartma yıldız. */
function GoldCoin({ uid }) {
  const g = `mg-${uid}`
  return (
    <Svg>
      <defs>
        <radialGradient id={g} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor={GOLD.hi} />
          <stop offset="0.55" stopColor={GOLD.mid} />
          <stop offset="1" stopColor={GOLD.lo} />
        </radialGradient>
      </defs>
      <circle cx="10" cy="10" r="8.8" fill={`url(#${g})`} stroke={GOLD.edge} strokeWidth="0.55" />
      <circle
        cx="10"
        cy="10"
        r="6.6"
        fill="none"
        stroke="rgb(255 255 255 / 0.5)"
        strokeWidth="0.7"
      />
      <polygon points={STAR} fill="rgb(156 101 5 / 0.6)" />
    </Svg>
  )
}

/** Bilezik: altın halka, üstünde ince parıltı. */
function Bangle({ uid }) {
  const g = `mr-${uid}`
  return (
    <Svg>
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={GOLD.hi} />
          <stop offset="0.5" stopColor={GOLD.mid} />
          <stop offset="1" stopColor={GOLD.lo} />
        </linearGradient>
      </defs>
      <ellipse
        cx="10"
        cy="10.4"
        rx="7.3"
        ry="5.4"
        fill="none"
        stroke={`url(#${g})`}
        strokeWidth="2.8"
      />
      <path
        d="M4.6 8.6 Q10 4.4 15.4 8.6"
        fill="none"
        stroke="rgb(255 255 255 / 0.65)"
        strokeWidth="0.7"
        strokeLinecap="round"
      />
    </Svg>
  )
}
