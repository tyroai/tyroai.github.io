// Bildirim panelinin metinleri (Türkçe) yalnız panelin parçasıyla iner; bkz. lib/i18nDictionaries.
// Çan düğmesinin iki metni (bell.title, bell.aria) çekirdekte.
import { strings } from "@/data/strings.tr.bell"
import { addTurkishPart } from "@/lib/i18nDictionaries"

addTurkishPart(strings)
