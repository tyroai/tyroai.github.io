import BankIcon from "@hugeicons/core-free-icons/BankIcon"
import Briefcase01Icon from "@hugeicons/core-free-icons/Briefcase01Icon"
import Cash01Icon from "@hugeicons/core-free-icons/Cash01Icon"
import FileRemoveIcon from "@hugeicons/core-free-icons/FileRemoveIcon"
import FileValidationIcon from "@hugeicons/core-free-icons/FileValidationIcon"
import HandshakeIcon from "@hugeicons/core-free-icons/HandshakeIcon"
import MoreHorizontalCircle01Icon from "@hugeicons/core-free-icons/MoreHorizontalCircle01Icon"
import Presentation01Icon from "@hugeicons/core-free-icons/Presentation01Icon"
import Store01Icon from "@hugeicons/core-free-icons/Store01Icon"

/**
 * Avans alanlarının seçime göre ikonu (yalnız formda): amaç, ödeme ve belge adını okumadan
 * tanınsın. Amaçların kendi tonu da var (izin türleri gibi); ödeme ve belge markanın tonunda.
 */
const PURPOSE = {
  business: Briefcase01Icon,
  fair: Store01Icon,
  congress: Presentation01Icon,
  visit: HandshakeIcon,
  other: MoreHorizontalCircle01Icon,
}

// Amaç tonları: yeşil, sarı ve kırmızı yok — onlar durum renkleri.
const PURPOSE_TONE = {
  business: "indigo",
  fair: "fuchsia",
  congress: "sky",
  visit: "teal",
  other: "slate",
}

const CHOICE = {
  bank: BankIcon,
  cash: Cash01Icon,
  documented: FileValidationIcon,
  undocumented: FileRemoveIcon,
}

/** Amacın ikonu; bilinmeyen (şablona sonradan eklenen) amaçta çanta. */
export const purposeIcon = (key) => PURPOSE[key] ?? Briefcase01Icon

/** Amacın ikon kutusu tonu; bilinmeyende markanınki. */
export const purposeTone = (key) => PURPOSE_TONE[key] ?? "brand"

/** Ödeme ya da belge seçeneğinin ikonu; seçim yoksa alanın ilk seçeneğininki. */
export const choiceIcon = (value, fallback) => CHOICE[value] ?? CHOICE[fallback] ?? BankIcon
