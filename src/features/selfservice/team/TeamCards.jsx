import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useLocale } from "@/hooks/useLocale"
import { shortNames } from "@/lib/calendar/people"
import { yearEndLeave } from "@/features/selfservice/lib/yearEndLeave"
import { cn } from "@/lib/utils"
import { Emph } from "../cards/Emph"
import { StoryShell } from "../cards/StoryCard"
import { countText, number } from "../kinds"
import { peopleText, shortRange } from "./teamText"
import "../cards/cards.css"
import "./teamCards.css"

const RANKED = 4
const FACES = 5

/** Bugün izinde olanların yüzleri (üst üste binen küçük fotoğraflar; adlar ipucunda ve okuyucuda). */
function Faces({ rows, photos }) {
  if (!rows.length) return null
  const more = rows.length - FACES
  return (
    <span className="ssc-faces">
      {/* Anahtar satırın kimliği: iki kişi aynı adresi taşıyabilir (eşleşmeyen kayıt). */}
      {rows.slice(0, FACES).map(({ key, person }) => (
        <span key={key} title={person.name}>
          <PersonAvatar
            name={person.name ?? ""}
            photo={photos?.get(person.address)}
            className="ssc-face rounded-full"
          />
        </span>
      ))}
      {more > 0 && <span className="ssc-face-more">+{more}</span>}
    </span>
  )
}

/** Gösterge kartı: ad ve değer üstte (kartlar arasında aynı hizada), ayrıntısı kartın dibinde. */
function Stat({ label, value, caption, loading, children }) {
  return (
    <li className="ssc-card ssc-stat">
      <span className="ssc-eyebrow">{label}</span>
      {loading ? (
        <span aria-hidden="true" className="ms-skeleton ssc-skel-value" />
      ) : (
        <span data-private="" className="ssc-stat-value">
          {value}
        </span>
      )}
      {!loading && (children || caption) && (
        <span className="ssc-stat-foot">
          {children}
          {caption && (
            <span
              data-private=""
              title={caption}
              className={cn("ssc-kpi-note truncate", children && "sr-only")}
            >
              {caption}
            </span>
          )}
        </span>
      )}
    </li>
  )
}

/**
 * Yıl sonuna kalan yıllık izin (Kasım–Aralık, yalnız bana bağlılar): çoktan aza çubuklu sıralama,
 * en çok dört kişi + "+N kişi". Standart düzendeki `YearEndLeave` satırının kart hâli; kalan
 * yoksa hiç çizilmez (ekibin gövdesi o zaman tam ende kalır).
 */
export function TeamRank({ rows, status }) {
  const { t, locale } = useLocale()
  const left = status.balance === "ready" ? yearEndLeave(rows) : []
  if (!left.length) return null
  return (
    <section aria-labelledby="ssc-year-end" className="ssc-card ssc-rank-card">
      <h3 id="ssc-year-end" className="ssc-eyebrow">
        {t("selfService.team.yearEnd.title")}
      </h3>
      <div data-private="" className="ssc-rank">
        {left.slice(0, RANKED).map((x) => (
          <span key={x.key}>
            <span lang="tr" title={x.name}>
              {x.name}
            </span>
            <span aria-hidden="true" className="ssc-bar-track">
              <i className="ssc-bar-fill" style={{ "--share": x.remain / left[0].remain }} />
            </span>
            <b>{countText(t, locale, "selfService.days", Math.round(x.remain * 10) / 10)}</b>
          </span>
        ))}
      </div>
      {left.length > RANKED && (
        <p className="ssc-kpi-note">
          {t("selfService.team.yearEnd.more", { n: left.length - RANKED })}
        </p>
      )}
    </section>
  )
}

/**
 * Ekibim'in Kartlar düzenindeki üst sırası: solda TYRO özeti (bugün ve bu hafta izinde olanlar,
 * Kasım–Aralık'ta yıl sonuna izni kalanlar), sağında üç gösterge kartı (standart `TeamSummary` ile
 * aynı sayılar; "Bugün izinde"de kişilerin yüzleri). İzin bilgisi yoksa (yetki, hata) sayılar "—";
 * nedenini `TeamNotice` söyler. Sıralama ayrı kartta (`TeamRank`).
 */
export function TeamCards({ summary, rows, status, photos, className }) {
  const { t, locale } = useLocale()
  const loading = status.leaves === "loading"
  const known = status.leaves === "ready"
  const people = (n) => (known ? peopleText(n, t, locale) : "—")
  const short = shortNames(rows.map((r) => r.person))
  const byKey = new Map(rows.map((r) => [r.key, r]))
  const awayRows = summary.todayKeys.map((k) => byKey.get(k)).filter(Boolean)
  const away = awayRows
    .map((r) => short.get(String(r.person.address).toLowerCase()))
    .filter(Boolean)
  // ERP'de eşleşmeyen üye varken "izinde olan yok" denmez: onun izni bilinmiyor.
  const allKnown = rows.every((r) => r.matched)
  const week = known ? shortRange(summary.week.from, summary.week.to, locale) : ""
  const avg = summary.avgRemain
  const left = status.balance === "ready" ? yearEndLeave(rows) : []

  const lines = []
  if (!known) lines.push(t("selfService.teamStory.unknown"))
  else {
    if (summary.today)
      lines.push(
        away.length
          ? t("selfService.teamStory.today", {
              people: people(summary.today),
              names: away.join(", "),
            })
          : t("selfService.teamStory.todayCount", { people: people(summary.today) }),
      )
    else if (allKnown) lines.push(t("selfService.teamStory.todayNone"))
    if (summary.thisWeek)
      lines.push(t("selfService.teamStory.week", { people: people(summary.thisWeek), range: week }))
    if (left.length)
      lines.push(
        t("selfService.teamStory.yearEnd", {
          people: peopleText(left.length, t, locale),
          name: left[0].name,
          days: countText(t, locale, "selfService.days", Math.round(left[0].remain * 10) / 10),
        }),
      )
    // Buraya yalnız eşleşmeyen üye varken ve görünen izin yokken düşülür.
    if (!lines.length) lines.push(t("selfService.teamStory.partial"))
  }

  return (
    <div className={cn("ssc-team", className)}>
      <StoryShell eyebrow={t("selfService.teamStory.title")} loading={loading}>
        {lines.map((line, i) => (
          <span key={i}>
            {i > 0 && " "}
            <Emph text={line} />
          </span>
        ))}
      </StoryShell>
      <ul aria-label={t("selfService.team.summary.label")} className="ssc-stats">
        <Stat
          label={t("selfService.team.summary.today")}
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
        >
          {known && awayRows.length > 0 && <Faces rows={awayRows} photos={photos} />}
        </Stat>
        <Stat
          label={t("selfService.team.summary.week")}
          value={people(summary.thisWeek)}
          caption={week}
          loading={loading}
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
        />
      </ul>
    </div>
  )
}
