import ContactBookIcon from "@hugeicons/core-free-icons/ContactBookIcon"
import FireIcon from "@hugeicons/core-free-icons/FireIcon"
import UserStar01Icon from "@hugeicons/core-free-icons/UserStar01Icon"

// Kimlikler adreste (`?sec=`) ve yer imlerinde: adlar değişse de kimlik değişmez.
export const FEED_SECTIONS = [
  // Popüler: gündemdeki gönderiler — "gündemde" simgesi alev.
  { id: "agenda", labelKey: "feed.section.agenda", icon: FireIcon },
  { id: "important", labelKey: "feed.section.important", icon: UserStar01Icon },
  // Bul: kişiler, ofisler ve dosyalar (kimlik eski adıyla `docs` — adresler ve yer imleri bozulmasın).
  // Simge rehber: büyüteç aramaya ait, telefonda sekme satırının sonundaki arama düğmesiyle karışıyordu.
  { id: "docs", labelKey: "feed.section.docs", icon: ContactBookIcon },
]

// Dar ekranın "#SanaÖzel" çipinin adresteki değeri (`?tag=personal`; kanal etiketi değil).
export const PERSONAL = "personal"

// Sekmelerin üstündeki başlık: kaş (verinin geldiği yer) + bölümün adı.
export const SECTION_HEADING = {
  agenda: { eyebrow: "feed.agenda.eyebrow", title: "feed.agenda.title" },
  important: { eyebrow: "feed.important.eyebrow", title: "feed.important.list.title" },
  docs: { eyebrow: "myfiles.eyebrow", title: "feed.docs.title" },
}
