import "@/lib/i18n/settings"
import { PageHeading } from "@/components/common/SectionHeading"
import { PageShell } from "@/components/layout/PageShell"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "motion/react"
import { GeneralTab } from "@/features/settings/GeneralTab"
import { useLocale } from "@/hooks/useLocale"
import { useMe } from "@/hooks/useMe"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { isAdminSection, sectionById } from "./sections"
import { useProfileSection } from "./useProfileSection"
import { AccessSection } from "./AccessSection"
import { AccountSection } from "./AccountSection"
import { AdminSection } from "./AdminSection"
import { AppearanceSection } from "./AppearanceSection"
import { NotificationsSection } from "./NotificationsSection"
import { Avatar, PhoneRoot } from "./PhoneRoot"
import { PhoneSubpage } from "./PhoneSubpage"
import { SectionHeader } from "./rows"
import { SectionNav } from "./SectionNav"

// İki bölme (15rem menü + boşluk + ≥30rem içerik) bu içerik eninin altında sığmaz.
const TWO_PANE_MIN = 760
// Yatay telefon: kısa ve kaba işaretçili ekran her zaman telefon düzeni.
const SHORT_TOUCH = "(max-height: 500px) and (pointer: coarse)"

/** Dar kap (telefon, dikey tablet, sohbet rıhtımı açık) ya da yatay telefon → iOS düzeni. */
function useCompact(ref) {
  const shortTouch = useMediaQuery(SHORT_TOUCH)
  const [narrow, setNarrow] = useState(
    () => typeof window !== "undefined" && window.innerWidth < TWO_PANE_MIN,
  )
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const read = (width) => setNarrow(width < TWO_PANE_MIN)
    const cs = getComputedStyle(el)
    read(el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight))
    if (typeof ResizeObserver === "undefined") return undefined
    const observer = new ResizeObserver(([entry]) => read(entry.contentRect.width))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return shortTouch || narrow
}

function SectionBody({ id, adminVerdict, onOpenSection }) {
  if (id === "account") return <AccountSection />
  if (id === "access") return <AccessSection />
  if (id === "preferences") return <AppearanceSection onOpenSection={onOpenSection} />
  if (id === "notifications") return <NotificationsSection />
  if (id === "storage") return <GeneralTab />
  return <AdminSection id={id} adminVerdict={adminVerdict} />
}

/**
 * Profilim (`/profile`) — ayar merkezi. Masaüstünde solda kimlik + bölüm menüsü, sağda bölüm;
 * telefonda iOS Ayarlar gibi kök liste ve alt sayfalar. Bölüm adreste (`?tab=`): Yardım'ın
 * bağlantıları, destek turunda paylaşılan adres ve yer imleri bölümü doğrudan açar.
 * Sayfa korunmuyor: gösterdiği her şey kullanıcının kendi verisi; yönetim bölümleri kapılı.
 */
export function ProfilePage() {
  const { t } = useLocale()
  const me = useMe()
  const reduce = useReducedMotion()
  const scrollRef = useRef(null)
  const boxRef = useRef(null)
  const compact = useCompact(boxRef)
  const { section, select, back, hrefFor, adminVerdict, sections } = useProfileSection(compact)
  const lastOpened = useRef(null)

  // Bölüm değişince başa; telefonda köke dönünce odak açılan satıra (kaldığı yer).
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
    if (section) {
      // Yalnız dar düzende açılan bölüm hatırlanır: masaüstünün varsayılan bölümü (Hesap) ölçüm
      // sonrası dar düzene geçilince köke odak halkası bırakmasın.
      if (compact) lastOpened.current = section
      return
    }
    const id = lastOpened.current
    if (compact && id) {
      boxRef.current?.querySelector(`[data-section="${id}"]`)?.focus({ preventScroll: true })
    }
  }, [section, compact])

  const meta = section ? sectionById(section) : null
  const title = meta ? t(meta.labelKey) : ""
  const description = meta ? t(meta.descKey) : ""
  const wide = section ? isAdminSection(section) : false
  const body = section ? (
    <SectionBody id={section} adminVerdict={adminVerdict} onOpenSection={select} />
  ) : null

  return (
    <div ref={scrollRef} className="flex min-h-0 w-full flex-1 flex-col overflow-y-auto">
      <PageShell ref={boxRef} notch={false} className="pb-10">
        {compact ? (
          <div className="@container/profile max-w-[42rem]">
            {section ? (
              <PhoneSubpage id={section} title={title} onBack={back}>
                <div className="space-y-5">
                  <SectionHeader title={title} description={description} compact />
                  {body}
                </div>
              </PhoneSubpage>
            ) : (
              <PhoneRoot sections={sections} hrefFor={hrefFor} />
            )}
          </div>
        ) : (
          <div className="max-w-[76rem]">
            <PageHeading
              eyebrow={t("profile.eyebrow")}
              title={t("profile.title")}
              description={t("profile.subtitle")}
              className="mb-6"
            />
            <div className="grid grid-cols-[15rem_minmax(0,1fr)] gap-10">
              <aside className="sticky top-6 space-y-6 self-start">
                <div className="flex items-center gap-3 px-3">
                  <Avatar
                    me={me}
                    className="size-10 shrink-0"
                    textClassName="select-none text-sm font-semibold leading-none"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{me.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{me.email}</p>
                  </div>
                </div>
                <SectionNav sections={sections} current={section} hrefFor={hrefFor} />
              </aside>
              <motion.div
                key={section}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className={
                  wide ? "@container/profile min-w-0" : "@container/profile min-w-0 max-w-[46rem]"
                }
              >
                <div className="space-y-6">
                  <SectionHeader title={title} description={description} />
                  {body}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </PageShell>
    </div>
  )
}
