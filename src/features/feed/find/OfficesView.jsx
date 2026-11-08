import { useDeferredValue, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { OFFICES } from "@/data/offices"
import { useCompanyDirectory } from "@/hooks/useCompanyDirectory"
import { useLocale } from "@/hooks/useLocale"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { setPeopleFilter, withScope } from "@/lib/findScope"
import { browserTimeZone, STATUS } from "@/lib/graph"
import { getNumberFormat, pluralKey } from "@/lib/intl-cache"
import { isDomestic, officeCountry, peopleByOffice, searchOffices } from "@/lib/offices"
import { cn } from "@/lib/utils"
import { EmptyCard } from "../files/FilesStates"
import { ResultsHeader } from "../files/FilesViews"
import { OfficeCard } from "./OfficeCard"

const REGIONS = ["all", "tr", "abroad"]
const inRegion = (region) => (o) =>
  region === "all" || (region === "tr" ? isDomestic(o) : !isDomestic(o))

/**
 * Bul › Ofisler — şirketin ofisleri, tesisleri ve limanları (`data/offices.js`). Bölge seçimi
 * (Türkiye · Yurt dışı) ve arama (ad, şehir, ülke her dilde, tür, adres). Rehber hazırsa her
 * kartta o ofiste görünen kişilerin sayısı; basınca Kişiler o ofisle filtrelenir.
 */
export function OfficesView({ text, now, titleRef }) {
  const { t, locale } = useLocale()
  const num = getNumberFormat(locale)
  const [params, setParams] = useSearchParams()
  const [region, setRegion] = useState("all")
  const q = useDeferredValue(text.trim())
  const dir = useCompanyDirectory()
  const homeTz = useMemo(() => browserTimeZone(), [])

  const list = useMemo(() => {
    const base = q
      ? searchOffices(q, { locale, kindLabel: (k) => t(`find.office.kind.${k}`) })
      : OFFICES
    return base.filter(inRegion(region))
  }, [q, region, locale, t])
  const byOffice = useMemo(
    () => (dir.status === STATUS.ready ? peopleByOffice(dir.people) : new Map()),
    [dir.status, dir.people],
  )
  // Kartların avatar yığını: ofis başına ilk üç kişi.
  const faces = useMemo(
    () => list.flatMap((o) => (byOffice.get(o.id) ?? []).slice(0, 3).map((p) => p.address)),
    [list, byOffice],
  )
  const photos = usePeoplePhotos(faces)

  const showPeople = (office) => {
    setPeopleFilter({ kind: "office", id: office.id, label: office.name })
    setParams(withScope(params, "people"), { replace: false })
  }
  const countries = new Set(list.map(officeCountry)).size
  const groups =
    q || region !== "all"
      ? [{ id: "list", items: list }]
      : [
          { id: "tr", items: list.filter(isDomestic) },
          { id: "abroad", items: list.filter((o) => !isDomestic(o)) },
        ]

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ResultsHeader
        title={q ? t("find.offices.results") : t("find.offices.title")}
        summary={`${t(pluralKey("find.offices.count", locale, list.length), { n: num.format(list.length) })} · ${t(pluralKey("find.offices.countries", locale, countries), { n: num.format(countries) })}`}
        titleRef={titleRef}
        sortMenu={<RegionPills value={region} onChange={setRegion} />}
      />
      {list.length === 0 ? (
        <EmptyCard
          title={t("find.offices.none", { q })}
          body={region === "all" ? t("find.offices.noneHint") : t("find.offices.noneRegion")}
        />
      ) : (
        groups.map((g) =>
          g.items.length ? (
            <section
              key={g.id}
              aria-label={g.id === "list" ? undefined : t(`find.offices.region.${g.id}`)}
              className="min-w-0"
            >
              {g.id !== "list" && (
                <h3
                  lang={locale}
                  className="flex items-center gap-2 px-3 pb-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-muted-foreground"
                >
                  <span>{t(`find.offices.region.${g.id}`)}</span>
                  <span className="font-medium tabular-nums">{num.format(g.items.length)}</span>
                </h3>
              )}
              <ul className="grid gap-3 @[44rem]/files:grid-cols-2">
                {g.items.map((o) => (
                  <OfficeCard
                    key={o.id}
                    office={o}
                    now={now}
                    homeTz={homeTz}
                    query={q}
                    people={byOffice.get(o.id)}
                    photos={photos}
                    onPeople={showPeople}
                  />
                ))}
              </ul>
            </section>
          ) : null,
        )
      )}
      <p className="px-1 text-[0.6875rem] text-muted-foreground">{t("find.offices.source")}</p>
    </div>
  )
}

/** Bölge seçimi: Tümü · Türkiye · Yurt dışı (hap; kapsam şeridinden ayrı giysi). */
function RegionPills({ value, onChange }) {
  const { t } = useLocale()
  return (
    <div role="radiogroup" aria-label={t("find.offices.regionAria")} className="flex gap-1">
      {REGIONS.map((r) => (
        <button
          key={r}
          type="button"
          role="radio"
          aria-checked={value === r}
          onClick={() => onChange(r)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-[0.75rem] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-11",
            value === r
              ? "border-brand/30 bg-brand/[0.09] font-semibold text-foreground"
              : "border-border bg-card text-foreground/75 hover:text-foreground",
          )}
        >
          {t(`find.offices.region.${r}`)}
        </button>
      ))}
    </div>
  )
}
