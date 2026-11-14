import { useId, useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { usePhone } from "../layout/phone"
import { OCCASION_ICON } from "./occasionIcons"
import { range } from "../kinds"
import { rowNav } from "./rowNav"
import { leaveAmount, leaveLabel, occasionLabel, shortDay, shortRange } from "./teamText"
import { SelfTag } from "./timelineRows"
import { TimelineNav } from "./TimelineNav"

const FIRST = 5

/** Satırın ikinci satırı ve sağdaki tarih: izin ya da doğum günü / iş yıl dönümü. */
function Detail({ item }) {
  const { t, locale } = useLocale()
  const o = item.occasion
  if (!o)
    return (
      <span className="block truncate text-[0.75rem] text-muted-foreground">
        {[leaveLabel(item.record, t), leaveAmount(item.record, t, locale)]
          .filter(Boolean)
          .join(" · ")}
      </span>
    )
  return (
    <span className="flex min-w-0 items-center gap-1 text-[0.75rem] text-muted-foreground">
      <HugeiconsIcon
        icon={OCCASION_ICON[o.kind]}
        aria-hidden="true"
        className="size-3.5 shrink-0 text-brand-ink"
        strokeWidth={2}
      />
      <span className="truncate">{occasionLabel(o, t, locale)}</span>
    </span>
  )
}

/**
 * Telefonun çizelgesi — "Yaklaşanlar": önümüzdeki 6 haftadaki izinler, doğum günleri ve iş yıl
 * dönümleri tarih sırasıyla, her satır bir kart ("Ayşe Yılmaz · Yıllık İzin, 5 gün · 12–16 Eki";
 * yönetici ve ekip arkadaşında türsüz "İzinde"; gün satırı simgesiyle "Doğum günü · 12 Kas"); bugün
 * sürenler "Şu an", bugünkü günler "Bugün" rozetli. Basınca kişi bölmesi. Beşten fazlası "Tümünü
 * göster" ile. `window`/`onNav`: dönem gezinmesi (‹ Bugün ›; çizelgeyle aynı dönem,
 * `timelineWindow`) — varsayılan dönemde başlıkta "6 hafta", gezinince tarih aralığı. `first`:
 * "Tümünü göster"den önce görünen satır sayısı (Kartlar düzeninin yan sütununda çizelgenin boyuna
 * göre); `onNav` yoksa gezinme düğmeleri çizilmez (dönemi çizelge yönetir).
 */
export function TeamUpcoming({
  upcoming,
  window: win,
  onNav,
  rows,
  photos,
  presence,
  onOpen,
  className,
  first = FIRST,
}) {
  const { t, locale } = useLocale()
  // Telefon düzeninde kart yok: başlık bölüm adı, satırlar ayraçlı.
  const phone = usePhone()
  const titleId = useId()
  const [all, setAll] = useState(false)
  const byKey = useMemo(() => new Map(rows.map((r) => [r.key, r])), [rows])
  const list = upcoming.filter((it) => byKey.has(it.key))
  const shown = all ? list : list.slice(0, first)
  // Varsayılan dönem (bugünden 6 hafta) değilse başlık ve boş durum tarih aralığını söyler.
  const home = !win || (win.home && win.weeks === 6)
  return (
    <section
      aria-labelledby={titleId}
      className={cn(!phone && "overflow-hidden rounded-2xl border border-border/70", className)}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-x-2 gap-y-1",
          phone ? "pb-1.5" : "px-4 pb-2 pt-2.5",
        )}
      >
        <h3
          id={titleId}
          className="flex min-w-0 items-center gap-1.5 text-[0.875rem] font-semibold"
        >
          <HugeiconsIcon
            icon={Calendar03Icon}
            aria-hidden="true"
            className="size-4 text-brand-ink"
            strokeWidth={1.9}
          />
          {t("selfService.team.upcoming.title")}
          <span
            aria-live="polite"
            className="truncate font-normal tabular-nums text-muted-foreground"
          >
            · {home ? t("selfService.team.upcoming.window") : range(win.from, win.to, locale)}
          </span>
        </h3>
        {win && onNav && <TimelineNav window={win} onNav={onNav} className="ms-auto -me-2" />}
      </div>
      {list.length ? (
        <ul
          className={cn("divide-y divide-border/60", !phone && "border-t border-border/60")}
          onKeyDown={rowNav}
        >
          {shown.map((it) => {
            const p = byKey.get(it.key).person
            const r = it.record
            const o = it.occasion
            const badge = o
              ? o.inDays === 0 && t("selfService.team.soon.today")
              : it.record?.statusKind === "pending"
                ? t("selfService.team.upcoming.pending")
                : it.current && t("selfService.team.upcoming.now")
            return (
              <li key={`${it.key}-${o ? o.kind : r.id}`}>
                <button
                  type="button"
                  data-team-row
                  onClick={() => onOpen(it.key)}
                  className={cn(
                    "flex min-h-12 w-full min-w-0 items-center gap-3 py-2 text-start transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40",
                    phone ? "-mx-2 min-h-14 w-[calc(100%+1rem)] rounded-xl px-2" : "px-4",
                  )}
                >
                  <PersonAvatar
                    name={p.name}
                    photo={photos.get(p.address)}
                    presence={presence.get(p.upn)}
                    className="size-8 [&>span:first-of-type]:text-[0.6875rem]"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span lang="tr" className="truncate text-[0.8125rem] font-semibold">
                        {p.name}
                      </span>
                      {byKey.get(it.key).relation === "self" && (
                        <SelfTag label={t("selfService.team.you")} />
                      )}
                    </span>
                    <Detail item={it} />
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-0.5">
                    {badge && (
                      <span className="rounded-full bg-brand/[0.12] px-1.5 py-px text-[0.6875rem] font-bold uppercase tracking-[0.04em] text-brand-ink">
                        {badge}
                      </span>
                    )}
                    <span className="text-[0.75rem] font-medium tabular-nums text-foreground/80">
                      {o ? shortDay(o.date, locale) : shortRange(r.start, r.end, locale)}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p
          className={cn(
            "py-4 text-[0.8125rem] text-muted-foreground",
            !phone && "border-t border-border/60 px-4",
          )}
        >
          {t(home ? "selfService.team.upcoming.empty" : "selfService.team.timeline.emptyronge")}
        </p>
      )}
      {list.length > first && (
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          aria-expanded={all}
          className={cn(
            "w-full border-t border-border/60 py-2.5 text-start text-[0.75rem] font-semibold text-brand-ink transition hover:bg-brand/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40 pointer-coarse:min-h-11",
            !phone && "px-4",
          )}
        >
          {all
            ? t("selfService.detail.showLess")
            : t("selfService.detail.showAll", { n: list.length })}
        </button>
      )}
    </section>
  )
}
