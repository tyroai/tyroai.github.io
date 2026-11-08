import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import { PersonCard } from "@/components/common/PersonCard"
import { OfficeCard } from "@/features/feed/find/OfficeCard"
import { useCompanyDirectory } from "@/hooks/useCompanyDirectory"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graph"
import { peopleByOffice } from "@/lib/offices"

/**
 * Seçilen kişinin ya da ofisin kartı, listenin yerinde (Enter ya da telefonda dokunuş): baştaki
 * "Aramaya dön" ve Esc listeye döndürür, kartın eylemleri pencereyi kapatır. cmdk kökünün DIŞINDA
 * çizilir — kök Enter'ı yakalayıp kartın düğmelerini çalışmaz yapardı.
 */
export function SpotlightPane({ item, now, homeTz, query, onBack, onDone, onPeople }) {
  const { t } = useLocale()
  const dir = useCompanyDirectory(false)
  if (item.kind === "person")
    return (
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <PersonCard
          person={{
            name: item.person.name,
            address: item.person.address,
            title: item.person.title,
          }}
          onBack={onBack}
          backLabel={t("cmd.back")}
          focusBack
          onDone={onDone}
        />
      </div>
    )
  const people = dir.status === STATUS.ready ? peopleByOffice(dir.people).get(item.office.id) : null
  return (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <button
        type="button"
        autoFocus
        onClick={onBack}
        className="flex w-full items-center gap-1.5 border-b border-border/70 px-3.5 py-2 text-left text-[0.71875rem] font-semibold text-muted-foreground transition hover:bg-accent/50 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-11"
      >
        <HugeiconsIcon
          icon={ArrowLeft01Icon}
          className="size-3.5"
          strokeWidth={2}
          aria-hidden="true"
        />
        {t("cmd.back")}
      </button>
      <ul className="p-3">
        <OfficeCard
          office={item.office}
          now={now}
          homeTz={homeTz}
          query={query}
          people={people}
          onPeople={onPeople}
        />
      </ul>
    </div>
  )
}
