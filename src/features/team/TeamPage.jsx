import { useEffect } from "react"
import { PublicHeader } from "@/features/auth/PublicHeader"
import { PublicPageTitle } from "@/features/auth/PublicPageTitle"
import { LOGIN_GRADIENT } from "@/features/auth/loginGradient"
import { TEAM } from "@/data/team"
import { useLocale } from "@/hooks/useLocale"
import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"
import { TeamCard } from "./TeamCard"
import AiCoEditingIcon from "@hugeicons/core-free-icons/AiCoEditingIcon"

/**
 * EKİBİMİZ (`/team`) — girişin sağ üstündeki bağlantıdan açılan, oturum
 * gerektirmeyen tanıtım sayfası. Görsel dil girişinki: aynı palet (Palette
 * Provider girişteki gibi çivili), Hakkımızda ile ortak başlık, aynı gradyan.
 * ⚠️ Açılışta sessiz SSO bu adreste DENENMEZ (`lib/silentSso.js`): paylaşılan
 * bir Ekibimiz bağlantısı, oturumu açık birini Anasayfa'ya fırlatmasın.
 */
export function TeamPage() {
  const { t } = useLocale()
  const { theme } = useTheme()
  const isDark = theme === "dark"

  useEffect(() => {
    const before = document.title
    document.title = `${t("team.title")} · TYRO`
    return () => {
      document.title = before
    }
  }, [t])

  return (
    <div
      className={cn(
        "relative flex min-h-dvh flex-col overflow-x-hidden",
        isDark ? "bg-[#0b0b0f] text-white" : "bg-[#fafafa] text-[#1a1a1a]",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-48 left-1/2 h-[32rem] w-[64rem] max-w-[200vw] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ backgroundImage: LOGIN_GRADIENT }}
      />
      <PublicHeader isDark={isDark} />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-12 pt-6 sm:px-6 sm:pt-10">
        <PublicPageTitle
          icon={AiCoEditingIcon}
          title={t("team.title")}
          subtitle={t("team.subtitle")}
          isDark={isDark}
        />
        <div className="mx-auto mt-8 grid w-full max-w-3xl gap-5 lg:mt-10 lg:max-w-none lg:grid-cols-2 lg:gap-6">
          {TEAM.map((member, i) => (
            <TeamCard key={member.id} member={member} index={i} isDark={isDark} />
          ))}
        </div>
      </main>
    </div>
  )
}
