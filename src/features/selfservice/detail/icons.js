import Airplane01Icon from "@hugeicons/core-free-icons/Airplane01Icon"
import ArrowDataTransferHorizontalIcon from "@hugeicons/core-free-icons/ArrowDataTransferHorizontalIcon"
import BedDoubleIcon from "@hugeicons/core-free-icons/BedDoubleIcon"
import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import CalendarCheckIn01Icon from "@hugeicons/core-free-icons/CalendarCheckIn01Icon"
import Car01Icon from "@hugeicons/core-free-icons/Car01Icon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import Coins01Icon from "@hugeicons/core-free-icons/Coins01Icon"
import CreditCardIcon from "@hugeicons/core-free-icons/CreditCardIcon"
import DocumentValidationIcon from "@hugeicons/core-free-icons/DocumentValidationIcon"
import Exchange01Icon from "@hugeicons/core-free-icons/Exchange01Icon"
import FuelStationIcon from "@hugeicons/core-free-icons/FuelStationIcon"
import HashtagIcon from "@hugeicons/core-free-icons/HashtagIcon"
import Invoice01Icon from "@hugeicons/core-free-icons/Invoice01Icon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import Money03Icon from "@hugeicons/core-free-icons/Money03Icon"
import Mortarboard01Icon from "@hugeicons/core-free-icons/Mortarboard01Icon"
import Note01Icon from "@hugeicons/core-free-icons/Note01Icon"
import ParkingAreaCircleIcon from "@hugeicons/core-free-icons/ParkingAreaCircleIcon"
import Passport01Icon from "@hugeicons/core-free-icons/Passport01Icon"
import PencilIcon from "@hugeicons/core-free-icons/PencilIcon"
import PresentationBarChart01Icon from "@hugeicons/core-free-icons/PresentationBarChart01Icon"
import Restaurant01Icon from "@hugeicons/core-free-icons/Restaurant01Icon"
import Store01Icon from "@hugeicons/core-free-icons/Store01Icon"
import Tag01Icon from "@hugeicons/core-free-icons/Tag01Icon"
import TaxiIcon from "@hugeicons/core-free-icons/TaxiIcon"
import TestTube01Icon from "@hugeicons/core-free-icons/TestTube01Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { foldText } from "@/lib/selfServiceStatus"

/** Ayrıntı alanının simgesi (`selfService.field.<key>` ile aynı anahtar); bilinmeyen → not. */
const FIELD = {
  company: Building03Icon,
  sourceCompany: Building03Icon,
  targetCompany: ArrowDataTransferHorizontalIcon,
  date: Calendar03Icon,
  dates: Calendar03Icon,
  reportDate: Calendar03Icon,
  requested: Calendar03Icon,
  planned: CalendarCheckIn01Icon,
  startTime: Clock01Icon,
  endTime: Clock01Icon,
  location: Location01Icon,
  costLocation: Location01Icon,
  paymentMode: CreditCardIcon,
  documented: DocumentValidationIcon,
  receipt: Invoice01Icon,
  balance: Coins01Icon,
  amountMst: Money03Icon,
  amountReporting: Money03Icon,
  exchangeRate: Exchange01Icon,
  people: UserGroupIcon,
  costCenter: HashtagIcon,
  code: Tag01Icon,
  vendor: Store01Icon,
}
export const fieldIcon = (key) => FIELD[key] ?? Note01Icon

// Kategori adındaki sözcük → simge; ilk uyan kazanır ("Taşıt Akaryakıt" yakıt, "Taşıt Kira" araç).
const CATEGORY = [
  [["akaryakit", "yakit", "fuel"], FuelStationIcon],
  [["otopark", "parking"], ParkingAreaCircleIcon],
  [["ucus", "ucak", "flight"], Airplane01Icon],
  [["konaklama", "otel", "hotel"], BedDoubleIcon],
  [["yemek", "agirlama", "meal"], Restaurant01Icon],
  [["ulasim", "taksi", "taxi"], TaxiIcon],
  [["tasit", "kira", "arac"], Car01Icon],
  [["egitim", "training"], Mortarboard01Icon],
  [["fuar", "toplanti", "organizasyon"], PresentationBarChart01Icon],
  [["pasaport", "harc", "vize"], Passport01Icon],
  [["kirtasiye"], PencilIcon],
  [["analiz"], TestTube01Icon],
]

/** Masraf kaleminin kategori simgesi (ERP kodu ya da adı üzerinden); tanınmazsa fatura. */
export function categoryIcon(line) {
  const text = foldText(`${line?.categoryName ?? ""} ${line?.category ?? ""}`)
  return CATEGORY.find(([words]) => words.some((w) => text.includes(w)))?.[1] ?? Invoice01Icon
}
