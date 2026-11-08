import { useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useMsal } from "@azure/msal-react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import HierarchyIcon from "@hugeicons/core-free-icons/HierarchyIcon"
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon"
import SquareLock02Icon from "@hugeicons/core-free-icons/SquareLock02Icon"
import { useLocale } from "@/hooks/useLocale"
import { useOrgChart } from "@/features/feed/hooks/useOrgChart"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { requestGraphScopes, STATUS } from "@/lib/graph"
import { getNumberFormat, pluralKey } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import { RowsSkeleton, StateRow } from "../files/FilesStates"
import { ResultsHeader } from "../files/FilesViews"
import { OrgFocus, OrgNode } from "./OrgNode"
import { useOrgNav } from "./useOrgNav"
import { usePresenceBatch } from "./usePresenceBatch"

/**
 * Bul › Kişiler › Organizasyon (`forg=<kimlik>`): seçili kişinin yönetici zinciri en üstten
 * kişiye, kişinin kartı ve bağlıları; "Aynı yöneticiye bağlı" açılınca ekip arkadaşları. Bir
 * düğüme basmak ağacı o kişiye taşır (geçmişe yazılır, geri tuşu bir önceki kişiye döner).
 */
export function OrgView({ id, titleRef }) {
  const { t, locale } = useLocale()
  const num = getNumberFormat(locale)
  const [params, setParams] = useSearchParams()
  const { chain, reports, retry } = useOrgChart(id)
  const focus = useOrgNav()
  const close = () => {
    const p = new URLSearchParams(params)
    p.delete("forg")
    setParams(p)
  }

  if (!chain) return <RowsSkeleton rows={5} />
  if (chain.status !== STATUS.ready) return <OrgStatus res={chain} onRetry={retry} />
  const { person, chain: above } = chain
  const team = reports?.status === STATUS.ready ? reports.people : []
  const manager = above[above.length - 1] ?? null

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <ResultsHeader
        title={t("find.org.title")}
        summary={
          reports?.status !== STATUS.ready
            ? person.name
            : team.length
              ? t(pluralKey("find.org.summary", locale, team.length), {
                  name: person.name,
                  n: num.format(team.length),
                })
              : t("find.org.summaryNone", { name: person.name })
        }
        titleRef={titleRef}
        sortMenu={
          <button
            type="button"
            onClick={close}
            aria-label={t("find.org.close")}
            title={t("find.org.close")}
            className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:size-11"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              className="size-4"
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        }
      />
      <Tree above={above} person={person} onFocus={focus} />
      <Reports res={reports} people={team} onFocus={focus} />
      {manager && <Peers managerId={manager.id} self={person.id} onFocus={focus} />}
    </div>
  )
}

/** Zincir: üstte en üst yönetici, aşağı doğru kişiye; düğümleri ince bir çizgi bağlar. */
function Tree({ above, person, onFocus }) {
  const { t } = useLocale()
  const photos = usePeoplePhotos([...above, person].map((p) => p.address))
  const presence = usePresenceBatch([person])
  return (
    <ol
      aria-label={t("find.org.chain")}
      className="ms-surface flex min-w-0 flex-col rounded-[1.5rem] p-1.5"
    >
      {above.map((m) => (
        <OrgNode key={m.id} person={m} photo={photos.get(m.address)} onFocus={onFocus} line />
      ))}
      <OrgFocus
        person={person}
        photo={photos.get(person.address)}
        presence={presence.get(person.id)}
      />
    </ol>
  )
}

function Reports({ res, people, onFocus }) {
  const { t, locale } = useLocale()
  const num = getNumberFormat(locale)
  const photos = usePeoplePhotos(people.slice(0, 40).map((p) => p.address))
  if (!res) return <RowsSkeleton rows={3} />
  if (res.status !== STATUS.ready || !people.length) return null
  return (
    <section aria-labelledby="org-reports-title" className="min-w-0">
      <h3
        id="org-reports-title"
        lang={locale}
        className="flex items-center gap-2 px-3 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
      >
        <span>{t("find.org.reports")}</span>
        <span className="font-medium tabular-nums">{num.format(people.length)}</span>
      </h3>
      <ul className="ms-surface grid min-w-0 gap-0.5 rounded-[1.5rem] p-1.5 @[44rem]/files:grid-cols-2">
        {people.map((p) => (
          <OrgNode key={p.id} person={p} photo={photos.get(p.address)} onFocus={onFocus} />
        ))}
      </ul>
    </section>
  )
}

/** Aynı yöneticiye bağlı olanlar — kapalı başlar, açılınca sorulur. */
function Peers({ managerId, self, onFocus }) {
  const { t, locale } = useLocale()
  const num = getNumberFormat(locale)
  const [open, setOpen] = useState(false)
  const { reports } = useOrgChart(open ? managerId : null, { withChain: false })
  const people = reports?.status === STATUS.ready ? reports.people.filter((p) => p.id !== self) : []
  const photos = usePeoplePhotos(open ? people.slice(0, 40).map((p) => p.address) : [])
  return (
    <section className="min-w-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold text-brand-ink transition hover:bg-brand/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
      >
        <HugeiconsIcon
          icon={HierarchyIcon}
          className="size-3.5"
          strokeWidth={1.9}
          aria-hidden="true"
        />
        {!open || reports?.status !== STATUS.ready
          ? t("find.org.peers")
          : people.length
            ? t(pluralKey("find.org.peersCount", locale, people.length), {
                n: num.format(people.length),
              })
            : t("find.org.peersNone")}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          className={cn("size-3.5 transition", open && "rotate-180")}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>
      {open &&
        (!reports ? (
          <div className="mt-2">
            <RowsSkeleton rows={3} />
          </div>
        ) : (
          people.length > 0 && (
            <ul className="ms-surface mt-2 grid min-w-0 gap-0.5 rounded-[1.5rem] p-1.5 @[44rem]/files:grid-cols-2">
              {people.map((p) => (
                <OrgNode key={p.id} person={p} photo={photos.get(p.address)} onFocus={onFocus} />
              ))}
            </ul>
          )
        ))}
    </section>
  )
}

/** Zincir okunamadı: izin yoksa "Bağlan" (belirteç yenilenir), öbür hâllerde "Tekrar dene". */
function OrgStatus({ res, onRetry }) {
  const { t } = useLocale()
  const { instance, accounts } = useMsal()
  if (res.status === STATUS.unauthenticated) return <StateRow title={t("files.signedOut")} />
  if (res.status === STATUS.denied)
    return (
      <StateRow
        icon={SquareLock02Icon}
        tone="warn"
        title={t("find.org.denied")}
        body={t("find.people.deniedBody")}
        cause={res.detail}
        action={t("files.connect")}
        actionTone="connect"
        onAction={async () => {
          if (!accounts[0]) return
          await requestGraphScopes(instance, accounts[0], ["User.Read.All"])
          onRetry()
        }}
      />
    )
  return (
    <StateRow
      tone="warn"
      title={res.httpStatus === 404 ? t("person.notFound") : t("find.org.error")}
      body={res.httpStatus === 404 ? null : t("files.errorBody")}
      cause={res.detail}
      action={res.httpStatus === 404 ? null : t("files.retry")}
      actionIcon={RefreshIcon}
      onAction={onRetry}
    />
  )
}
