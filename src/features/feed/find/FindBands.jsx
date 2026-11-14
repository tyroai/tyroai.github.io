import { useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import MapsLocation01Icon from "@hugeicons/core-free-icons/MapsLocation01Icon"
import { useCompanyDirectory } from "@/hooks/useCompanyDirectory"
import { useLocale } from "@/hooks/useLocale"
import { withScope } from "@/lib/findScope"
import { STATUS } from "@/lib/graph"
import { getNumberFormat } from "@/lib/intl-cache"
import { mapsUrl, searchOffices } from "@/lib/offices"
import { searchPeople } from "@/lib/peopleIndex"
import { FileGroup, Highlighted } from "../files/FileRow"
import { KIND_ICON } from "./officeIcons"
import { PeopleList } from "./PeopleList"

const PEOPLE_SHOWN = 4
const OFFICES_SHOWN = 3

/**
 * "Tümü"de arama dosyalardan önce KİŞİLER ve OFİSLER bandıyla başlar: ilk birkaç eşleşme ve
 * "Tümünü gör" (aynı aramayla o kapsam). Rehber bellekte, eşleşme anında; eşleşme yoksa bant
 * hiç çizilmez (dosya sonuçları yerinde kalır).
 */
export function FindBands({ text }) {
  const { t, locale } = useLocale()
  const num = getNumberFormat(locale)
  const [params, setParams] = useSearchParams()
  const dir = useCompanyDirectory()
  const q = text.trim()
  const people = useMemo(
    () => (dir.status === STATUS.ready && q ? searchPeople(dir.index, q) : []),
    [dir.status, dir.index, q],
  )
  const offices = useMemo(
    () => (q ? searchOffices(q, { locale, kindLabel: (k) => t(`find.office.kind.${k}`) }) : []),
    [q, locale, t],
  )
  if (!people.length && !offices.length) return null
  const go = (scope) => setParams(withScope(params, scope), { replace: true })

  return (
    <div className="mb-6 flex min-w-0 flex-col gap-6 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200">
      {people.length > 0 && (
        <section aria-label={t("find.people.title")} className="min-w-0">
          <PeopleList
            label={t("find.people.title")}
            count={num.format(people.length)}
            rows={people.slice(0, PEOPLE_SHOWN)}
            query={q}
          />
          {people.length > PEOPLE_SHOWN && (
            <AllButton onClick={() => go("people")}>
              {t("find.people.all", { n: num.format(people.length) })}
            </AllButton>
          )}
        </section>
      )}
      {offices.length > 0 && (
        <section aria-label={t("find.offices.title")} className="min-w-0">
          <FileGroup label={t("find.offices.title")} count={num.format(offices.length)}>
            {offices.slice(0, OFFICES_SHOWN).map((o) => (
              <OfficeRow key={o.id} office={o} query={q} onOpen={() => go("offices")} />
            ))}
          </FileGroup>
          {offices.length > OFFICES_SHOWN && (
            <AllButton onClick={() => go("offices")}>
              {t("find.offices.all", { n: num.format(offices.length) })}
            </AllButton>
          )}
        </section>
      )}
    </div>
  )
}

function AllButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[0.75rem] font-semibold text-brand-ink transition hover:bg-brand/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
    >
      {children}
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        aria-hidden="true"
        className="size-3.5"
        strokeWidth={2}
      />
    </button>
  )
}

/** Ofisin tek satırı: tür · ad · adres; basınca Ofisler (aynı arama), sağda haritada aç. */
function OfficeRow({ office, query, onOpen }) {
  const { t, locale } = useLocale()
  return (
    <li className="flex min-w-0 items-center gap-1 rounded-2xl transition hover:bg-accent/45">
      <button
        type="button"
        onClick={onOpen}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-2.5 py-2 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-14"
      >
        <span
          aria-hidden="true"
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/[0.1] text-brand-ink"
        >
          <HugeiconsIcon
            icon={KIND_ICON[office.kind]}
            className="size-[1.125rem]"
            strokeWidth={1.8}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-1.5">
            <span lang="tr" className="truncate text-[0.875rem] font-semibold leading-snug">
              <Highlighted text={office.name} query={query} />
            </span>
            <span
              lang={locale}
              className="shrink-0 rounded-full bg-muted px-1.5 py-px text-[0.6875rem] font-semibold text-foreground/75"
            >
              {t(`find.office.kind.${office.kind}`)}
            </span>
          </span>
          <span
            lang="tr"
            className="block truncate text-[0.75rem] leading-snug text-muted-foreground [&_mark]:text-foreground"
          >
            <Highlighted text={office.address} query={query} />
          </span>
        </span>
      </button>
      <a
        href={mapsUrl(office)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`${t("find.office.map")} — ${office.name}`}
        title={t("find.office.map")}
        className="me-1.5 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-brand/[0.09] hover:text-brand-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:size-11"
      >
        <HugeiconsIcon
          icon={MapsLocation01Icon}
          className="size-4"
          strokeWidth={1.9}
          aria-hidden="true"
        />
      </a>
    </li>
  )
}
