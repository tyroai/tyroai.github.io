import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import HelpCircleIcon from "@hugeicons/core-free-icons/HelpCircleIcon"
import { FileBadge } from "@/components/common/FileBadge"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { CommandItem } from "@/components/ui/command"
import { Kbd } from "@/components/ui/kbd"
import { useLocale } from "@/hooks/useLocale"
import { KIND_ICON } from "@/features/feed/find/officeIcons"
import { officeCityName, officeClock } from "@/lib/offices"
import { cn } from "@/lib/utils"
import { SpotlightMark } from "./SpotlightMark"

const TILE = "grid size-8 shrink-0 place-items-center rounded-lg"

/**
 * Spotlight'ın bir satırı — türüne göre glif (foto, ofis türü, sayfa simgesi, dosya rozeti),
 * ad ve tek satır ayrıntı; seçili satırın sonunda ↵. `onSelect` öğeyi açar.
 */
export function SpotlightRow({ item, query, photo, now, homeTz, onSelect }) {
  const { t, locale } = useLocale()
  const lead = leadFor(item, photo)
  const sub = subFor(item, t, locale, now, homeTz)
  // Rehber ve dosya verisi Türkçe; geri kalan (sayfa, cevap, ofis türü) arayüz dilinde. Sayfa hep
  // LTR: Arapça satırın noktalaması kendi yönünde dizilsin diye `dir="auto"`.
  const own = item.kind === "person" || item.kind === "file"
  return (
    <CommandItem
      value={item.key}
      onSelect={() => onSelect(item)}
      className="min-h-12 gap-3 rounded-xl px-2.5 py-2 text-[0.8125rem] [@media(pointer:coarse)]:min-h-14"
    >
      {lead}
      <span className="min-w-0 flex-1">
        <span
          lang={own || item.kind === "office" ? "tr" : locale}
          dir="auto"
          className="block truncate text-left font-medium text-foreground"
        >
          {item.kind === "ask" ? (
            <>
              {t("spotlight.askLead")} <bdi className="font-semibold">“{query}”</bdi>
            </>
          ) : item.kind === "more" ? (
            item.label
          ) : (
            <SpotlightMark text={item.label} query={query} />
          )}
        </span>
        {sub && (
          <span
            lang={own ? "tr" : locale}
            dir="auto"
            className="block truncate text-left text-[0.71875rem] text-foreground/65"
          >
            {sub}
          </span>
        )}
      </span>
      {item.kind === "external" && (
        <HugeiconsIcon
          icon={ArrowUpRight01Icon}
          className="size-3.5 text-muted-foreground"
          strokeWidth={1.9}
          aria-hidden="true"
        />
      )}
      <Kbd
        aria-hidden="true"
        className="text-foreground/75 hidden group-data-selected/command-item:inline-flex [@media(pointer:coarse)]:!hidden"
      >
        ↵
      </Kbd>
    </CommandItem>
  )
}

function leadFor(item, photo) {
  if (item.kind === "person")
    return (
      <PersonAvatar
        name={item.person.name}
        photo={photo}
        className="size-8 text-[0.6875rem] [&>span:first-of-type]:text-[0.6875rem]"
      />
    )
  if (item.kind === "file") return <FileBadge item={item.file} />
  if (item.kind === "ask")
    return (
      <span aria-hidden="true" className={cn(TILE, "bg-brand-fill-deep text-brand-on-brand")}>
        <HugeiconsIcon icon={AiChat02Icon} className="size-4" strokeWidth={1.9} />
      </span>
    )
  const icon =
    item.kind === "office"
      ? KIND_ICON[item.office.kind]
      : item.kind === "faq"
        ? HelpCircleIcon
        : item.icon
  return (
    <span aria-hidden="true" className={cn(TILE, "bg-brand/[0.09] text-brand-ink")}>
      <HugeiconsIcon icon={icon} className="size-4" strokeWidth={1.9} />
    </span>
  )
}

function subFor(item, t, locale, now, homeTz) {
  switch (item.kind) {
    case "person": {
      const p = item.person
      if (item.field === "phone" && item.phone) return item.phone
      if (item.field === "office" && p.office) return p.office
      return [p.title, p.department].filter(Boolean).join(" · ")
    }
    case "office": {
      const o = item.office
      const clock = officeClock(o, now, locale, homeTz)
      const city = officeCityName(o, locale)
      const kind = t(`find.office.kind.${o.kind}`)
      return [kind, city, clock.diff ? t("find.office.localTime", { time: clock.time }) : null]
        .filter(Boolean)
        .join(" · ")
    }
    case "page":
      return item.parent ?? null
    case "external":
      return item.sub
    case "faq":
      return item.answer
    case "file":
      return [
        item.file.modifiedBy,
        item.file.driveType === "documentLibrary" ? "SharePoint" : "OneDrive",
      ]
        .filter(Boolean)
        .join(" · ")
    default:
      return null
  }
}
