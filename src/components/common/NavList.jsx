import { useRef } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "@/hooks/useLocale"
import { isRtl, rovingIndex } from "@/lib/rovingKeys"
import { cn } from "@/lib/utils"

const GROUP_LABEL = "text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"

/**
 * Sol bölüm menüsü (Profil `SectionNav` ile aynı görünüş): seçili satır = marka mürekkebi + ince sol
 * çubuk + soluk zemin, uygulamada tek "seçili" dili. İki kip:
 * - `jump`: sayfa içi bölümlere iner; gerçek bağlantı (`#id`, `aria-current="location"`), tıklamayı
 *   `onSelect` yönetir (sayfa kendi kaydırıcısını kaydırır, tarayıcının çapa kaydırması değil).
 * - `filter`: tek seçimli süzgeç; düğme (`aria-pressed`).
 * `item.children` alt satırlardır (girintili, simgesiz): içlerinden biri seçiliyse üst satır dolu
 * seçili görünür, alt satır yalnız marka yazısı alır. `current` boş/`null` ise hiçbir şey seçili değil.
 * Oklar odağı satırlar arasında taşır (Home/End uçlara).
 */
export function NavList({ label, groups, current, onSelect, mode = "jump", className }) {
  const { locale } = useLocale()
  const refs = useRef([])
  const flat = groups.flatMap((g) => g.items.flatMap((i) => [i, ...(i.children ?? [])]))

  function onKeyDown(event, index) {
    const next = rovingIndex(event.key, index, flat.length, isRtl(event.currentTarget))
    if (next < 0 || event.altKey || event.ctrlKey || event.metaKey) return
    event.preventDefault()
    refs.current[next]?.focus()
  }

  const row = (item, { sub = false, active, onPath }) => {
    const index = flat.indexOf(item)
    const props = {
      ref: (el) => {
        refs.current[index] = el
      },
      onKeyDown: (e) => onKeyDown(e, index),
      className: cn(
        "flex items-center gap-2.5 rounded-lg px-3 text-start text-sm outline-none transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring/60",
        sub ? "h-8 ps-10 text-[0.8125rem] pointer-coarse:h-11" : "h-9 w-full pointer-coarse:h-11",
        onPath
          ? "bg-sidebar-accent font-semibold text-brand"
          : sub && active
            ? "font-medium text-brand"
            : "text-foreground/80 hover:bg-foreground/[0.04] hover:text-foreground",
      ),
    }
    const body = (
      <>
        {item.icon ? (
          <HugeiconsIcon
            icon={item.icon}
            aria-hidden="true"
            className={cn(
              "size-[1.125rem] shrink-0",
              onPath ? "text-brand" : "text-muted-foreground",
            )}
            strokeWidth={1.8}
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {item.count != null ? (
          <span className="shrink-0 text-[0.8125rem] font-normal tabular-nums text-foreground/65">
            {item.count}
          </span>
        ) : null}
      </>
    )
    return (
      <li key={item.id} className="relative">
        {onPath ? (
          <span
            aria-hidden="true"
            className="absolute start-0 top-1/2 h-5 w-[0.1875rem] -translate-y-1/2 rounded-e-full bg-brand"
          />
        ) : null}
        {mode === "filter" ? (
          <button type="button" aria-pressed={active} onClick={() => onSelect(item.id)} {...props}>
            {body}
          </button>
        ) : (
          <a
            href={`#${item.id}`}
            aria-current={active ? "location" : undefined}
            onClick={(e) => {
              e.preventDefault()
              onSelect(item.id)
            }}
            {...props}
          >
            {body}
          </a>
        )}
      </li>
    )
  }

  return (
    <nav aria-label={label} className={cn("space-y-5", className)}>
      {groups.map((group) => (
        <div key={group.id} className="space-y-1">
          {group.label ? (
            <p lang={locale} className={cn(GROUP_LABEL, "px-3 pb-1")}>
              {group.label}
            </p>
          ) : null}
          <ul className="space-y-0.5">
            {group.items.flatMap((item) => {
              const kids = item.children ?? []
              const active = item.id === current || kids.some((c) => c.id === current)
              return [
                row(item, { active, onPath: active }),
                ...kids.map((kid) => row(kid, { sub: true, active: kid.id === current })),
              ]
            })}
          </ul>
        </div>
      ))}
    </nav>
  )
}
