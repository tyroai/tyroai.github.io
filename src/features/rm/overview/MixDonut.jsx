import { num, pct } from "@/features/rm/lib/format"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"

// Çevresi 100 birim: dilimin payı doğrudan çizgi uzunluğu.
const R = 15.915

/**
 * Proje saat halkası. Dilimin (ya da listedeki satırının) üstüne gelince o dilim kalınlaşır,
 * ötekiler soluklaşır; ortada payı, kodu ve saati yazar, boşta toplam saat. Projenin dilimine
 * basınca ayrıntısı açılır. Klavye yolu yanındaki liste: aynı `active` halkayı da sürer.
 */
export function MixDonut({ segs, total, active, onActive, onProject }) {
  const { rt, locale } = useRmText()
  const cur = segs.find((s) => s.code === active)
  // Dilimler ardışık: her biri öncekilerin toplamından başlar.
  const arcs = []
  let acc = 0
  for (const s of segs) {
    const v = (s.h / total) * 100
    arcs.push({ s, v, off: acc })
    acc += v
  }
  return (
    <div className="relative size-36 shrink-0 @[60rem]/rm:size-40">
      <svg
        viewBox="0 0 42 42"
        className="size-full -rotate-90"
        role="img"
        aria-label={rt("rm.detail.mix.title")}
        onPointerLeave={() => onActive(null)}
        // Halkanın ortası dilim değil: seçimi bırakır.
        onPointerOver={(e) => e.target === e.currentTarget && onActive(null)}
      >
        <circle
          cx="21"
          cy="21"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-foreground/[0.06]"
        />
        {arcs.map(({ s, v, off }) => {
          const on = s.code === active
          return (
            <circle
              key={s.code}
              cx="21"
              cy="21"
              r={R}
              fill="none"
              strokeDasharray={`${v.toFixed(2)} ${(100 - v).toFixed(2)}`}
              strokeDashoffset={(-off).toFixed(2)}
              style={{ stroke: s.color || "var(--color-brand)", strokeWidth: on ? 8 : 6 }}
              onPointerEnter={() => onActive(s.code)}
              onClick={s.id ? () => onProject(s.id) : undefined}
              className={cn(
                "transition-[stroke-width,opacity] duration-200 motion-reduce:transition-none",
                active && !on && "opacity-30",
                s.id && "cursor-pointer",
              )}
            />
          )
        })}
      </svg>
      {/* Orta yazı listenin tekrarı: ekran okuyucu listeyi okur. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 grid place-items-center"
      >
        <span className="flex max-w-[5.25rem] flex-col items-center text-center leading-tight">
          <span className="text-lg font-semibold tabular-nums tracking-[-0.02em]">
            {cur ? pct(cur.h / total, locale) : num(total, locale)}
          </span>
          <span className="w-full truncate text-[0.6875rem] font-medium text-foreground/70">
            {cur ? cur.code : rt("rm.detail.mix.center")}
          </span>
          {cur && (
            <span className="text-[0.6875rem] tabular-nums text-muted-foreground">
              {rt("rm.unit.hours", { n: num(cur.h, locale) })}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
