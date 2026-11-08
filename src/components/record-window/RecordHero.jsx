import { cn } from "@/lib/utils"
import "./recordWindow.css"
import "./recordBody.css"

/**
 * Kaydın TEK sayısının kartı — kişinin pencereyi açma nedeni (gün · tutar · saat · adım): solda
 * başlık ve gri açıklama, sağda büyük değer, altında `caption`. `value` dizi olabilir: ilki büyük,
 * ötekiler altında "+ …" (ör. para birimleri). `stacked`: değer başlığın altında, sola hizalı (dar
 * sütun). `tone` (brand · success · warning · danger · neutral) ve `past` çubuğu ve içerideki
 * işaretleri boyar (`--tone`, `--tone-ink`, `--done`). `children`: çubuk (`RecordMeter`), adımlar.
 */
export function RecordHero({
  title,
  sub,
  value,
  caption,
  tone,
  past = false,
  stacked = false,
  personal = false,
  className,
  children,
}) {
  const [main, ...more] = Array.isArray(value) ? value : [value]
  return (
    <section
      className={cn("rw-card", className)}
      data-tone={tone}
      data-past={past || undefined}
      data-stacked={stacked || undefined}
    >
      <div className="rw-card-head">
        <div className="rw-card-text">
          <h3 className="rw-card-title">{title}</h3>
          {sub && <p className="rw-card-sub">{sub}</p>}
        </div>
        {main && (
          <p className="rw-big" data-private={personal ? "" : undefined}>
            <strong>{main}</strong>
            {more.map((m) => (
              <span key={m} className="rw-big-more">
                + {m}
              </span>
            ))}
            {caption && <small>{caption}</small>}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

/**
 * Parçalı çubuk: `done` biten (dolu, `--done`), `now` şimdiki (kartın tonunda çizgili), kalan
 * kesikli gri; paylar 0–1. Süs: sayı kartta yazılı, çubuk ekran okuyucuya gizli.
 */
export function RecordMeter({ done = 0, now = 0 }) {
  const rest = Math.max(0, 1 - done - now)
  return (
    <div className="rw-meter" aria-hidden="true">
      {done > 0 && <span className="rw-meter-done" style={{ flexGrow: done }} />}
      {now > 0 && <span className="rw-meter-now" style={{ flexGrow: now }} />}
      {rest > 0.001 && <span className="rw-meter-rest" style={{ flexGrow: rest }} />}
    </div>
  )
}
