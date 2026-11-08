import Baby01Icon from "@hugeicons/core-free-icons/Baby01Icon"
import BabyBottleIcon from "@hugeicons/core-free-icons/BabyBottleIcon"
import BeachIcon from "@hugeicons/core-free-icons/BeachIcon"
import FlowerIcon from "@hugeicons/core-free-icons/FlowerIcon"
import MoneyRemove02Icon from "@hugeicons/core-free-icons/MoneyRemove02Icon"
import StethoscopeIcon from "@hugeicons/core-free-icons/StethoscopeIcon"
import UserTime01Icon from "@hugeicons/core-free-icons/UserTime01Icon"
import WeddingIcon from "@hugeicons/core-free-icons/WeddingIcon"

/** İzin türünün ikonu ve tonu (yalnız formda): türü adını okumadan tanıtır. */
export const LEAVE_KIND_LOOK = {
  annual: { icon: BeachIcon, tone: "sky" },
  excuse: { icon: UserTime01Icon, tone: "violet" },
  sick: { icon: StethoscopeIcon, tone: "teal" },
  paternity: { icon: Baby01Icon, tone: "blue" },
  maternity: { icon: BabyBottleIcon, tone: "pink" },
  marriage: { icon: WeddingIcon, tone: "fuchsia" },
  bereavement: { icon: FlowerIcon, tone: "slate" },
  unpaid: { icon: MoneyRemove02Icon, tone: "indigo" },
}

/** Bilinmeyen tür (şablona sonradan eklenen bir değer): markanın tonunda. */
export const leaveKindLook = (kind) => LEAVE_KIND_LOOK[kind] ?? { icon: BeachIcon, tone: "brand" }
