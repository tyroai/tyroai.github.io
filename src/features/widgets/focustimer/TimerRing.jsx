import { cn } from "@/lib/utils"

const R = 54
const C = 2 * Math.PI * R

/**
 * Apple'ın zamanlayıcısı gibi halka: kalan süre oranında dolu (`progress` 0–1), uçlar yuvarlak;
 * bitince durumun yeşilinde. Renk marka mürekkebinden: Renkli ve Koyu kartta da okunur. Saniyede
 * bir adım (geçiş yok: sürekli animasyon değil).
 */
export function TimerRing({ progress, done = false, className, children }) {
  return (
    <div className={cn("relative grid shrink-0 place-items-center", className)}>
      <svg
        viewBox="0 0 120 120"
        aria-hidden="true"
        className="absolute inset-0 size-full -rotate-90"
      >
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="7"
        />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke={done ? "var(--success)" : "var(--brand-text)"}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - Math.max(0, Math.min(1, progress)))}
        />
      </svg>
      <div className="relative flex flex-col items-center text-center">{children}</div>
    </div>
  )
}
