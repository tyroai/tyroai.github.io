import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { PersonPopover } from "@/components/common/PersonPopover"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { day, number } from "../kinds"
import { FROST_BASE, SOFT_INK } from "./heroStyles"
import { tenureText } from "./profileText"

// Hücre: değer üstte, etiketi altında; ortalı, eşit en. Dokunulan hücre kendisi tepki verir.
// Tek satır değer + tek satır etiket, 48 px: kart To-Do'nunkiyle aynı boyda (dokunma hedefi ≥ 44).
const CELL =
  "flex min-h-12 min-w-0 flex-col items-center justify-center gap-0.5 px-2 py-1.5 text-center"
const TAP =
  "transition hover:bg-white/10 active:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70 group-data-[ink=dark]/herocard:hover:bg-white/30"
const VALUE = "flex max-w-full items-center gap-1 text-[0.9375rem] font-semibold leading-tight"
const CAPTION = cn("max-w-full truncate text-[0.75rem] font-medium leading-tight", SOFT_INK)

// Dar hücrede yalnız ad ("Ayşe", "Mehmet Ali"): soyadı kişi kartında; tek kelimeyse kendisi.
const givenName = (name) => {
  const words = String(name ?? "")
    .trim()
    .split(/\s+/)
  return words.length > 1 ? words.slice(0, -1).join(" ") : words[0]
}

/**
 * DAR KARTIN KİŞİ ŞERİDİ (telefon, tablet, dar pencere) — hizmet süresi · bağlı olunan kişi ·
 * Ekibim, tek cam çubukta eşit hücreler (profil uygulamalarının istatistik şeridi): ayrı haplar
 * telefonda iki satıra düzensiz
 * kırılıyordu. Her hücrede değer ve altında kısa etiket; bağlı olunan kişinin yalnız adı (tam adı
 * kişi kartında ve düğmenin adında). Bağlı olunan kişi kişi kartını açar,
 * Ekibim ekibe geçer (ekip görünümünde "Bilgilerim"e döner); hizmet süresi yalnız bilgi.
 * Bilinmeyen bilgi çizilmez, beklenirken hücrenin yeri tutulur; hücre sayısı kadar sütun.
 */
export function HeroStatsBar({ profile, team }) {
  const { t, locale } = useLocale()
  const pending = profile?.pending ?? {}
  const tenure = profile?.hireDate ? tenureText(profile.hireDate, t, locale) : null
  const manager = profile?.manager ?? null
  const skeleton = (key) => (
    <div key={key} aria-hidden="true" className={CELL}>
      <span className="block h-3.5 w-14 rounded-full bg-white/25" />
      <span className="mt-1 block h-2.5 w-10 rounded-full bg-white/20" />
    </div>
  )

  const cells = []
  if (tenure) {
    cells.push(
      <div
        key="tenure"
        className={CELL}
        title={t("selfService.profile.hired", { date: day(profile.hireDate, locale) })}
      >
        <span className={VALUE}>{tenure}</span>
        <span className={CAPTION}>{t("selfService.profile.tenure")}</span>
      </div>,
    )
  } else if (pending.hireDate) cells.push(skeleton("tenure"))

  if (manager) {
    cells.push(
      <PersonPopover
        key="manager"
        person={{ name: manager.name, address: manager.address, title: manager.title }}
        align="center"
      >
        {(trigger) => (
          <button
            {...trigger}
            aria-label={t("selfService.profile.openCard", { name: manager.name })}
            className={cn(CELL, TAP)}
          >
            <span lang="tr" className={VALUE}>
              <span className="truncate">{givenName(manager.name)}</span>
            </span>
            <span className={CAPTION}>{t("selfService.profile.managerShort")}</span>
          </button>
        )}
      </PersonPopover>,
    )
  } else if (pending.manager) cells.push(skeleton("manager"))

  if (team) {
    cells.push(
      <button
        key="team"
        type="button"
        onClick={team.onToggle}
        data-tour="ss-team"
        className={cn(CELL, TAP)}
      >
        <span className={VALUE}>
          {team.active ? (
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              aria-hidden="true"
              className="size-4 rtl:rotate-180"
              strokeWidth={2.2}
            />
          ) : (
            <span className="tabular-nums">
              {team.count != null ? number(team.count, locale) : "—"}
            </span>
          )}
          {!team.active && (
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              aria-hidden="true"
              className="size-3.5 opacity-80 rtl:rotate-180"
              strokeWidth={2.2}
            />
          )}
        </span>
        <span className={CAPTION}>
          {/* Kısa ad: dar hücrede kesilmesin (Rusçada "Моя команда" sığmıyordu). */}
          {t(team.active ? "selfService.view.me" : "selfService.view.teamShort")}
        </span>
      </button>,
    )
  }

  if (!cells.length) return null
  return (
    <div
      className={cn(
        "grid overflow-hidden rounded-2xl divide-x divide-white/25 group-data-[ink=dark]/herocard:divide-black/10",
        FROST_BASE,
      )}
      style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
    >
      {cells}
    </div>
  )
}
