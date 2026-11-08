import { useDeferredValue, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import UserMultiple02Icon from "@hugeicons/core-free-icons/UserMultiple02Icon"
import { useCompanyDirectory } from "@/hooks/useCompanyDirectory"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graph"
import { getNumberFormat, pluralKey } from "@/lib/intl-cache"
import { peopleByOffice } from "@/lib/offices"
import { peopleWith, searchPeople } from "@/lib/peopleIndex"
import { setPeopleFilter } from "@/lib/findScope"
import { EmptyCard, Notice, RowsSkeleton } from "../files/FilesStates"
import { LoadMore, ResultsHeader } from "../files/FilesViews"
import { DirectoryStatus } from "./DirectoryStatus"
import { OrgView } from "./OrgView"
import { PeopleHome } from "./PeopleHome"
import { PeopleList } from "./PeopleList"
import { usePeopleFilter } from "./usePeopleFilter"

const PAGE = 30

/** Filtredeki kişiler (departman ya da ofis), ada göre. */
function filtered(people, filter) {
  if (filter.kind === "office") return peopleByOffice(people).get(filter.id) ?? []
  return peopleWith(people, "department", filter.id)
}

/**
 * Bul › Kişiler. Boş kutuda ekibin ve departmanlar (`PeopleHome`); yazınca bütün rehberde
 * anında arama; bir departman ya da ofis seçiliyse arama onun içinde. `forg` varsa (kutu boşken)
 * organizasyon görünümü — rehberden bağımsız, kendi sorgusuyla. Rehber okunamazsa sebep ve çare
 * listenin yerinde ("soramadık ≠ kimse yok").
 */
export function PeopleView({ text, titleRef }) {
  const dir = useCompanyDirectory()
  const filter = usePeopleFilter()
  const [params] = useSearchParams()
  const org = params.get("forg")
  const q = useDeferredValue(text.trim())

  if (!q && org) return <OrgView key={org} id={org} titleRef={titleRef} />
  if (dir.status === "loading" || dir.status === "idle") return <RowsSkeleton rows={8} />
  if (dir.status !== STATUS.ready) return <DirectoryStatus dir={dir} />
  if (!q && !filter) return <PeopleHome dir={dir} />
  return (
    <PeopleResults
      // Sorgu ya da filtre değişince sayfa başa döner.
      key={`${q}|${filter?.kind}:${filter?.id}`}
      dir={dir}
      q={q}
      filter={filter}
      titleRef={titleRef}
    />
  )
}

function PeopleResults({ dir, q, filter, titleRef }) {
  const { t, locale } = useLocale()
  const num = getNumberFormat(locale)
  const [limit, setLimit] = useState(PAGE)
  const rows = useMemo(() => {
    const inFilter = filter ? filtered(dir.people, filter) : null
    if (!q) return inFilter.map((person) => ({ person }))
    const hits = searchPeople(dir.index, q)
    if (!inFilter) return hits
    const ids = new Set(inFilter.map((p) => p.id))
    return hits.filter((r) => ids.has(r.person.id))
  }, [dir.people, dir.index, q, filter])

  const count = rows.length
  const summary = t(pluralKey("find.people.count", locale, count), { n: num.format(count) })
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ResultsHeader
        title={q ? t("find.people.results") : filter.label}
        summary={summary}
        titleRef={titleRef}
      />
      {filter && <FilterChip filter={filter} />}
      {dir.limited && <Notice>{t("find.people.limited")}</Notice>}
      {count ? (
        <>
          <PeopleList rows={rows.slice(0, limit)} query={q} />
          <LoadMore hasMore={count > limit} onMore={() => setLimit((n) => n + PAGE)} />
        </>
      ) : (
        <EmptyCard
          title={q ? t("find.people.none", { q }) : t("find.people.noneFilter")}
          body={filter ? t("find.people.noneInFilter") : t("find.people.noneHint")}
        />
      )}
    </div>
  )
}

/** Etkin filtre: tek dokunuşla kalkar (Dosyalarım'ın etkin çip tarifi). */
function FilterChip({ filter }) {
  const { t } = useLocale()
  const label = filter.kind === "office" ? t("find.people.inOffice") : t("find.people.inDept")
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => setPeopleFilter(null)}
        aria-label={t("myfiles.filter.remove", { label: `${label}: ${filter.label}` })}
        className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full border border-brand/30 bg-brand/[0.09] px-3 text-[0.75rem] font-semibold transition hover:bg-brand/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-11"
      >
        <HugeiconsIcon
          icon={filter.kind === "office" ? Location01Icon : UserMultiple02Icon}
          className="size-3.5 shrink-0 text-brand"
          strokeWidth={1.9}
          aria-hidden="true"
        />
        <span className="truncate">{filter.label}</span>
        <HugeiconsIcon
          icon={Cancel01Icon}
          className="size-3 shrink-0 opacity-70"
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
