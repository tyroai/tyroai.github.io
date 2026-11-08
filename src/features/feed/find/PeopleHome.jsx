import { useMemo, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { HugeiconsIcon } from "@hugeicons/react"
import HierarchyIcon from "@hugeicons/core-free-icons/HierarchyIcon"
import { useLocale } from "@/hooks/useLocale"
import { useMyTeam } from "@/hooks/useMyTeam"
import { setPeopleFilter } from "@/lib/findScope"
import { getNumberFormat, pluralKey } from "@/lib/intl-cache"
import { facetOf } from "@/lib/peopleIndex"
import { RELATION } from "@/lib/teamCircle"
import { cn } from "@/lib/utils"
import { RowsSkeleton } from "../files/FilesStates"
import { PeopleList } from "./PeopleList"
import { useOrgNav } from "./useOrgNav"

const DEPTS_SHOWN = 12
const ORDER = { [RELATION.manager]: 0, [RELATION.report]: 1, [RELATION.peer]: 2 }

/**
 * Kişiler'in açılışı (kutu boş): EKİBİN (yöneticin, sana bağlılar, ekip arkadaşların — en sık
 * aranan insanlar) ve DEPARTMANLAR (rehberin kendisinden, kalabalıktan aza; basınca o departmanın
 * listesi). Ekip okunamazsa bölüm hiç çizilmez: rehber araması yine çalışıyor. Ekibin altında
 * "Organizasyonumu gör": ağaç kişinin kendisine odaklı açılır.
 */
export function PeopleHome({ dir }) {
  const { t } = useLocale()
  const team = useMyTeam()
  const { accounts } = useMsal()
  const myId = accounts[0]?.localAccountId
  const openOrg = useOrgNav()
  const members = useMemo(
    () =>
      team.people
        .filter((p) => p.relation !== RELATION.self && p.address)
        .sort((a, b) => (ORDER[a.relation] ?? 3) - (ORDER[b.relation] ?? 3))
        .map((person) => ({ person })),
    [team.people],
  )
  const departments = useMemo(() => facetOf(dir.people, "department"), [dir.people])
  const tagFor = (p) =>
    p.relation === RELATION.manager
      ? t("find.team.manager")
      : p.relation === RELATION.report
        ? t("find.team.report")
        : null

  return (
    <div className="flex min-w-0 flex-col gap-8">
      {team.status === "loading" && !members.length ? (
        <RowsSkeleton rows={3} />
      ) : (
        members.length > 0 && (
          <div className="min-w-0">
            <PeopleList
              label={t("find.team.title")}
              count={members.length}
              rows={members}
              tagFor={tagFor}
            />
            {myId && (
              <button
                type="button"
                onClick={() => openOrg(myId)}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold text-brand-ink transition hover:bg-brand/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
              >
                <HugeiconsIcon
                  icon={HierarchyIcon}
                  className="size-3.5"
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
                {t("find.org.mine")}
              </button>
            )}
          </div>
        )
      )}
      {departments.length > 0 && <Departments departments={departments} />}
    </div>
  )
}

/** Departman kutucukları: ad + kişi sayısı; ilk on iki, gerisi "Tümünü göster"de. */
function Departments({ departments }) {
  const { t, locale } = useLocale()
  const num = getNumberFormat(locale)
  const [all, setAll] = useState(false)
  const shown = all ? departments : departments.slice(0, DEPTS_SHOWN)
  return (
    <section aria-labelledby="find-depts-title" className="min-w-0">
      <h3
        id="find-depts-title"
        lang={locale}
        className="flex items-center gap-2 px-3 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
      >
        <span>{t("find.depts.title")}</span>
        <span className="font-medium tabular-nums">{num.format(departments.length)}</span>
      </h3>
      <ul className="grid grid-cols-2 gap-2 @[34rem]/files:grid-cols-3 @[52rem]/files:grid-cols-4">
        {shown.map((d) => (
          <li key={d.id} className="min-w-0">
            <button
              type="button"
              onClick={() => setPeopleFilter({ kind: "dept", id: d.id, label: d.name })}
              className={cn(
                "ms-surface flex h-full min-h-16 w-full flex-col items-start justify-between gap-1 rounded-2xl px-3.5 py-3 text-start transition",
                "hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 motion-reduce:hover:translate-y-0",
              )}
            >
              <span
                lang="tr"
                className="line-clamp-2 text-[0.8125rem] font-semibold leading-snug [overflow-wrap:anywhere]"
              >
                {d.name}
              </span>
              <span className="text-[0.71875rem] tabular-nums text-muted-foreground">
                {t(pluralKey("find.people.count", locale, d.count), { n: num.format(d.count) })}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {departments.length > DEPTS_SHOWN && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          aria-expanded={all}
          className="mt-2 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold text-brand-ink transition hover:bg-brand/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
        >
          {all ? t("find.depts.less") : t("find.depts.all", { n: num.format(departments.length) })}
        </button>
      )}
    </section>
  )
}
