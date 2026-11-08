import Analytics01Icon from "@hugeicons/core-free-icons/Analytics01Icon"
import DashboardSquare01Icon from "@hugeicons/core-free-icons/DashboardSquare01Icon"
import Folder01Icon from "@hugeicons/core-free-icons/Folder01Icon"
import GridTableIcon from "@hugeicons/core-free-icons/GridTableIcon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import PresentationBarChart01Icon from "@hugeicons/core-free-icons/PresentationBarChart01Icon"
import Settings02Icon from "@hugeicons/core-free-icons/Settings02Icon"
import { RETURN_KEY, RM_PATH } from "@/lib/rm/paths"

// tyroRM sayfaları. Menüde yalnız hazır sayfa görünür; sıra işin akışı: bak, bul, dengele, götür.
// Portföy Genel Bakış'la açılır, projeler ve matris onu izler; kişiye bakanlar Ekip'te. Takip, Atama ve
// Teslim Tahmini direktörün kararıyla arayüzde yok (veri planda durur).
export const RM_VIEWS = [
  { key: "genel", group: "portfolio", icon: DashboardSquare01Icon, label: "rm.nav.overview" },
  { key: "projeler", group: "portfolio", icon: Folder01Icon, label: "rm.nav.projects" },
  { key: "matris", group: "portfolio", icon: GridTableIcon, label: "rm.nav.matrix" },
  { key: "kapasite", group: "team", icon: Analytics01Icon, label: "rm.nav.capacity" },
  { key: "kaynaklar", group: "team", icon: UserGroupIcon, label: "rm.nav.resources" },
  { key: "sunum", group: "report", icon: PresentationBarChart01Icon, label: "rm.nav.present" },
  {
    key: "ayarlar",
    group: "system",
    icon: Settings02Icon,
    label: "rm.nav.settings",
    editorOnly: true,
  },
]

export const RM_GROUPS = [
  { key: "portfolio", label: "rm.nav.group.portfolio" },
  { key: "team", label: "rm.nav.group.team" },
  { key: "report", label: "rm.nav.group.report" },
  { key: "system", label: "rm.nav.group.system" },
]

export const LAST_VIEW_KEY = "tyro-rm-last-view"

export function viewOf(key, edit) {
  const v = RM_VIEWS.find((x) => x.key === key)
  return v && (!v.editorOnly || edit) ? v : null
}

export function rmHref(view, params = {}) {
  const q = new URLSearchParams({ view, ...params })
  return `${RM_PATH}?${q.toString()}`
}

export function rememberView(key) {
  try {
    window.localStorage.setItem(LAST_VIEW_KEY, key)
  } catch {
    // Depolama kapalıysa son görünüm hatırlanmaz; açılış Genel Bakış olur.
  }
}

export function lastView() {
  try {
    return window.localStorage.getItem(LAST_VIEW_KEY)
  } catch {
    return null
  }
}

/** "← TYRO": bölüme gelinen sayfa (oturumda), yoksa Anasayfa. */
export function returnPath() {
  try {
    const p = window.sessionStorage.getItem(RETURN_KEY)
    return p && !p.startsWith(RM_PATH) ? p : "/myspace"
  } catch {
    return "/myspace"
  }
}
