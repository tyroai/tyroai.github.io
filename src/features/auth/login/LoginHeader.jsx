import { motion } from "motion/react"
import { BrandText } from "@/components/brand/BrandText"
import { TyroLogo } from "@/components/brand/TyroLogo"
import { useLocale } from "@/hooks/useLocale"
import { HeaderDivider, LoginLanguageMenu, LoginNavLinks } from "../LoginControls"
import { reveal } from "./loginMotion"

/**
 * Üst şerit — solda marka bloğu (önceki girişin sol üstüyle aynı: büyük işaret, yanında "tyro",
 * altında "KURUMSAL AI PLATFORMU"; telefonda alt satır yok), sağda kümeler; açılışta yazılarla
 * birlikte süzülür, Bağlan'da söner. Sağ küme tanıtım sayfalarıyla aynı bileşenler (Hakkımızda ·
 * Ekibimiz | dil), ölçüsü bu sayfaya uyarlı (`login.css` › `.login-nav`). Tema ve ses yok: sayfa
 * hep beyaz, karşılama sesi yok.
 */
export function LoginHeader({ reduce, leaving, at }) {
  const { t } = useLocale()
  return (
    <motion.header className="login-head" {...reveal(reduce, at, leaving)}>
      <div className="login-brand-row">
        <TyroLogo size={42} className="login-logo" aria-hidden="true" />
        <div className="login-brand-text">
          <BrandText className="login-wordmark" />
          <span className="login-subbrand">{t("login.subBrand")}</span>
        </div>
      </div>
      <nav className="login-nav">
        <LoginNavLinks isDark={false} />
        <HeaderDivider isDark={false} />
        <LoginLanguageMenu isDark={false} />
      </nav>
    </motion.header>
  )
}
