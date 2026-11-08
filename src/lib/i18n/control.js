// Denetim Merkezi panelinin metinleri (Türkçe) yalnız panelin parçasıyla iner; bkz. lib/i18nDictionaries.
// Header düğmesinin üç metni (control.title, control.onFocus, control.onPresent) çekirdekte.
import { strings } from "@/data/strings.tr.control"
import { addTurkishPart } from "@/lib/i18nDictionaries"

addTurkishPart(strings)
