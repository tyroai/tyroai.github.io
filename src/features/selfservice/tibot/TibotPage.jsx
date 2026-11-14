import "@/lib/i18n/selfService"
import "@/lib/i18n/tibot"
import { useCallback, useRef } from "react"
import { useSearchParams } from "react-router-dom"
import { PageShell } from "@/components/layout/PageShell"
import { PageHeading } from "@/components/common/SectionHeading"
import { useLocale } from "@/hooks/useLocale"
import { useSelfServiceProfile } from "@/hooks/useSelfServiceProfile"
import { useTibotTickets } from "@/hooks/useTibotTickets"
import { cn } from "@/lib/utils"
import { SelfHero } from "../header/SelfHero"
import { PhoneContext, usePageLayout } from "../layout/phone"
import { TibotTeams } from "./TibotTeams"
import { TibotTray } from "./TibotTray"
import TicketsPanel from "./TicketsPanel"

const THIS_YEAR = new Date().getFullYear()
const YEARS = [THIS_YEAR, THIS_YEAR - 1, THIS_YEAR - 2]

/** Adresteki dönem: `?year=2025` · `?year=all` (Tümü); yoksa bu yıl. */
function readYear(params) {
  const raw = params.get("year")
  if (raw === "all") return null
  const y = Number(raw)
  return YEARS.includes(y) ? y : THIS_YEAR
}

/**
 * TİBOTLAR — Self Servis'in Ticket sürümü, yalnız okuma (kitle `lib/tibotPolicy`). Aynı kişi
 * kartı (`SelfHero`, Graph'tan; alt şeritte yönetici yerine Xurrent ekiplerin, `TibotTeams`), kartın beyaz tepsisinde dört kutu
 * (`TibotTray`: bende bekleyen · ekibimde · açtığım · dönemde kapanan) ve altında talepler
 * (`TicketsPanel`: kova çipleri, filtreler, arama, aylık gruplar, ayrıntı penceresi). Dar ve
 * kısa kapta tepsi kartın altında; telefonda kutular tek düğme → çekmece. Dönem adreste.
 */
export function TibotPage() {
  const { t } = useLocale()
  const box = useRef(null)
  const { phone, hero } = usePageLayout(box)
  const profile = useSelfServiceProfile(null, { erpLoading: false })
  const list = useTibotTickets(true)
  const [params, setParams] = useSearchParams()
  const year = readYear(params)
  const onYear = useCallback(
    (y) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (y === THIS_YEAR) next.delete("year")
          else next.set("year", y == null ? "all" : String(y))
          return next
        },
        { replace: true },
      ),
    [setParams],
  )
  const trayInside = !phone && (hero === "wide" || hero === "mid")
  const tray = (
    <TibotTray
      list={list}
      years={YEARS}
      year={year}
      onYear={onYear}
      onRefresh={list.refresh}
      below={!trayInside}
    />
  )
  return (
    <PhoneContext value={phone}>
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          className={cn(
            "ms-scroll flex min-h-0 flex-1 flex-col overflow-y-auto",
            phone && "scroll-pt-24 shortest:scroll-pt-0",
          )}
        >
          <PageShell className="pb-28">
            <div ref={box} className="@container/ss" data-private="">
              {/* Sayfa başlığı en üstte (öteki sayfalar gibi); telefonda üst çubuk sayfanın adını taşır. */}
              {phone ? (
                <h1 className="sr-only">{t("nav.tibot")}</h1>
              ) : (
                <PageHeading
                  eyebrow={t("tibot.pt.eyebrow")}
                  title={t("tibot.pt.records")}
                  className="mb-6"
                />
              )}
              <SelfHero
                profile={profile}
                team={null}
                band={hero}
                tray={trayInside && tray}
                showMeta={false}
                people={
                  <TibotTeams
                    teams={list.data?.teams}
                    loading={list.status === "loading"}
                    compact={hero !== "wide"}
                  />
                }
              />
              {!trayInside && tray}
              <section
                aria-labelledby="tb-records"
                className={cn("min-w-0", phone ? "mt-6" : "mt-8")}
              >
                <h2 id="tb-records" className="sr-only">
                  {t("tibot.pt.records")}
                </h2>
                <TicketsPanel />
              </section>
            </div>
          </PageShell>
        </div>
      </div>
    </PhoneContext>
  )
}
