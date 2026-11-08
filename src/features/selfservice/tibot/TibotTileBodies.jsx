import "@/lib/i18n/tibot"
import { useLocale } from "@/hooks/useLocale"
import { byMember, dueWithin, oldest, statusMix } from "@/lib/tibot/tibotBreakdown"
import { statusLabel, statusTone } from "@/lib/tibot/tibotModel"
import { number, TONE_DOT } from "../kinds"
import { MixBar, Row, Section } from "../summary/TileDetail"
import "./tibotTile.css"

// Bilgi tonunun noktası marka rengi (sayfada zaten görünen); öteki tonlar Self Servis'in dili.
const dotOf = (status) => TONE_DOT[statusTone(status)] ?? "bg-brand"
const colorOf = (r) => ({ className: dotOf(r.key) })

/** Renkli zeminde sayı ve ad (Self Servis kutularının ayrıntısıyla aynı dil). */
function Now({ value, label, tone }) {
  return (
    <div className="tbt-now" data-tone={tone}>
      <span className="tbt-now-num">{value}</span>
      <span className="tbt-now-label">{label}</span>
    </div>
  )
}

function Empty() {
  const { t } = useLocale()
  return <p className="text-[0.8125rem] text-muted-foreground">{t("tibot.pt.empty")}</p>
}

/** Duruma göre: renkli dağılım çubuğu + noktalı satırlar. `mine`: açtığım (durum adı "Senden"). */
function ByStatus({ items, mine = false }) {
  const { t, locale } = useLocale()
  const mix = statusMix(items)
  return (
    <Section title={t("tibot.pt.byStatus")}>
      <MixBar rows={mix} colorOf={colorOf} />
      <dl>
        {mix.map((r) => (
          <Row
            key={r.key}
            label={statusLabel(t, r.key, mine)}
            value={number(r.count, locale)}
            dot={dotOf(r.key)}
          />
        ))}
      </dl>
    </Section>
  )
}

function Oldest({ items, now }) {
  const { t, locale } = useLocale()
  const old = oldest(items, now)
  if (!old) return null
  return (
    <Row
      label={t("tibot.pt.oldest", { id: old.row.requestId })}
      value={t("tibot.pt.days", { n: number(old.days, locale) })}
    />
  )
}

/** Bende bekleyen: şu an (sayı · hedefi geçen · 7 günde dolan), duruma göre, en eski. */
export function OnMeBody({ stats, now }) {
  const { t, locale } = useLocale()
  const items = stats.onMe.items
  if (!items.length) return <Empty />
  const due = dueWithin(items, now)
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <div className="tbt-nows">
        <Now value={number(stats.onMe.count, locale)} label={t("tibot.stat.onMe")} tone="brand" />
        <Now
          value={number(stats.onMe.late, locale)}
          label={t("tibot.overdue")}
          tone={stats.onMe.late > 0 ? "danger" : "neutral"}
        />
        <Now
          value={number(due, locale)}
          label={t("tibot.pt.dueWeek")}
          tone={due > 0 ? "warning" : "neutral"}
        />
      </div>
      <ByStatus items={items} />
      <dl>
        <Oldest items={items} now={now} />
      </dl>
    </div>
  )
}

/** Ekibimde: kimde kaç talep (sahipsizler ayrı), duruma göre. */
export function TeamBody({ items }) {
  const { t, locale } = useLocale()
  if (!items.length) return <Empty />
  const { people, rest, unclaimed } = byMember(items)
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <Section title={t("tibot.pt.byMember")}>
        <dl>
          {unclaimed > 0 && (
            <Row
              label={t("tibot.status.unclaimed")}
              value={number(unclaimed, locale)}
              dot={TONE_DOT.warning}
            />
          )}
          {people.map((p) => (
            <Row key={p.name} label={p.name} value={number(p.count, locale)} />
          ))}
          {rest > 0 && <Row label={t("tibot.pt.others")} value={number(rest, locale)} />}
        </dl>
      </Section>
      <ByStatus items={items} />
    </div>
  )
}

/** Açtığım: duruma göre (senden yanıt bekleyen önce gelir), en eski açık talep. */
export function MineBody({ items, now }) {
  if (!items.length) return <Empty />
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      <ByStatus items={items} mine />
      <dl>
        <Oldest items={items} now={now} />
      </dl>
    </div>
  )
}
