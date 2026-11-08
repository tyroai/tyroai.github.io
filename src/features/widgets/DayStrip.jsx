import { workday } from "@/lib/focusWindow"

const TICKS = [9, 12, 15, 18]

/**
 * Günün şeridi (Odak penceresi): 08:00–17:30 mesai tek çubukta — toplantılar nötr dolgu, odaklanılabilir
 * boşluklar marka tonunda (sayfadaki pencereler tam, ötekiler soluk), şimdi ince bir çizgi. Altında
 * dört saat etiketi. Listedeki saatlerin günde nereye düştüğü bir bakışta; aynı bilgi listede
 * olduğu için şerit ekran okuyucuya gizli, fareyle pencerenin saati ipucunda.
 */
export function DayStrip({ day, busy, windows, active, now, time }) {
  const { start, end } = workday(day)
  const span = end - start
  const x = (d) => Math.min(100, Math.max(0, ((d - start) / span) * 100))
  // Mantıksal konum: Arapçada şerit sağdan başlar (zaman satır yönünde akar).
  const at = (d) => ({ insetInlineStart: `${x(d.start)}%`, width: `${x(d.end) - x(d.start)}%` })
  const showNow = now != null && now > start.getTime() && now < end.getTime()
  const tick = (h) => {
    const d = new Date(day)
    d.setHours(h, 0, 0, 0)
    return time.format(d)
  }
  return (
    <div aria-hidden="true" className="relative mt-3">
      <div className="relative h-2 overflow-hidden rounded-full bg-muted">
        {busy.map((b) => (
          <span
            key={b.start.getTime()}
            className="absolute inset-y-0 bg-foreground/20"
            style={at(b)}
          />
        ))}
        {windows.map((w) => (
          <span
            key={w.start.getTime()}
            title={`${time.format(w.start)} – ${time.format(w.end)}`}
            className="absolute inset-y-0 rounded-full bg-brand transition-opacity duration-150 ease-out"
            style={{ ...at(w), opacity: active.has(w.start.getTime()) ? 1 : 0.35 }}
          />
        ))}
      </div>
      {showNow && (
        <span
          className="absolute -top-0.5 h-3 w-0.5 rounded-full bg-foreground"
          style={{ insetInlineStart: `calc(${x(now)}% - 1px)` }}
        />
      )}
      {/* Etiket saatin tam altında: uçtakiler kenara yaslı, aradakiler sıfır genişlikli kutuda
          ortalı (her iki yönde de doğru). */}
      <div className="relative mt-1 h-3.5 text-[0.625rem] tabular-nums text-muted-foreground">
        {TICKS.map((h, i) => {
          const last = i === TICKS.length - 1
          const style =
            i === 0
              ? { insetInlineStart: 0 }
              : last
                ? { insetInlineEnd: 0 }
                : { insetInlineStart: `${(i / (TICKS.length - 1)) * 100}%`, width: 0 }
          return (
            <span
              key={h}
              className="absolute top-0 flex justify-center whitespace-nowrap"
              style={style}
            >
              {tick(h)}
            </span>
          )
        })}
      </div>
    </div>
  )
}
