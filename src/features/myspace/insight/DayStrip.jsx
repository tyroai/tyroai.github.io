import { useId, useState } from "react"
import { workday } from "@/lib/focusWindow"
import { durationText, timeFormat } from "../dayInsightText"

const HOUR = 3_600_000
const ms = (d) => new Date(d).getTime()

/** Şeridin dilimleri, saat sırasıyla: toplantılar (adlarıyla), önerilen odak ve öteki boşluklar. */
function segmentsOf(f, highlight, events) {
  const out = f.blocks.map((b) => ({
    kind: "busy",
    start: b.start,
    end: b.end,
    titles: (events ?? [])
      .filter((e) => !e.isAllDay && ms(e.start) < ms(b.end) && ms(e.end) > ms(b.start))
      .map((e) => e.subject)
      .filter(Boolean),
  }))
  const same = (w) =>
    highlight && ms(w.start) === ms(highlight.start) && ms(w.end) === ms(highlight.end)
  for (const w of f.windows) if (!same(w)) out.push({ kind: "free", start: w.start, end: w.end })
  if (highlight) out.push({ kind: "focus", start: highlight.start, end: highlight.end })
  return out.sort((a, b) => ms(a.start) - ms(b.start))
}

/** Açılışta seçili dilim: şu anki, yoksa sıradaki, yoksa önerilen odak, yoksa ilki. */
function initialIndex(segs, now) {
  if (!segs.length) return -1
  if (now) {
    const at = segs.findIndex((s) => ms(s.start) <= ms(now) && ms(s.end) > ms(now))
    if (at >= 0) return at
    const next = segs.findIndex((s) => ms(s.start) > ms(now))
    if (next >= 0) return next
  }
  const focus = segs.findIndex((s) => s.kind === "focus")
  return focus >= 0 ? focus : 0
}

/**
 * GÜNÜN ŞERİDİ (Günün okuması): mesai düz bir iz üstünde, saat başları ince çizgi. Toplantılar
 * paletin hafif tonunda dolu blok, önerilen odak kesik çerçeve ("Odak"), öteki boşluklar iz;
 * bugünse "şimdi" ince palet çizgisi. Her dilim dokunulabilir: seçilenin hikâyesi şeridin altında
 * tek satır ("10:00–11:00 · Weekly AI Meeting", "13:00–15:00 · 2 sa boş"). Açılışta şu anki ya da
 * sıradaki dilim seçili. Toplantı adları kişisel veri: Sunum modunda gizlenir (`data-private`).
 */
export function DayStrip({ day, f, highlight, events, locale, t }) {
  const { start, end } = workday(day)
  const span = end - start
  const x = (d) => Math.min(100, Math.max(0, ((ms(d) - start) / span) * 100))
  const at = (s) => ({ insetInlineStart: `${x(s.start)}%`, width: `${x(s.end) - x(s.start)}%` })
  const time = timeFormat(locale)
  const now = f.from && ms(f.from) > start && ms(f.from) < end ? f.from : null
  const segs = segmentsOf(f, highlight, events)
  const [picked, setPicked] = useState(() => initialIndex(segs, now))
  const sel = segs[picked] ?? null
  const detailId = useId()
  const hours = []
  for (let h = Math.ceil(start / HOUR) * HOUR; h < end; h += HOUR) if (h > start) hours.push(h)
  const range = (s) => `${time.format(s.start)}–${time.format(s.end)}`
  const minutes = (s) => Math.round((ms(s.end) - ms(s.start)) / 60_000)
  // Dilimin ne olduğu; saat ayrı tutulur (sağdan sola bir toplantı adı saati satırın sonuna itmesin).
  const what = (s) => {
    if (s.kind === "busy") {
      const [first, ...rest] = s.titles
      if (!first) return t("insight.strip.busy")
      return rest.length ? `${first} ${t("insight.strip.more", { n: rest.length })}` : first
    }
    const free = t("insight.strip.freeFor", { time: durationText(t, minutes(s)) })
    return s.kind === "focus" ? `${free} · ${t("insight.strip.focus")}` : free
  }
  const story = (s) => (s ? `${range(s)} · ${what(s)}` : "")

  return (
    <div className="ib-strip">
      <div role="group" aria-label={t("insight.strip.aria")} className="ib-track">
        {hours.map((h) => (
          <span
            key={h}
            aria-hidden="true"
            className="ib-hour"
            style={{ insetInlineStart: `${x(h)}%` }}
          />
        ))}
        {segs.map((s, i) => (
          <button
            key={`${s.kind}${ms(s.start)}`}
            type="button"
            data-kind={s.kind}
            aria-pressed={i === picked}
            aria-label={story(s)}
            aria-controls={detailId}
            className="ib-seg"
            style={at(s)}
            onClick={() => setPicked(i)}
            onPointerEnter={(e) => e.pointerType === "mouse" && setPicked(i)}
          >
            {s.kind === "focus" && x(s.end) - x(s.start) >= 14 ? (
              <span aria-hidden="true">{t("insight.strip.focusShort")}</span>
            ) : null}
          </button>
        ))}
        {now && (
          <span aria-hidden="true" className="ib-now" style={{ insetInlineStart: `${x(now)}%` }} />
        )}
      </div>
      <div aria-hidden="true" className="ib-ticks">
        <span>{time.format(start)}</span>
        <span>{time.format(end)}</span>
      </div>
      <p
        id={detailId}
        data-private=""
        aria-live="polite"
        className="ib-detail"
        data-kind={sel?.kind}
      >
        <span aria-hidden="true" className="ib-dot" />
        {sel && (
          <span>
            {range(sel)} · <bdi>{what(sel)}</bdi>
          </span>
        )}
      </p>
    </div>
  )
}
