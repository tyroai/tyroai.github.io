import UserCircleIcon from "@hugeicons/core-free-icons/UserCircleIcon"
import SquareLock02Icon from "@hugeicons/core-free-icons/SquareLock02Icon"
import PaintBoardIcon from "@hugeicons/core-free-icons/PaintBoardIcon"
import Notification01Icon from "@hugeicons/core-free-icons/Notification01Icon"
import HardDriveIcon from "@hugeicons/core-free-icons/HardDriveIcon"
import Robot01Icon from "@hugeicons/core-free-icons/Robot01Icon"
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon"

/**
 * Profilin bölümleri. Kimlik `?tab=` değerinin kendisi: eski bağlantılar (access, preferences,
 * notifications, catalog, orb) çeviri tablosu olmadan çalışır. Sıra okuma sırası: önce kim
 * olduğum, sonra neye eriştiğim, nasıl göründüğü, bildirimler; tarayıcı dökümü en sonda
 * (en seyrek iş). Yönetim grubu yalnız yöneticide.
 */
export const SECTIONS = [
  {
    id: "account",
    group: "mine",
    icon: UserCircleIcon,
    labelKey: "profile.section.account",
    descKey: "profile.section.account.desc",
  },
  {
    id: "access",
    group: "mine",
    icon: SquareLock02Icon,
    labelKey: "profile.section.access",
    descKey: "profile.access.subtitle",
  },
  {
    id: "preferences",
    group: "mine",
    icon: PaintBoardIcon,
    labelKey: "profile.section.preferences",
    descKey: "profile.prefs.subtitle",
  },
  {
    id: "notifications",
    group: "mine",
    icon: Notification01Icon,
    labelKey: "settings.notify.sectionTitle",
    descKey: "profile.section.notifications.desc",
  },
  {
    id: "storage",
    group: "mine",
    icon: HardDriveIcon,
    labelKey: "profile.section.storage",
    descKey: "profile.section.storage.desc",
  },
  {
    id: "catalog",
    group: "admin",
    icon: Robot01Icon,
    labelKey: "profile.section.catalog",
    descKey: "profile.section.catalog.desc",
  },
  {
    id: "orb",
    group: "admin",
    icon: SparklesIcon,
    labelKey: "profile.section.orb",
    descKey: "profile.section.orb.desc",
  },
]

export const DEFAULT_SECTION = "account"

const KNOWN = new Set(SECTIONS.map((s) => s.id))
const ADMIN = new Set(SECTIONS.filter((s) => s.group === "admin").map((s) => s.id))

export const isAdminSection = (id) => ADMIN.has(id)
export const sectionById = (id) => SECTIONS.find((s) => s.id === id) ?? null

/** Menüde görünen bölümler: yönetim grubu yalnız kesin "evet"te (`true`). */
export function visibleSections(adminVerdict) {
  return SECTIONS.filter((s) => s.group !== "admin" || adminVerdict === true)
}

/**
 * Adresteki `tab` → açılacak bölüm. Bilinmeyen ya da boş → `fallback` (masaüstünde Hesap,
 * telefonda kök liste = `null`). Yönetim bölümünden düşüş YALNIZ kesin "hayır"da (`false`):
 * cevap beklenirken (`undefined`) ya da sorulamadığında (`UNKNOWN`) istenen bölüm korunur,
 * yoksa yöneticinin `?tab=catalog` bağlantısı ilk karede düşer ve cevap gelince geri dönmez.
 */
export function resolveSection(requested, adminVerdict, fallback = DEFAULT_SECTION) {
  if (!requested || !KNOWN.has(requested)) return fallback
  if (ADMIN.has(requested) && adminVerdict === false) return fallback
  return requested
}

/** Bölümü değiştiren adres: öteki parametreler (ör. kataloğun `sub`u) korunur. */
export function searchWithTab(search, id) {
  const next = new URLSearchParams(search)
  if (id) next.set("tab", id)
  else next.delete("tab")
  const text = next.toString()
  return text ? `?${text}` : ""
}
