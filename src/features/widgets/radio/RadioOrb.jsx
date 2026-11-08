import { useId } from "react"
import { BrandOrb } from "@/components/brand/BrandOrb"
import { useOrbStyle } from "@/hooks/useOrbStyle"
import { cn } from "@/lib/utils"
import "./radio.css"

// Kürenin çapı (px) ve 28px'lik kutudaki merkezi (viewBox 0 0 28 28): kafa bandına yer kalsın
// diye merkez biraz aşağıda.
const ORB = 18
const CY = 16

/**
 * Tyrofy'ın işareti — kulaklık takmış GERÇEK TYRO küresi (widget başlığı ve header hapı):
 * kişinin seçtiği görünüm (`BrandOrb`: küre ya da maskot, yardım kartındakinin aynısı) ve
 * üstünde kulaklık. Çalarken maskot dinler (`listening`) ve ikisi de müziğe hafifçe sallanır;
 * azaltılmış harekette sallanmaz. Küre hep sakin (`idle`): 18px'te dinleme halkaları ve güçlü
 * ışık küreyi bulanık bir lekeye çeviriyordu. Kulaklığın rengi zemine göre (`--hp-*`, `radio.css`: koyuda gümüş,
 * açıkta grafit). Süs: yanındaki yazı adı taşır. ⚠️ `inert` (Karşılama kartının kuralı): kürenin
 * kökü bir `<button>` — odaklanmasın, ekran okuyucuya ad okutmasın, tıklanmasın.
 * ⚠️ Degrade kimliği `useId`: aynı sayfada birden çok örnek (iki kart + hap).
 */
export function RadioOrb({ live = false, className }) {
  const cup = `${useId().replace(/:/g, "")}-c`
  // Maskotun küresi tuvalde biraz yukarıda (merkez 221/470): kulaklık ortalansın.
  const mascot = useOrbStyle() === "mascot"
  return (
    <span
      aria-hidden="true"
      inert
      data-live={live || undefined}
      className={cn("radio-orb relative block size-7 shrink-0", className)}
    >
      <span className="radio-orb__head absolute inset-0">
        <span
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ top: mascot ? `calc(${(CY / 28) * 100}% + 0.75px)` : `${(CY / 28) * 100}%` }}
        >
          <BrandOrb
            surface="dashboard"
            state="idle"
            mascotState={live ? "listening" : undefined}
            restState="idle"
            size={ORB}
          />
        </span>
        <svg viewBox="0 0 28 28" className="pointer-events-none absolute inset-0 overflow-visible">
          <defs>
            <linearGradient id={cup} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" style={{ stopColor: "var(--hp-cup-hi)" }} />
              <stop offset="1" style={{ stopColor: "var(--hp-cup)" }} />
            </linearGradient>
          </defs>
          {/* Kafa bandı kürenin üstünden: uçları kulak yastıklarına iner. */}
          <path
            d="M4.2 16.8V15a9.8 9.8 0 0 1 19.6 0v1.8"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
            style={{ stroke: "var(--hp-band)" }}
          />
          <path
            d="M7.4 8.2a9.2 9.2 0 0 1 13.2 0"
            fill="none"
            strokeWidth="0.6"
            strokeLinecap="round"
            style={{ stroke: "var(--hp-shine)" }}
          />
          {/* Kulak kapları: kafaya bakan yastık + dış kabuk + ışık + paletten küçük bir nokta. */}
          <rect
            x="5"
            y="13.4"
            width="2.2"
            height="8"
            rx="1.1"
            style={{ fill: "var(--hp-cushion)" }}
          />
          <rect
            x="20.8"
            y="13.4"
            width="2.2"
            height="8"
            rx="1.1"
            style={{ fill: "var(--hp-cushion)" }}
          />
          <rect x="1.4" y="12.6" width="4.8" height="9.6" rx="2.4" fill={`url(#${cup})`} />
          <rect x="21.8" y="12.6" width="4.8" height="9.6" rx="2.4" fill={`url(#${cup})`} />
          <rect
            x="2.2"
            y="13.8"
            width="0.8"
            height="4"
            rx="0.4"
            style={{ fill: "var(--hp-shine)" }}
          />
          <rect
            x="22.6"
            y="13.8"
            width="0.8"
            height="4"
            rx="0.4"
            style={{ fill: "var(--hp-shine)" }}
          />
          <circle cx="3.8" cy="19.6" r="0.85" style={{ fill: "var(--brand-via)" }} />
          <circle cx="24.2" cy="19.6" r="0.85" style={{ fill: "var(--brand-via)" }} />
        </svg>
      </span>
    </span>
  )
}
