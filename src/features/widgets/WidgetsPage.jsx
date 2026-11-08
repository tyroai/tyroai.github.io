import { useRef } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useMe } from "@/hooks/useMe"
import { useMailMessages } from "@/hooks/useMailMessages"
import { useFeedFresh } from "@/hooks/useFeedUnread"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useFocusTasks } from "@/hooks/useFocusTasks"
import { useMyCelebration } from "@/hooks/useMyCelebration"
import { useTodoBoard } from "@/hooks/useTodoBoard"
import { useWeather } from "@/hooks/useWeather"
import { OverlayScrollbar } from "@/components/common/OverlayScrollbar"
import { PageShell } from "@/components/layout/PageShell"
import { AppsSection } from "@/features/myspace/AppsSection"
import { useMinuteNow } from "@/features/myspace/useMinuteNow"
import { Tour } from "@/components/tour/Tour"
import { useBoardEditing } from "@/lib/boardEdit"
import { BoardEditBar } from "./BoardEditBar"
import { MainWidgets } from "./MainWidgets"
import { MoreWidgets } from "./MoreWidgets"
import { WidgetEditor } from "./WidgetEditor"
import { renderWidgetFor } from "./renderWidget"
import { useWidgetLayout } from "./useWidgetLayout"
import { useBoardCalendar, useMeetingLoad } from "./useBoardCalendar"
import { useAvailableWidgets, useBoardBriefCta } from "./useBoardData"

/**
 * Pano (`/widgets`, widget sayfası) — Anasayfa'nın deneme kopyası. Ana bölüm
 * Anasayfa'nın üst kısmı gibi (solda hava + soru kutusu, sağda widget'lar),
 * altında "Diğer widget'lar", en altta asistanlar ve uygulamalar. Hava ve soru
 * kutusu dahil her kart bir widget; sıra, bölge ve yığınlar kişinin düzeninden
 * (`useWidgetLayout`). Düzenleme kipi header'daki "Panoyu düzenle"den
 * (`lib/boardEdit`). Kapı rotada
 * (`lib/widgetsPolicy.js`). Takvim, posta ve odak Anasayfa'yla aynı önbelleği
 * paylaşıyor; Graph'a ikinci kez gidilmiyor.
 */
export function WidgetsPage({ onOpenChat, onNewChat }) {
  const { t } = useLocale()
  const me = useMe()
  const editing = useBoardEditing()
  const pageAccess = usePageAccess()
  const celebration = useMyCelebration()
  const weather = useWeather()
  const now = useMinuteNow()
  const { cal, rangeStart, rangeEnd } = useBoardCalendar()
  const mail = useMailMessages(12)
  const feedFresh = useFeedFresh()
  const focus = useFocusTasks()
  const board = useTodoBoard()
  const briefCta = useBoardBriefCta()
  const scrollRef = useRef(null)
  const firstName = (me.name || "").split(" ")[0]
  const ctx = { cal, mail, focus, feedFresh, now, pageAccess, board }
  const layout = useWidgetLayout(useAvailableWidgets(pageAccess))
  const load = useMeetingLoad(cal.events, now, rangeStart, rangeEnd)

  const renderWidget = renderWidgetFor({
    weather,
    now,
    firstName,
    celebration,
    ctx,
    briefCta,
    onNewChat,
    load,
  })

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="ms-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
        <PageShell className="pb-16">
          <div className="@container/myspace">
            <h1 className="sr-only">{t("nav.widgets")}</h1>
            <WidgetEditor layout={layout} render={renderWidget}>
              <BoardEditBar />
              {/* Zemin (düzenleme çubuğu): arkada paletin yumuşak ışıkları — cam kart onunla belirginleşir. */}
              <div className="relative isolate">
                {layout.ambient && <div aria-hidden="true" className="board-ambient" />}
                <MainWidgets render={renderWidget} />
                <MoreWidgets render={renderWidget} />
              </div>
              <div aria-hidden="true" className="mt-12 lg:mt-14" />
              <AppsSection
                onOpenChat={onOpenChat}
                feedOpen={pageAccess.feed}
                className="mt-10 lg:mt-12"
              />
            </WidgetEditor>
          </div>
        </PageShell>
      </div>
      <OverlayScrollbar targetRef={scrollRef} avoidNotch />
      {/* Düzenleme kipi ilk kez açılınca kısa tur (Anasayfa'yla aynı). */}
      <Tour id="home-edit" when={editing} />
    </div>
  )
}
