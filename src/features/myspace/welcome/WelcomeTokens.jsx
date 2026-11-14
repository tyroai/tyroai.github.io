import { HugeiconsIcon } from "@hugeicons/react"
import { BrandOrb } from "@/components/brand/BrandOrb"
import CloudAngledRainIcon from "@hugeicons/core-free-icons/CloudAngledRainIcon"
import CloudAngledZapIcon from "@hugeicons/core-free-icons/CloudAngledZapIcon"
import CloudBigRainIcon from "@hugeicons/core-free-icons/CloudBigRainIcon"
import CloudFastWindIcon from "@hugeicons/core-free-icons/CloudFastWindIcon"
import CloudHailstoneIcon from "@hugeicons/core-free-icons/CloudHailstoneIcon"
import CloudIcon from "@hugeicons/core-free-icons/CloudIcon"
import CloudLittleRainIcon from "@hugeicons/core-free-icons/CloudLittleRainIcon"
import CloudMidRainIcon from "@hugeicons/core-free-icons/CloudMidRainIcon"
import CloudSnowIcon from "@hugeicons/core-free-icons/CloudSnowIcon"
import Moon02Icon from "@hugeicons/core-free-icons/Moon02Icon"
import MoonCloudIcon from "@hugeicons/core-free-icons/MoonCloudIcon"
import Sun01Icon from "@hugeicons/core-free-icons/Sun01Icon"
import SunCloud02Icon from "@hugeicons/core-free-icons/SunCloud02Icon"
import { splitMinor } from "./welcomeText"
import "./welcomeTokens.css"

const SKY = {
  clear: Sun01Icon,
  partly: SunCloud02Icon,
  cloudy: CloudIcon,
  fog: CloudFastWindIcon,
  lightRain: CloudLittleRainIcon,
  rain: CloudMidRainIcon,
  showers: CloudAngledRainIcon,
  heavyRain: CloudBigRainIcon,
  sleet: CloudHailstoneIcon,
  snow: CloudSnowIcon,
  thunder: CloudAngledZapIcon,
}
const NIGHT_SKY = { clear: Moon02Icon, partly: MoonCloudIcon }

/** Vurgulu kelime: beyaz (normal yazı zeminin koyu tonunda); kalınlık aynı, fark yalnız renkte. */
export function Mark({ children }) {
  return <span className="welcome-mark">{children}</span>
}

/** Vurgulu değer: tamı beyaz, kesri küçük ve koyu tonda — "9" + "°" (üstte), "15" + ".00" (tabanda). */
export function Value({ text }) {
  const [major, minor] = splitMinor(text)
  return (
    <span className="welcome-mark">
      {major}
      {minor && (
        <span className="welcome-minor" data-deg={minor === "°" ? "" : undefined}>
          {minor}
        </span>
      )}
    </span>
  )
}

/** Satırın içinde havanın simgesi: hafif ışık saçan parlak bir inci (örnekteki maskot pulu gibi). */
export function WeatherPearl({ kind, night }) {
  const icon = (night && NIGHT_SKY[kind]) || SKY[kind] || CloudIcon
  return (
    <span aria-hidden="true" className="welcome-pearl">
      <HugeiconsIcon icon={icon} strokeWidth={2} />
    </span>
  )
}

/**
 * TYRO'nun küresi öneri kartında: öneriyi kimin yaptığını gösterir. Gerçek küre (`BrandOrb`, kişinin
 * seçtiği görünüm), etkisiz kutuda; yazı kutuya sığdırılırken aynı oranda küçülür (`--welcome-scale`,
 * `useFitText`). Okuma kipinde (`reading`, Anasayfa'nın brif balonu gibi): yanındaki cümleye döner,
 * gözleri satırları tarar ve göz kırpar (ürün sahibi: "orb hareketsiz … yazıya doğru dönmüyor").
 * `mascotState="idle"`: panelin uyku döngüsünü atlar — uyuyan küre cümleye bakamazdı.
 */
export function OrbToken() {
  return (
    <span aria-hidden="true" inert className="welcome-orbtok">
      <span className="welcome-orbtok-in">
        <BrandOrb surface="dashboard" state="idle" mascotState="idle" size={ORB_TOKEN_PX} reading />
      </span>
    </span>
  )
}
// 19 px yazıda kartın 2,5em kutusu (≈ 43 px): cümlenin iki satırı boyunda.
const ORB_TOKEN_PX = 42

/** Bugünkü toplantıların sahipleri: üst üste binen, beyaz halkalı, her biri kendi renginde pullar (en çok üç). */
export function Coins({ people }) {
  if (!people?.length) return null
  return (
    <span aria-hidden="true" className="welcome-coins">
      {people.map((p, i) => (
        <span key={p.key} className="welcome-coin" data-tone={(i % 4) + 1}>
          <span>{p.initials}</span>
        </span>
      ))}
    </span>
  )
}
