import { useRef } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "@/hooks/useLocale"
import { isRtl, rovingIndex } from "@/lib/rovingKeys"
import { cn } from "@/lib/utils"
import { prefetchSection } from "./adminLoaders"
import { GROUP_LABEL } from "./rows"

/**
 * Masaüstü bölüm menüsü (GitHub/Linear ayarları gibi solda dikey). Seçili görünüş kenar
 * çubuğunun seçili satırı: zemin + marka mürekkebi + ince çizgi — uygulamada tek "seçili" dili.
 * Bağlantılar `replace` (bölüm değiştirmek gezinme değil); oklar odağı satırlar arasında taşır.
 */
export function SectionNav({ sections, current, hrefFor }) {
  const { t, locale } = useLocale()
  const refs = useRef([])
  const groups = [
    { id: "mine", label: t("profile.hub.groupMine") },
    { id: "admin", label: t("profile.hub.groupAdmin") },
  ]

  function onKeyDown(event, index) {
    const next = rovingIndex(event.key, index, sections.length, isRtl(event.currentTarget))
    if (next < 0 || event.altKey || event.ctrlKey || event.metaKey) return
    event.preventDefault()
    refs.current[next]?.focus()
  }

  return (
    <nav aria-label={t("profile.hub.nav")} className="space-y-5">
      {groups.map((group) => {
        const items = sections.filter((s) => s.group === group.id)
        if (items.length === 0) return null
        return (
          <div key={group.id} className="space-y-1">
            <p lang={locale} className={cn(GROUP_LABEL, "px-3 pb-1")}>
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {items.map((section) => {
                const index = sections.indexOf(section)
                const active = section.id === current
                return (
                  <li key={section.id} className="relative">
                    {active ? (
                      <span
                        aria-hidden="true"
                        className="absolute start-0 top-1/2 h-5 w-[0.1875rem] -translate-y-1/2 rounded-e-full bg-brand"
                      />
                    ) : null}
                    <Link
                      ref={(el) => {
                        refs.current[index] = el
                      }}
                      to={hrefFor(section.id)}
                      replace
                      aria-current={active ? "page" : undefined}
                      onKeyDown={(e) => onKeyDown(e, index)}
                      onPointerEnter={() => prefetchSection(section.id)}
                      onFocus={() => prefetchSection(section.id)}
                      className={cn(
                        "flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm outline-none transition-colors pointer-coarse:h-11",
                        "focus-visible:ring-2 focus-visible:ring-ring/60",
                        active
                          ? "bg-sidebar-accent font-semibold text-brand"
                          : "text-foreground/80 hover:bg-foreground/[0.04] hover:text-foreground",
                      )}
                    >
                      <HugeiconsIcon
                        icon={section.icon}
                        className={cn(
                          "size-[1.125rem] shrink-0",
                          active ? "text-brand" : "text-muted-foreground",
                        )}
                        strokeWidth={1.8}
                      />
                      <span className="truncate">{t(section.labelKey)}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
