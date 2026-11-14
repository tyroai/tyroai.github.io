import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import MapsLocation01Icon from "@hugeicons/core-free-icons/MapsLocation01Icon"
import Navigation03Icon from "@hugeicons/core-free-icons/Navigation03Icon"
import TelephoneIcon from "@hugeicons/core-free-icons/TelephoneIcon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { getNumberFormat, pluralKey } from "@/lib/intl-cache"
import { personTone } from "@/lib/personTone"
import {
  countryName,
  directionsUrl,
  mapsUrl,
  officeCityName,
  officeClock,
  officeCountry,
  telHref,
} from "@/lib/offices"
import { offsetLabel } from "@/lib/worldClock"
import { cn } from "@/lib/utils"
import { Highlighted } from "../files/FileRow"
import { KIND_ICON } from "./officeIcons"

const PILL =
  "inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[0.75rem] font-semibold text-foreground/85 transition hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-11"

/**
 * Bir ofisin kartı: tür, şehir · ülke, yerel saat (kullanıcınınkinden farklıysa), adres
 * (kopyalanır), telefon; Haritada aç · Yol tarifi; rehberde bu ofiste görünen kişiler varsa
 * sayısı — basınca Kişiler o ofisle filtrelenir.
 */
export function OfficeCard({ office, now, homeTz, query, people, photos, onPeople }) {
  const { t, locale } = useLocale()
  const num = getNumberFormat(locale)
  const clock = officeClock(office, now, locale, homeTz)
  const city = officeCityName(office, locale)
  const country = countryName(officeCountry(office), locale)
  // Şehir ve ülke dilin virgülüyle (Arapçada "،"); aynıysa (Dubai) bir kez.
  const where =
    city && country && city !== country
      ? t("find.office.where", { city, country })
      : city || country
  const kind = t(`find.office.kind.${office.kind}`)
  return (
    <li className="ms-surface flex min-w-0 flex-col gap-3 rounded-[1.5rem] p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span
          aria-hidden="true"
          className={cn(
            "grid size-11 shrink-0 place-items-center rounded-xl",
            office.kind === "hq"
              ? "bg-brand-fill-deep text-brand-on-brand"
              : "bg-brand/[0.1] text-brand-ink",
          )}
        >
          <HugeiconsIcon icon={KIND_ICON[office.kind]} className="size-5" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
            <h3
              lang="tr"
              className="text-[0.9375rem] font-semibold leading-snug tracking-[-0.01em]"
            >
              <Highlighted text={office.name} query={query} />
            </h3>
            <span
              lang={locale}
              className="rounded-full bg-muted px-2 py-px text-[0.6875rem] font-semibold text-foreground/75"
            >
              {kind}
            </span>
          </div>
          <p className="mt-0.5 text-[0.75rem] leading-snug text-muted-foreground">
            <span lang={locale} dir="auto">
              {where}
            </span>
            {office.company && office.company !== office.name && (
              <span lang="tr"> · {office.company}</span>
            )}
          </p>
          {clock.diff !== 0 && (
            <p className="mt-1 flex items-center gap-1 text-[0.75rem] font-medium tabular-nums text-foreground/75">
              <HugeiconsIcon
                icon={Clock01Icon}
                className="size-3 text-muted-foreground"
                strokeWidth={2}
                aria-hidden="true"
              />
              {t("find.office.localTime", { time: clock.time })}
              <span className="text-muted-foreground">({offsetLabel(clock.diff)})</span>
            </p>
          )}
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-0.5 text-[0.8125rem]">
        <Address value={office.address} query={query} />
        {office.phone && (
          <a
            href={telHref(office.phone)}
            className="flex w-fit items-center gap-2 rounded-lg px-1 py-1 tabular-nums text-foreground/85 transition hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:min-h-11"
          >
            <HugeiconsIcon
              icon={TelephoneIcon}
              className="size-3.5 text-muted-foreground"
              strokeWidth={1.9}
              aria-hidden="true"
            />
            {office.phone}
          </a>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-1.5">
        <a href={mapsUrl(office)} target="_blank" rel="noopener noreferrer" className={PILL}>
          <HugeiconsIcon
            icon={MapsLocation01Icon}
            className="size-3.5 text-brand"
            strokeWidth={1.9}
            aria-hidden="true"
          />
          {t("find.office.map")}
        </a>
        <a href={directionsUrl(office)} target="_blank" rel="noopener noreferrer" className={PILL}>
          <HugeiconsIcon
            icon={Navigation03Icon}
            className="size-3.5 text-brand"
            strokeWidth={1.9}
            aria-hidden="true"
          />
          {t("find.office.directions")}
        </a>
        {people?.length > 0 && (
          <button
            type="button"
            onClick={() => onPeople(office)}
            className={cn(PILL, "@[34rem]/files:ms-auto")}
            aria-label={t(pluralKey("find.office.peopleAria", locale, people.length), {
              n: num.format(people.length),
              name: office.name,
            })}
          >
            {/* Yüz yığını harfsiz: foto yoksa kişinin rengi — düğmenin adı görünen yazıyla aynı kalsın. */}
            <span aria-hidden="true" className="flex -space-x-1.5">
              {people
                .slice(0, 3)
                .map((p) =>
                  photos?.get(p.address) ? (
                    <img
                      key={p.id}
                      src={photos.get(p.address)}
                      alt=""
                      className="size-5 rounded-full object-cover ring-2 ring-card"
                    />
                  ) : (
                    <span
                      key={p.id}
                      className="size-5 rounded-full ring-2 ring-card"
                      style={personTone(p.name)}
                    />
                  ),
                )}
            </span>
            {t(pluralKey("find.people.count", locale, people.length), {
              n: num.format(people.length),
            })}
          </button>
        )}
      </div>
    </li>
  )
}

/** Adres seçilebilir metin; sağdaki düğme kopyalar. */
function Address({ value, query }) {
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Pano kapalı: adres seçilebilir metin.
    }
  }
  const label = copied ? t("person.copied") : t("find.office.copy")
  return (
    <div className="flex min-w-0 items-start gap-1">
      <address
        lang="tr"
        className="min-w-0 flex-1 select-text px-1 py-1 not-italic leading-snug text-foreground/85 [overflow-wrap:anywhere] [&_mark]:text-foreground"
      >
        <Highlighted text={value} query={query} />
      </address>
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        title={label}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [@media(pointer:coarse)]:size-11"
      >
        <HugeiconsIcon
          icon={copied ? Tick02Icon : Copy01Icon}
          className={cn("size-3.5", copied && "text-success-ink")}
          strokeWidth={2}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
