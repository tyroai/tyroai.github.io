import { useLocale } from "@/hooks/useLocale"
import { shortNames } from "@/lib/calendar/people"
import { cn } from "@/lib/utils"
import { number } from "../kinds"
import { usePhone } from "../layout/phone"
import { peopleText, shortRange } from "./teamText"

function Stat({ label, short, value, caption, loading, phone, at }) {
  return (
    <li
      className={cn(
        "flex min-w-0 items-center gap-3",
        // Telefonda kutusuz: bölücülü tek satır (bölücü ikinci ve üçüncünün başında).
        phone
          ? cn("px-3", at ? "border-s border-border/70" : "ps-0", at === 2 && "pe-0")
          : cn(
              // Sade stat (Bilgilerim'in özetiyle aynı): ikon kutusu yok, ince dikey ayraç.
              "relative px-3 py-3.5 @[44rem]/ss:px-6 @[44rem]/ss:py-5",
              at > 0 &&
                "before:absolute before:inset-y-4 before:start-0 before:w-px before:bg-border @[44rem]/ss:before:inset-y-5",
            ),
      )}
    >
      <span className="min-w-0 flex-1">
        <span
          className={cn(
            "block truncate text-foreground/65",
            phone
              ? "text-[0.75rem] font-medium"
              : "text-[0.6875rem] font-semibold uppercase tracking-[0.08em]",
          )}
        >
          {/* Telefonda kısa ad: üç kutu tek satırda. */}
          {phone ? (
            (short ?? label)
          ) : (
            <>
              <span className="@[44rem]/ss:hidden">{short ?? label}</span>
              <span className="hidden @[44rem]/ss:inline">{label}</span>
            </>
          )}
        </span>
        {loading ? (
          <span aria-hidden="true" className="ms-skeleton mt-1 block h-6 w-16 rounded-md" />
        ) : (
          <span
            className={cn(
              "block truncate font-semibold tabular-nums tracking-[-0.02em] text-foreground",
              phone
                ? "mt-0.5 text-[1.0625rem]"
                : "mt-1 text-[1.125rem] leading-tight @[44rem]/ss:mt-1.5 @[44rem]/ss:text-[1.75rem]",
            )}
          >
            {value}
          </span>
        )}
        {caption && !loading && !phone && (
          <span
            title={caption}
            className="mt-1.5 hidden truncate text-[0.75rem] text-foreground/65 @[44rem]/ss:block"
          >
            {caption}
          </span>
        )}
      </span>
    </li>
  )
}

/**
 * Ekip özeti (tek kart, üç kutu): bugün izinde (adlarıyla), bu hafta izinde (haftanın
 * aralığı), ekip boyu (ortalama kalan yıllık izin). İzin bilgisi yoksa (yetki, hata) ilk iki
 * kutu "—"; yüklenirken yer tutar. `status`: `{ leaves, balance }` bölüm durumları.
 */
export function TeamSummary({ summary, rows, status, className }) {
  const { t, locale } = useLocale()
  const phone = usePhone()
  const loading = status.leaves === "loading"
  const known = status.leaves === "ready"
  const people = (n) => (known ? peopleText(n, t, locale) : "—")
  // Aynı ilk adlı iki kişi ("Elif, Elif") soyad önekiyle ayrışır.
  const short = shortNames(rows.map((r) => r.person))
  const nameOf = new Map(
    rows.map((r) => [r.key, short.get(String(r.person.address).toLowerCase())]),
  )
  const away = summary.todayKeys.map((k) => nameOf.get(k)).filter(Boolean)
  // ERP'de eşleşmeyen üye varken "herkes işte" denmez: onun izni bilinmiyor.
  const allKnown = rows.every((r) => r.matched)
  const avg = summary.avgRemain
  return (
    <ul
      aria-label={t("selfService.team.summary.label")}
      className={cn(
        "grid min-w-0 grid-cols-3",
        !phone && "rounded-2xl bg-foreground/[0.028] text-foreground dark:bg-foreground/[0.05]",
        className,
      )}
    >
      <Stat
        label={t("selfService.team.summary.today")}
        short={t("selfService.team.summary.todayShort")}
        value={people(summary.today)}
        caption={
          known
            ? away.length
              ? away.join(", ")
              : allKnown
                ? t("selfService.team.summary.allIn")
                : ""
            : ""
        }
        loading={loading}
        phone={phone}
        at={0}
      />
      <Stat
        label={t("selfService.team.summary.week")}
        short={t("selfService.team.summary.weekShort")}
        value={people(summary.thisWeek)}
        caption={known ? shortRange(summary.week.from, summary.week.to, locale) : ""}
        loading={loading}
        phone={phone}
        at={1}
      />
      <Stat
        label={t("selfService.team.summary.size")}
        value={peopleText(summary.size, t, locale)}
        caption={
          status.balance === "ready" && avg != null
            ? t("selfService.team.summary.avgRemain", {
                n: number(Math.round(avg * 10) / 10, locale),
              })
            : ""
        }
        phone={phone}
        at={2}
      />
    </ul>
  )
}
