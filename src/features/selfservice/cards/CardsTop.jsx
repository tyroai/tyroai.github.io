import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Download04Icon from "@hugeicons/core-free-icons/Download04Icon"
import { RefreshButton } from "@/components/common/RefreshButton"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import { useLocale } from "@/hooks/useLocale"
import { NewRequestWand } from "../header/NewRequestWand"
import { exportRecords } from "../period/exportRecords"
import { updatedText } from "../period/updatedText"
import { refreshAll } from "../lib/refreshAll"
import { IdentityCard } from "./IdentityCard"
import { KpiCards } from "./KpiCards"
import { StoryCard } from "./StoryCard"
import { StoryPhone } from "./StoryPhone"
import { ViewSwitch } from "./ViewSwitch"
import "./cards.css"

/**
 * KARTLAR DÜZENİ — Self Servis'in üst alanı (Profil › Görünüm › Sayfa düzeni), onaylanan prototipin
 * yerleşimi ve ölçüleriyle. Tek üst çubuk: görünüm (Ben · Ekibim n) ve dönem bölmeli seçimleri …
 * "Güncellendi", Yenile, Dışa aktar ve ana eylem Yeni. Altında kimlik kartı (5) ile TYRO'nun
 * anlattığı özet (7) yan yana, onların altında üç gösterge kartı; hemen ardından sekmeler, liste
 * ve seçili kaydın paneli (`MyRecords plain` › `RecordsPane`). Veri, dönem, dışa aktarma ve
 * ayrıntılar standart düzenle aynı. Ekibim'de çubuk ve kartlar `TeamView`in içinde (`lead`,
 * `team/TeamCards`).
 *
 * Telefonda (`phone`) üst alan standart kalır (kart tek sütun, özet listenin üstünde); buradan
 * yalnız TYRO özeti gelir, tek satır + çekmece olarak (`StoryPhone`).
 */
export function CardsTop({
  phone,
  profile,
  team,
  ss,
  data,
  view,
  sel,
  years,
  update,
  accrual,
  onNew,
  onAsk,
}) {
  const { t, locale } = useLocale()
  const loading = ss.status === "loading"
  const ready = ss.status === "ready" && Boolean(data)
  const teamView = Boolean(team?.active)
  const all = t("selfService.allYears")
  const yearOptions = useMemo(
    () => [...years, null].map((y) => ({ value: y, label: String(y ?? all) })),
    [years, all],
  )
  // Bekleyenleri listede göster: sekme ve durum filtresi seçilir, liste görünür alana gelir.
  const onFocus = (focus) => {
    update({ tab: focus.tab, status: focus.status, facet: null, month: null })
    requestAnimationFrame(() =>
      document.getElementById("ss-records")?.scrollIntoView({ block: "start", behavior: "smooth" }),
    )
  }
  const Story = phone ? StoryPhone : StoryCard
  const story = (loading || ready) && (
    <Story
      data={data}
      year={sel.year}
      balance={data?.balance ?? null}
      accrual={accrual}
      loading={loading}
      onFocus={onFocus}
      onNew={onNew}
      onAsk={onAsk}
    />
  )
  if (phone) return teamView ? null : <div className="ssc ssc-phone">{story}</div>
  // Ekibim'de üst çubuk ekibin kendi çubuğudur (anahtar oraya geçer): burada çizilecek bir şey yok.
  if (teamView) return null
  const updated = ready ? updatedText(ss.updatedAt, locale) : ""
  const exportLabel = t("selfService.export.aria", { n: view.shown.length })
  return (
    <div className="ssc">
      <div className="ssc-top">
        {team && <ViewSwitch team={team} />}
        {ready && (
          <span className="ssc-years">
            <SegmentedControl
              label={t("selfService.period")}
              value={sel.year}
              onChange={(y) => update({ year: y })}
              options={yearOptions}
            />
          </span>
        )}
        <span className="ssc-top-gap" />
        {updated && (
          <span className="ssc-updated">{t("selfService.updated", { time: updated })}</span>
        )}
        {ready && (
          <>
            <RefreshButton
              label={t("toolbar.refresh")}
              busy={ss.busy}
              onRefresh={() => refreshAll(ss.refresh)}
              className="ssc-refresh"
            />
            <button
              type="button"
              onClick={() => exportRecords(t, { tab: sel.tab, year: sel.year, view })}
              disabled={!view.shown.length}
              aria-label={exportLabel}
              title={exportLabel}
              className="ssc-pill"
            >
              <HugeiconsIcon icon={Download04Icon} strokeWidth={1.9} aria-hidden="true" />
              {t("selfService.export.label")}
            </button>
          </>
        )}
        {onNew && ready && (
          <span className="ssc-new">
            <NewRequestWand onNew={onNew} />
          </span>
        )}
      </div>
      <div className="ssc-row">
        <IdentityCard profile={profile} team={team} />
        {story}
      </div>
      {(loading || ready) && (
        <KpiCards
          data={data}
          summary={view.summary}
          year={sel.year}
          accrual={accrual}
          loading={loading}
        />
      )}
    </div>
  )
}
