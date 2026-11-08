import { useRef } from "react"
import { OverlayScrollbar } from "@/components/common/OverlayScrollbar"
import { PageShell } from "@/components/layout/PageShell"
import { usePageAccess } from "@/hooks/usePageAccess"
import { CalendarScreen } from "./CalendarScreen"
import { LeaveSource, TasksSource } from "./CalendarSources"
import { LeaveDesk } from "./LeaveDesk"

/**
 * ═══════════════════════════════════════════════════════════════════════
 *  Takvim (`/calendar`) — uygulamada takvimde görülmesi gereken HER ŞEY tek yerde
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Toplantılar ve odak blokları (Outlook), görevler (To Do), izinlerim ve ekibin izinleri (Self
 * Servis; ekibinkinde tür yok), kutlamalar, resmî tatiller, seyahat. İstek ve kararlar
 * `docs/features/takvim.md`te.
 *
 * | dosya | işi |
 * |---|---|
 * | `CalendarSources.jsx` | kapıya bağlı kaynaklar: To-Do panosu, Self Servis izinleri ve ekip |
 * | `LeaveDesk.jsx` | izin masası: Self Servis'in talep formu ve kayıt ayrıntısı takvimin üstünde |
 * | `LazyMeetingDialog.jsx` · `meeting/` | Yeni › Toplantı: takvimin üstünde pencere, Graph'a yazar (ayrı tembel parça) |
 * | `LazyTaskDialog.jsx` · `task/` | Yeni › Görev: takvimin üstünde pencere (liste, tarih, adımlar, not), To-Do panosuna yazar (ayrı tembel parça) |
 * | `CalendarScreen.jsx` | gövde: araç çubuğu, çipler, görünümler, panel, tablo, popover'lar |
 * | `useCalendarItems.js` | Outlook + kaynaklar → tek öğe listesi; katman başına durum |
 * | `useCalendarState.js` | görünüm, gün, katmanlar, arama, kısayollar (tercihler bu tarayıcıda) |
 * | `WeekGrid` · `MonthGrid` · `AgendaList` | hafta/gün, ay, telefon ajandası |
 * | `lib/calendar/` | SAF HESAP: aralık, öğe biçimi, çakışma şeritleri, çip yerleşimi (testli) |
 *
 * ⚠️ **KAPI ROTADA** (`App.jsx` › `access.calendar`, kitle `lib/calendarPolicy.js`): ilk sürüm
 * yalnız uygulama yöneticileri. Görev ve izin kaynakları kendi kapılarına da bağlı
 * (`access.todo`, `access.selfService`): kapalı kapıda o kanca hiç çalışmaz.
 *
 * ⚠️ **DÜZEN DÜZ CSS'TE** (`calendar*.css`): Tailwind tek giriş CSS'i üretiyor, tembel sayfanın
 * sınıfları da ona girerdi; bütçe dolu.
 */
export function CalendarPage() {
  const access = usePageAccess()
  const scrollRef = useRef(null)
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div ref={scrollRef} className="ms-scroll flex min-h-0 flex-1 flex-col overflow-y-auto">
        <PageShell className="pb-16">
          <TasksSource enabled={access.todo}>
            {(tasks) => (
              <LeaveSource enabled={access.selfService}>
                {(leave) => (
                  <LeaveDesk leave={leave}>
                    <CalendarScreen access={access} tasks={tasks} leave={leave} />
                  </LeaveDesk>
                )}
              </LeaveSource>
            )}
          </TasksSource>
        </PageShell>
      </div>
      <OverlayScrollbar targetRef={scrollRef} avoidNotch />
    </div>
  )
}
