import "@/lib/i18n/tibot"
import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import { useLocale } from "@/hooks/useLocale"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { useTibotTickets } from "@/hooks/useTibotTickets"
import { useTibotYear } from "@/hooks/useTibotYear"
import { BUCKET_COLOR } from "@/lib/tibot/bucketColor"
import { latePct, lateShare } from "@/lib/tibot/tibotBreakdown"
import { deck, runway } from "@/lib/tibot/tibotDeck"
import { buckets } from "@/lib/tibot/tibotModel"
import { tibotStats } from "@/lib/tibot/tibotStats"
import { cn } from "@/lib/utils"

/**
 * Ticket kartlarının header yüzleri (tembel modül; `TrayGlyph` ve `LiveLabel` çağırır). 20 px'lik
 * renkli SVG'ler kartın kendisini küçültür: halkalar (Talepler, Halka), deste (Sıra sende), nokta
 * sütunları (Pist), ilerleme halkası (Tempo). Renkler token'lardan; liste ve yıl sayıları kartlarla
 * aynı bellekten (5 dk, yoklama yok).
 */

const YEAR = new Date().getFullYear()
const LABEL = "text-[0.8125rem] font-semibold tabular-nums leading-none"
const TONE = {
  danger: "var(--danger, var(--destructive))",
  warning: "var(--warning, var(--brand-text))",
  brand: "var(--brand-text)",
  neutral: "var(--muted-foreground)",
}

/** Kartların ortak verisi: kovalar, deste ve pist (listenin tek okumasından). */
function useFace() {
  const now = useMinuteNow().getTime()
  const { data } = useTibotTickets(true)
  return useMemo(() => {
    if (!data) return null
    const stats = tibotStats(data, now)
    const views = buckets(data, now)
    const needs = stats.waiting.items.filter((r) => r.status === "waiting_for_customer")
    const d = deck(stats.onMe.items, needs, now)
    return { stats, views, deck: d, runway: runway(stats.onMe.items, now, 2, true) }
  }, [data, now])
}

/** Üç iç içe halka: kovaların renkleri, dolu kısım gecikmiş payı (kartın halkasıyla aynı). */
function RingsSvg({ views }) {
  const radii = { assigned: 8, mine: 5.4, team: 2.8 }
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="tibot-face-svg -rotate-90">
      {(views ?? []).map((v) => {
        const r = radii[v.id]
        const c = 2 * Math.PI * r
        return (
          <g key={v.id} style={{ stroke: BUCKET_COLOR[v.id] }}>
            <circle cx="10" cy="10" r={r} fill="none" strokeWidth="2" strokeOpacity="0.22" />
            <circle
              cx="10"
              cy="10"
              r={r}
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - lateShare(v))}
            />
          </g>
        )
      })}
    </svg>
  )
}

/** Mini deste: arkada aynı tonun soluk kartı, önde en acil talebin tonunda kart ve iki satır. */
function DeckSvg({ tone }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="tibot-face-svg">
      <rect x="6" y="2" width="12" height="13" rx="3" fill={TONE[tone]} opacity="0.3" />
      <rect x="2" y="5" width="12.5" height="13" rx="3" fill={TONE[tone]} />
      <rect x="4.5" y="9" width="7.5" height="1.6" rx="0.8" fill="#fff" opacity="0.9" />
      <rect x="4.5" y="12.4" width="5" height="1.6" rx="0.8" fill="#fff" opacity="0.65" />
    </svg>
  )
}

/** Mini pist: geçti · bugün · yarın · hafta · sonra sütunlarında en çok üç nokta. */
function RunwaySvg({ cols }) {
  const tone = (c) =>
    c.key === "late" ? "danger" : c.key === "day" && c.offset === 0 ? "warning" : "brand"
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="tibot-face-svg">
      <rect x="1" y="18" width="18" height="1" rx="0.5" fill="currentColor" opacity="0.2" />
      {(cols ?? []).map((c, i) =>
        Array.from({ length: Math.min(3, c.items.length) }, (_, j) =>
          c.key === "later" ? (
            <circle
              key={`${i}${j}`}
              cx={2.4 + i * 3.8}
              cy={15 - j * 4.4}
              r="1.35"
              fill="none"
              stroke="var(--brand-text)"
              strokeOpacity="0.75"
              strokeWidth="0.9"
            />
          ) : (
            <circle
              key={`${i}${j}`}
              cx={2.4 + i * 3.8}
              cy={15 - j * 4.4}
              r="1.6"
              fill={TONE[tone(c)]}
            />
          ),
        ),
      )}
    </svg>
  )
}

/** Tempo: bu yılın ilerleme halkası; tamamlanınca durumun yeşili. */
function PaceSvg({ done, total }) {
  const r = 7.6
  const c = 2 * Math.PI * r
  const s = total > 0 ? Math.min(1, done / total) : 0
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="tibot-face-svg -rotate-90">
      <circle
        cx="10"
        cy="10"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="2.6"
      />
      <circle
        cx="10"
        cy="10"
        r={r}
        fill="none"
        stroke={s >= 1 ? "var(--success, var(--brand-text))" : "var(--brand-text)"}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - s)}
      />
    </svg>
  )
}

function useYearShare() {
  const y = useTibotYear(YEAR).data
  if (!y) return null
  const staff = (y.closed ?? 0) > 0 || (y.assigned ?? 0) > 0
  return staff
    ? { done: y.closed ?? 0, total: y.assigned ?? 0 }
    : { done: y.openedClosed ?? 0, total: y.opened ?? 0 }
}

function topTone(d) {
  const c = d?.cards[0]
  if (!c) return d?.stale.length ? "danger" : "neutral"
  return c.kind === "late" ? "danger" : c.kind === "reply" ? "warning" : "brand"
}

function PaceGlyph() {
  const y = useYearShare()
  return <PaceSvg done={y?.done ?? 0} total={y?.total ?? 0} />
}

/**
 * Kartın header simgesi. Halkanın üstüne rozet konmaz (halkayı örtüyordu): sayı yanındaki
 * değerde (`TibotLabel`), halka yalnız zamanında oranını çizer.
 */
export function TibotGlyph({ id }) {
  const face = useFace()
  if (id === "tibot-intro") return <PaceGlyph />
  if (id === "tibot-summary") return <DeckSvg tone={topTone(face?.deck)} />
  if (id === "tibot-rhythm") return <RunwaySvg cols={face?.runway} />
  return <RingsSvg views={face?.views} />
}

/** Tempo'nun değeri: bu yıl kapanan / payda. */
function PaceLabel() {
  const { t } = useLocale()
  const year = useYearShare()
  if (!year) return null
  return (
    <span className={LABEL}>
      <span aria-hidden="true">
        {year.done}/{year.total}
      </span>
      <span className="sr-only">
        {t("tibot.face.pace", { done: year.done, total: year.total })}
      </span>
    </span>
  )
}

/**
 * Listeden okunan değerler: destede kaç talep, pistte hedefi geçen; halkada sana atanan sayısı
 * (kalın) ve yanında gecikmiş payı (saat + kırmızı yüzde; halkanın dolu kısmıyla aynı).
 */
function ListLabel({ id }) {
  const { t, locale } = useLocale()
  const face = useFace()
  if (!face) return null
  if (id === "tibot-summary") {
    const n = face.deck.cards.length + (face.deck.stale.length ? 1 : 0)
    return (
      <span className={LABEL}>
        <span aria-hidden="true">{n}</span>
        <span className="sr-only">{t("tibot.face.deck", { n })}</span>
      </span>
    )
  }
  if (id === "tibot-rhythm") {
    const late = face.runway[0].items.length
    const soon = face.runway.slice(1, 3).reduce((sum, c) => sum + c.items.length, 0)
    return (
      <span className={cn(LABEL, late > 0 && "text-[color:var(--danger-ink,var(--destructive))]")}>
        <span aria-hidden="true">{late || soon}</span>
        <span className="sr-only">{t("tibot.face.runway", { late, soon })}</span>
      </span>
    )
  }
  if (id === "tibot-rings") {
    const v = face.views.find((x) => x.id === "assigned")
    const late = latePct(v, locale)
    return (
      <span className={cn(LABEL, "inline-flex items-center gap-1.5")}>
        <span aria-hidden="true">{v.count}</span>
        {late && (
          <span
            aria-hidden="true"
            className="inline-flex items-center gap-0.5 text-[0.6875rem] text-[color:var(--danger-ink,var(--destructive))]"
          >
            <HugeiconsIcon icon={Clock01Icon} strokeWidth={2.2} className="size-3" />
            {late}
          </span>
        )}
        <span className="sr-only">
          {t(late ? "tibot.face.ringsLate" : "tibot.face.rings", { n: v.count, pct: late })}
        </span>
      </span>
    )
  }
  return null
}

/** Kartın header değeri (yüz "değer" seçiliyken). */
export function TibotLabel({ id }) {
  return id === "tibot-intro" ? <PaceLabel /> : <ListLabel id={id} />
}
