import { useEffect, useMemo, useRef, useState } from "react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowLeftDoubleIcon from "@hugeicons/core-free-icons/ArrowLeftDoubleIcon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import ArrowRightDoubleIcon from "@hugeicons/core-free-icons/ArrowRightDoubleIcon"
import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { dayInfo } from "@/lib/leaveDays"

const MONTH = { month: "long", year: "numeric" }
const WEEKDAY = { weekday: "short" }
const MONTH_NAME = { month: "long" }
const same = (a, b) => a && b && a.toDateString() === b.toDateString()

/**
 * Tarih: yatay gün şeridi (referanstaki gibi: ay başlığı, altında gün adı + sayı). Seçili gün dolu,
 * bugün noktalı, hafta sonu ve resmî tatil soluk. Ay başlığı kaydırdıkça görünen ayı izler.
 * `back`/`ahead`: bugünden kaç gün geri/ileri; `min`: bundan öncesi seçilemez (bitiş ≥ başlangıç);
 * `range`: `[başlangıç, bitiş]` arası hafif vurgulu (izin aralığı). Açılınca seçili gün ortaya kayar.
 * Başlığın yanındaki oklar şeridi bir hafta kaydırır (fareyle yatay kaydırmak zor); şerit iki aydan
 * uzunsa çift oklar aya atlar.
 */
// Bu kadar günden uzun şeritte ay okları da çıkar.
const MONTH_JUMP = 60

/** Okun düğmesi. */
function Nav({ icon, label, disabled, onClick }) {
  return (
    <button
      type="button"
      className="af-days-nav"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} aria-hidden="true" />
    </button>
  )
}

export function DayStrip({ value, today, onPick, back = 7, ahead = 30, min, range }) {
  const { t, locale } = useLocale()
  const track = useRef(null)
  const days = useMemo(
    () =>
      Array.from({ length: back + ahead + 1 }, (_, i) => {
        const d = new Date(today)
        d.setDate(d.getDate() + i - back)
        return d
      }),
    [today, back, ahead],
  )
  const picked = value ?? min ?? today
  const [shown, setShown] = useState(picked)
  const [edge, setEdge] = useState({ start: false, end: false })
  useEffect(() => {
    const el = track.current?.querySelector("[data-center]")
    el?.scrollIntoView({ inline: "center", block: "nearest" })
  }, [])
  // Başlık görünen ilk tam günün ayını yazar (durum yalnız ay değişince güncellenir).
  // Görünen ilk tam günün sırası (sağdan sola dilde "ilk" sağdadır: kenar yöne göre ölçülür).
  const firstVisible = (el) => {
    const box = el.getBoundingClientRect()
    const rtl = getComputedStyle(el).direction === "rtl"
    return [...el.children].findIndex((c) => {
      const r = c.getBoundingClientRect()
      return rtl ? r.right <= box.right + 4 : r.left >= box.left - 4
    })
  }
  const onScroll = (e) => {
    const el = e.currentTarget
    const index = firstVisible(el)
    const start = index <= 0
    const end = el.scrollWidth - el.clientWidth - Math.abs(el.scrollLeft) < 4
    if (start !== edge.start || end !== edge.end) setEdge({ start, end })
    const at = index >= 0 ? Number(el.children[index].dataset.at) : NaN
    if (!Number.isFinite(at)) return
    const d = new Date(at)
    if (d.getMonth() !== shown.getMonth() || d.getFullYear() !== shown.getFullYear()) setShown(d)
  }
  const go = (index) => {
    const el = track.current
    if (!el) return
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.children[Math.max(0, Math.min(el.children.length - 1, index))]?.scrollIntoView({
      inline: "start",
      block: "nearest",
      behavior: calm ? "auto" : "smooth",
    })
  }
  const week = (dir) => go(Math.max(0, firstVisible(track.current)) + dir * 7)
  // Ay oku: ileri → sonraki ayın 1'i; geri → görünen ayın 1'i, zaten oradaysak önceki ayın 1'i.
  const month = (dir) => {
    const at = days[Math.max(0, firstVisible(track.current))]
    const step = dir > 0 ? 1 : at.getDate() === 1 ? -1 : 0
    const target = new Date(at.getFullYear(), at.getMonth() + step, 1)
    const index = days.findIndex((d) => same(d, target))
    go(index >= 0 ? index : dir > 0 ? days.length - 1 : 0)
  }
  const months = back + ahead > MONTH_JUMP
  const [from, to] = range ?? []
  return (
    <div className="af-days">
      <div className="af-days-head">
        <p className="af-card-title">{getDateTimeFormat(locale, MONTH).format(shown)}</p>
        {months && (
          <Nav
            icon={ArrowLeftDoubleIcon}
            label={t("advanceFlow.days.prevMonth")}
            disabled={edge.start}
            onClick={() => month(-1)}
          />
        )}
        <Nav
          icon={ArrowLeft01Icon}
          label={t("advanceFlow.days.prevWeek")}
          disabled={edge.start}
          onClick={() => week(-1)}
        />
        <Nav
          icon={ArrowRight01Icon}
          label={t("advanceFlow.days.nextWeek")}
          disabled={edge.end}
          onClick={() => week(1)}
        />
        {months && (
          <Nav
            icon={ArrowRightDoubleIcon}
            label={t("advanceFlow.days.nextMonth")}
            disabled={edge.end}
            onClick={() => month(1)}
          />
        )}
      </div>
      <div ref={track} className="af-days-track" onScroll={onScroll}>
        {days.map((d) => {
          const on = same(d, value)
          const info = dayInfo(d)
          return (
            <button
              key={d.getTime()}
              type="button"
              className="af-day"
              data-at={d.getTime()}
              aria-pressed={Boolean(on)}
              disabled={Boolean(min && d < min)}
              data-today={same(d, today) ? "" : undefined}
              data-off={info.weight === 0 ? "" : undefined}
              data-in={from && to && d >= from && d <= to && !on ? "" : undefined}
              data-center={same(d, picked) ? "" : undefined}
              data-autofocus={same(d, picked) ? "" : undefined}
              onClick={() => onPick(d)}
            >
              <span>{getDateTimeFormat(locale, WEEKDAY).format(d)}</span>
              <b>{d.getDate()}</b>
              {/* Ekran okuyucu ayı da duyar; görünen yazı adın başında kalır. */}
              <i className="sr-only"> {getDateTimeFormat(locale, MONTH_NAME).format(d)}</i>
            </button>
          )
        })}
      </div>
    </div>
  )
}
