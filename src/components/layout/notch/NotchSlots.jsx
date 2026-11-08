import { lazy, Suspense } from "react"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import TimeZoneIcon from "@hugeicons/core-free-icons/TimeZoneIcon"
import { CalendarPopover } from "@/components/common/CalendarPopover"
import { MailPopover } from "@/components/common/MailPopover"
import { WorldClockButton } from "@/components/worldclock/WorldClockButton"
import { CalendarAdd01Icon as AnimatedCalendarIcon } from "@/components/ui/calendar-add-01"
import { Mail01Icon as AnimatedMailIcon } from "@/components/ui/mail-01"
import { useLocale } from "@/hooks/useLocale"
import { useNotchSlots } from "./notchSlotStore"
import { RailButton } from "./RailButton"
import { ClocksButton } from "./ClocksButton"

// Widget yuvası tepsinin parçalarıyla çizilir: kod yalnız widget yuvası olana iner.
const NotchWidgetSlot = lazy(() => import("./NotchWidgetSlot"))

// Sayfanın panel isteği (`panelBus`) yuvası kaldırılmış bir panele gelirse çentiğe bağlı görünmez
// çapadan açılır: yan rayda solun ortası, şeritte altın ortası.
const GHOST = { left: "absolute left-0 top-1/2", bottom: "absolute bottom-0 left-1/2" }
const PANEL = { mail: MailPopover, calendar: CalendarPopover }

/**
 * Çentiğin yuvaları, kişinin sırasıyla (`notchSlotStore`): Posta ve Takvim header'ın AYNI
 * panellerini (`side` yönünde), Saatler dünya saati penceresini açar; widget yuvası widget'ı
 * tepsinin açtığı gibi açar. Halka rengi kimliğe bağlı (posta 1, takvim 2), hareket sırası yere.
 * `panel`: açık panel (sayfa isteği için denetimli), `delays`: halkaların sırayla dolması.
 */
export function NotchSlots({ side, mobile, panel, onPanel, counts, delays }) {
  const { t } = useLocale()
  const items = useNotchSlots()
  const toggle = (name) => (o) => onPanel(o ? name : null)
  return (
    <>
      {items.map((id, i) => {
        const delay = delays[i]
        if (id === "mail" || id === "calendar") {
          const P = PANEL[id]
          const mail = id === "mail"
          return (
            <P
              key={id}
              side={side}
              align="center"
              open={panel === id}
              onOpenChange={toggle(id)}
              trigger={
                <RailButton
                  icon={mail ? Mail01Icon : CalendarAdd01Icon}
                  animatedIcon={mail ? AnimatedMailIcon : AnimatedCalendarIcon}
                  label={t(mail ? "notch.mail" : "notch.calendar")}
                  count={mail ? counts.mail : counts.calendar}
                  accent={mail ? "var(--notch-hot-1)" : "var(--notch-hot-2)"}
                  delay={delay}
                />
              }
            />
          )
        }
        if (id === "clocks")
          return (
            <WorldClockButton
              key={id}
              trigger={
                <ClocksButton
                  icon={TimeZoneIcon}
                  label={t("notch.clocks")}
                  count={0}
                  accent="var(--notch-hot-3)"
                  delay={delay}
                />
              }
            />
          )
        return (
          <Suspense
            key={id}
            fallback={<span aria-hidden="true" className="min-h-[4.75rem] w-[4.5rem]" />}
          >
            <NotchWidgetSlot id={id} side={side} mobile={mobile} delay={delay} />
          </Suspense>
        )
      })}
      {Object.keys(PANEL)
        .filter((name) => panel === name && !items.includes(name))
        .map((name) => {
          const P = PANEL[name]
          return (
            <P
              key={`ghost-${name}`}
              side={side}
              align="center"
              open
              onOpenChange={toggle(name)}
              trigger={<span aria-hidden="true" className={GHOST[side]} />}
            />
          )
        })}
    </>
  )
}
