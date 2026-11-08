import Doc01Icon from "@hugeicons/core-free-icons/Doc01Icon"
import File01Icon from "@hugeicons/core-free-icons/File01Icon"
import Note01Icon from "@hugeicons/core-free-icons/Note01Icon"
import Pdf01Icon from "@hugeicons/core-free-icons/Pdf01Icon"
import Ppt01Icon from "@hugeicons/core-free-icons/Ppt01Icon"
import Xls01Icon from "@hugeicons/core-free-icons/Xls01Icon"

// Belge türünün rengi Office'inkine yakın: tanıdık bir ipucu, süs değil.
export const FILE_KIND = {
  Word: [Doc01Icon, "bg-blue-500/12 text-blue-600 dark:text-blue-400"],
  Excel: [Xls01Icon, "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"],
  PowerPoint: [Ppt01Icon, "bg-orange-500/12 text-orange-600 dark:text-orange-400"],
  Pdf: [Pdf01Icon, "bg-red-500/12 text-red-600 dark:text-red-400"],
  OneNote: [Note01Icon, "bg-purple-500/12 text-purple-600 dark:text-purple-400"],
}
export const FILE_OTHER = [File01Icon, "bg-muted text-muted-foreground"]
