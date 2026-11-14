import { useMemo } from "react"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { leaveStrip } from "./lib/leaveStrip"

// Türkçe ve İngilizcede kısa ad sığar ve ayırt eder ("Paz"/"Pzt"); ötekilerde tek harf.
const SHORT = { weekday: "short" }
const NARROW = { weekday: "narrow" }

/**
 * İzin sahnesi: seçilen türün büyük illüstrasyonu (hafifçe süzülür, tür değişince yerine oturur) ve
 * altında izin günlerinin takvim şeridi — izin günleri dolu, hafta sonu ve tatil soluk. Süs: aynı
 * bilgi altındaki satırda yazıyla var, o yüzden ekran okuyucudan gizli.
 */
export function LeaveScene({ kind, src, start, end, today, locale, badge }) {
  const cells = useMemo(() => leaveStrip(start, end, today), [start, end, today])
  const weekday = getDateTimeFormat(locale, /^(tr|en)/.test(locale) ? SHORT : NARROW)
  return (
    <div className="lv-scene" aria-hidden="true">
      <div className="lv-art">
        <span className="lv-glow" />
        <span className="lv-shadow" />
        <span className="lv-float">
          <img key={kind} src={src} alt="" width="240" height="240" decoding="async" />
        </span>
        {badge && (
          <span key={badge} className="lv-badge">
            {badge}
          </span>
        )}
      </div>
      <div className="lv-strip">
        {cells.map((c) =>
          c.date ? (
            <span
              key={c.key}
              className="lv-cell"
              data-in={c.in ? "" : undefined}
              data-off={c.off ? "" : undefined}
              data-first={c.first ? "" : undefined}
              data-last={c.last ? "" : undefined}
              data-today={c.today ? "" : undefined}
            >
              <span className="lv-wd">{weekday.format(c.date)}</span>
              <span className="lv-day">
                <b>{c.date.getDate()}</b>
              </span>
            </span>
          ) : (
            <span key={c.key} className="lv-cell" data-in="" data-more="">
              <span className="lv-wd">&nbsp;</span>
              <span className="lv-day">
                <b>+{c.more}</b>
              </span>
            </span>
          ),
        )}
      </div>
    </div>
  )
}
