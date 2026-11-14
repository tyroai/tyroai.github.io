import { countdownLabel, parseIso } from "./dayMath"

/**
 * Bir özel günün yıl listesindeki satırı; basınca o gün takvimde seçilir. Yaklaşan (bu ya da
 * gelecek hafta) satırın sonunda marka noktası durur; geçmiş satır soluk. Aralık `formatRange`
 * ile: ay/gün sırası dilin kararı ("March 20–22").
 */
export function DayRow({ entry, todayIso, fmtDayMonth, fmtWeekday, t, onPick, dim, highlight }) {
  const from = parseIso(entry.from)
  const when = countdownLabel(entry, todayIso, t)

  return (
    <button
      type="button"
      onClick={() => onPick(from)}
      className="bn-row bn-year-row"
      data-dim={dim ? "" : undefined}
    >
      <span className="bn-year-date">
        {entry.from === entry.to
          ? fmtDayMonth.format(from)
          : fmtDayMonth.formatRange(from, parseIso(entry.to))}
      </span>
      <span className="bn-text">
        <span className="bn-name">{t(`special.day.${entry.id}`)}</span>
        <span className="bn-sub">
          {fmtWeekday.format(from)}
          {when ? ` · ${when}` : null}
        </span>
      </span>
      {highlight && <span aria-hidden="true" className="bn-dot" />}
    </button>
  )
}
