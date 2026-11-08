import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import HelpCircleIcon from "@hugeicons/core-free-icons/HelpCircleIcon"
import { FileBadge } from "@/components/common/FileBadge"
import { PersonCard } from "@/components/common/PersonCard"
import { OfficeCard } from "@/features/feed/find/OfficeCard"
import { useCompanyDirectory } from "@/hooks/useCompanyDirectory"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { peopleByOffice } from "@/lib/offices"
import { STATUS } from "@/lib/graph"
import { cn } from "@/lib/utils"

const BUTTON =
  "inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-[0.75rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11"
const PRIMARY = cn(BUTTON, "bg-brand-fill-deep text-brand-on-brand shadow-sm hover:brightness-110")
const SECONDARY = cn(BUTTON, "border border-border bg-card text-foreground/85 hover:bg-accent/60")

/**
 * Seçili sonucun önizlemesi (geniş ekran, listenin sağında): kişinin kartı, ofisin kartı, Yardım
 * cevabının kendisi, dosyanın ayrıntısı; sayfa ve eylemde büyük glif. Açmadan görülsün diye —
 * `act(item)` öğeyi açar (listedeki ↵ ile aynı), `close` pencereyi kapatır.
 */
export function SpotlightPreview({ item, query, now, homeTz, act, close, onPeople }) {
  const { t, locale } = useLocale()
  const dir = useCompanyDirectory(false)
  const byOffice = useMemo(
    () => (dir.status === STATUS.ready ? peopleByOffice(dir.people) : new Map()),
    [dir.status, dir.people],
  )
  if (!item) return null

  switch (item.kind) {
    case "person":
      return (
        <PersonCard
          key={item.key}
          person={{
            name: item.person.name,
            address: item.person.address,
            title: item.person.title,
          }}
          onDone={close}
        />
      )
    case "office":
      return (
        <ul className="p-3">
          <OfficeCard
            office={item.office}
            now={now}
            homeTz={homeTz}
            query={query}
            people={byOffice.get(item.office.id)}
            onPeople={onPeople}
          />
        </ul>
      )
    case "faq":
      return (
        <div className="flex flex-col gap-3 p-4">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-xl bg-brand/[0.09] text-brand-ink"
          >
            <HugeiconsIcon icon={HelpCircleIcon} className="size-5" strokeWidth={1.8} />
          </span>
          <p
            lang={locale}
            dir="auto"
            className="text-left text-[0.875rem] font-semibold leading-snug"
          >
            {item.label}
          </p>
          <p
            lang={locale}
            dir="auto"
            className="text-left text-[0.8125rem] leading-relaxed text-foreground/80"
          >
            {item.answer}
          </p>
          <button type="button" onClick={() => act(item)} className={cn(SECONDARY, "self-start")}>
            {t("spotlight.openHelp")}
          </button>
        </div>
      )
    case "file": {
      const f = item.file
      const when = f.modified
        ? getDateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(f.modified))
        : null
      return (
        <div className="flex flex-col gap-3 p-4">
          <FileBadge item={f} size="lg" />
          <p
            lang="tr"
            className="text-[0.875rem] font-semibold leading-snug [overflow-wrap:anywhere]"
          >
            {f.name}
          </p>
          {(f.modifiedBy || when) && (
            <p className="text-[0.75rem] text-foreground/70">
              {[f.modifiedBy, when].filter(Boolean).join(" · ")}
            </p>
          )}
          <a
            href={f.webUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(PRIMARY, "self-start")}
          >
            {t("spotlight.openFile")}
            <HugeiconsIcon
              icon={ArrowUpRight01Icon}
              className="size-3.5"
              strokeWidth={2}
              aria-hidden="true"
            />
          </a>
        </div>
      )
    }
    case "ask":
      return (
        <div className="flex flex-col gap-3 p-4">
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-xl bg-brand-fill-deep text-brand-on-brand"
          >
            <HugeiconsIcon icon={AiChat02Icon} className="size-5" strokeWidth={1.8} />
          </span>
          <p
            dir="auto"
            className="text-left text-[0.9375rem] font-semibold leading-snug [overflow-wrap:anywhere]"
          >
            “{query}”
          </p>
          <button type="button" onClick={() => act(item)} className={cn(PRIMARY, "self-start")}>
            {t("spotlight.askAction")}
          </button>
        </div>
      )
    default:
      return (
        <div className="flex flex-col items-start gap-3 p-4">
          <span
            aria-hidden="true"
            className="grid size-12 place-items-center rounded-2xl bg-brand/[0.09] text-brand-ink"
          >
            <HugeiconsIcon icon={item.icon} className="size-6" strokeWidth={1.7} />
          </span>
          <p
            lang={locale}
            dir="auto"
            className="text-left text-[0.9375rem] font-semibold leading-snug"
          >
            {item.label}
          </p>
          {(item.parent || item.sub) && (
            <p lang={locale} dir="auto" className="text-left text-[0.75rem] text-foreground/70">
              {item.parent ?? item.sub}
            </p>
          )}
          <button type="button" onClick={() => act(item)} className={SECONDARY}>
            {item.kind === "action" ? t("spotlight.run") : t("spotlight.open")}
          </button>
        </div>
      )
  }
}
