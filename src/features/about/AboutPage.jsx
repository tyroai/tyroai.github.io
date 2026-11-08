import { useEffect } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import AiCoEditingIcon from "@hugeicons/core-free-icons/AiCoEditingIcon"
import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import { PublicHeader } from "@/features/auth/PublicHeader"
import { PublicPageTitle } from "@/features/auth/PublicPageTitle"
import { LOGIN_GRADIENT } from "@/features/auth/loginGradient"
import { COMPANIES } from "@/data/companies"
import { useLocale } from "@/hooks/useLocale"
import { useTheme } from "@/hooks/useTheme"
import { TEAM_PATH } from "@/lib/publicPages"
import { cn } from "@/lib/utils"
import { AboutCompany } from "./AboutCompany"
import { AboutGlance } from "./AboutGlance"

const SOURCE_URL = "https://www.tyrotech.example/"

/**
 * HAKKIMIZDA (`/about`) — TYRO'nun arkasındaki iki şirket: ana şirket (TYRO Tech) ve
 * onun teknoloji iştiraki (TYRO Tech); TYRO bir AI ürünü. Girişin sağ üstünde,
 * Ekibimiz'in önünde; oturum gerektirmez, tema kişinin teması (istisna yalnız
 * Ekibimiz). Akış: başlık (Ekibimiz'le ortak) → bir bakışta yapı → iki şirket →
 * ekibe geçiş → rakamların kaynağı.
 */
export function AboutPage() {
  const { t, locale } = useLocale()
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const sub = isDark ? "text-white/65" : "text-[#1a1a1a]/65"
  // Arapça paragraf Latin bir adla ("TYRO") başlayınca `auto` LTR seçip cümleyi
  // karıştırıyordu: Arapçada yön açıkça rtl.
  const textDir = locale === "ar" ? "rtl" : "auto"

  useEffect(() => {
    const before = document.title
    document.title = `${t("about.title")} · TYRO`
    return () => {
      document.title = before
    }
  }, [t])

  return (
    <div
      className={cn(
        "relative min-h-dvh overflow-x-hidden",
        isDark ? "bg-[#0b0b0f] text-white" : "bg-[#fafafa] text-[#1a1a1a]",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 left-1/2 h-[32rem] w-[64rem] max-w-[200vw] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ backgroundImage: LOGIN_GRADIENT }}
      />
      <PublicHeader isDark={isDark} />
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-20 pt-6 sm:px-6 sm:pt-10">
        <PublicPageTitle
          icon={Building03Icon}
          title={t("about.title")}
          subtitle={t("about.lead")}
          isDark={isDark}
          dir={textDir}
        />

        <AboutGlance isDark={isDark} />

        <div className="mt-10 space-y-5 sm:mt-14 sm:space-y-6">
          {COMPANIES.map((c) => (
            <AboutCompany key={c.id} company={c} isDark={isDark} textDir={textDir} />
          ))}
        </div>

        <Link
          to={TEAM_PATH}
          className={cn(
            "group mt-10 flex items-center gap-4 rounded-[1.5rem] p-5 ring-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 sm:mt-14 sm:p-6",
            isDark
              ? "bg-white/[0.035] ring-white/10 hover:bg-white/[0.06]"
              : "bg-white/85 shadow-sm ring-black/[0.06] hover:bg-white",
          )}
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-brand-from via-brand-via to-brand-to text-brand-on-ramp">
            <HugeiconsIcon icon={AiCoEditingIcon} className="size-6" strokeWidth={1.6} />
          </span>
          <span className="min-w-0 flex-1">
            <span dir={textDir} className="block text-[1.0625rem] font-semibold">
              {t("about.teamCta.title")}
            </span>
            <span dir={textDir} className={cn("mt-0.5 block text-[0.875rem]", sub)}>
              {t("about.teamCta.desc")}
            </span>
          </span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-5 shrink-0 transition-transform group-hover:translate-x-1"
            strokeWidth={1.8}
          />
        </Link>

        <p
          className={cn(
            "mt-8 text-center text-[0.75rem]",
            isDark ? "text-white/45" : "text-[#1a1a1a]/45",
          )}
        >
          {t("about.source")}{" "}
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("about.websiteAria", { name: "www.tyrotech.example" })}
            className="underline decoration-current/40 underline-offset-2 transition hover:decoration-current"
          >
            www.tyrotech.example
          </a>
        </p>
      </main>
    </div>
  )
}
