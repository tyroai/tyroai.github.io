import "@/lib/i18n/tibot"
import { useLocale } from "@/hooks/useLocale"
import { number } from "../kinds"
import { MixBar, Row, Section } from "../summary/TileDetail"

// Soldaki kutuların dili: renkler seçili paletin logo tonlarından (sayfada zaten görünen).
const DONE = "var(--brand-logo-1)"
const OPEN = "var(--brand-logo-4)"
const mix = [DONE, OPEN]
const colorOf = (_, i) => ({ style: { backgroundColor: mix[i] } })

const pct = (part, whole, locale) => {
  if (!(whole > 0)) return null
  const n = Math.round((part / whole) * 100)
  return locale === "tr" ? `%${n}` : `${n}%`
}

/**
 * Tibotlar sayfasının yıl kutusunun ayrıntısı (fare kartı ve telefon çekmecesi) — soldaki kutuların kalıbında:
 * bölümler, renkli dağılım çubuğu, noktalı satırlar ve yüzdeler. "Sana atanan" (kapattığın ·
 * süren) ve "Açtığın" (kapanan · süren); şu anki sayılar Tibotlar sayfasının öteki kutularında.
 */
export function TibotTileBody({ data, failed, period }) {
  const { t, locale } = useLocale()
  const n = (v) => number(v ?? 0, locale)
  if (failed) return <p className="text-[0.8125rem] text-muted-foreground">{t("tibot.failed")}</p>
  if (!data)
    return (
      <div aria-hidden="true" className="space-y-2">
        {[0, 1, 2].map((i) => (
          <span key={i} className="ms-skeleton block h-5 rounded-md" />
        ))}
      </div>
    )
  const assignedOpen = Math.max(0, data.assigned - data.closed)
  const openedOpen = Math.max(0, data.opened - data.openedClosed)
  const staffRows = [
    { key: "closed", count: data.closed },
    { key: "open", count: assignedOpen },
  ]
  const openedRows = [
    { key: "closed", count: data.openedClosed },
    { key: "open", count: openedOpen },
  ]
  return (
    <div className="flex min-w-0 flex-col gap-3.5">
      {data.assigned > 0 || data.closed > 0 ? (
        <Section
          title={t("tibot.tile.sectionAssigned", { period, n: n(data.assigned) })}
          info={t("tibot.tile.infoAssigned")}
        >
          <MixBar rows={staffRows} colorOf={colorOf} />
          <dl>
            <Row
              label={t("tibot.tile.closed")}
              value={n(data.closed)}
              color={DONE}
              pct={pct(data.closed, data.assigned, locale)}
            />
            <Row label={t("tibot.tile.stillOpen")} value={n(assignedOpen)} color={OPEN} />
          </dl>
        </Section>
      ) : null}
      <Section
        title={t("tibot.tile.sectionOpened", { period, n: n(data.opened) })}
        info={t("tibot.tile.infoOpened")}
      >
        {data.opened > 0 ? (
          <>
            <MixBar rows={openedRows} colorOf={colorOf} />
            <dl>
              <Row
                label={t("tibot.tile.openedClosed")}
                value={n(data.openedClosed)}
                color={DONE}
                pct={pct(data.openedClosed, data.opened, locale)}
              />
              <Row label={t("tibot.tile.stillOpen")} value={n(openedOpen)} color={OPEN} />
            </dl>
          </>
        ) : (
          <p className="text-[0.75rem] text-muted-foreground">{t("tibot.tile.noneOpened")}</p>
        )}
      </Section>
    </div>
  )
}
