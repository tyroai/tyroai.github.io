import { actionButtonClass } from "@/components/common/actionButtonClass"

// Panonun hap dili (klasör kapıları, "+N" çipi): çerçevesiz yumuşak zemin, dokunmatikte 44 px.
// Görünüş `files.css` › `.files-chip`.
export const CHIP = "files-chip"

// Bölüm başlığının eylemi (sıralama, not defteri seçimi — `docs/design-system.md` › Sayfa ritmi):
// satır içi boy (`control-sm`, dokunmatikte 44), gri kapsül, çerçevesiz.
export const SECTION_ACTION = actionButtonClass({ tone: "soft", size: "inline" })
