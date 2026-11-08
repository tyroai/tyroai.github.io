// Günün okuması ve hava cümlesinin metinleri (Türkçe) yalnız onları kullanan tembel parçayla iner;
// bkz. lib/i18nDictionaries.
import { strings } from "@/data/strings.tr.insight"
import { addTurkishPart } from "@/lib/i18nDictionaries"

addTurkishPart(strings)
